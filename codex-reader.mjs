import { readdir, stat, open, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const MAX_FILES = 80;
const MAX_ENTRIES = 20000;
const HEAD_BYTES = 64 * 1024;
const TAIL_BYTES = 384 * 1024;
const clean = (v, n = 160) => typeof v === 'string' ? v.slice(0, n) : '';
const timestamp = value => { const n = Date.parse(value); return Number.isFinite(n) ? new Date(n).toISOString() : null; };
const portableName = p => p.split(/[\\/]/).filter(Boolean).at(-1) || 'Proyek';

export function parseSession(text, fallbackId = '', now = Date.now()) {
  let meta, cwd = '', lastEventAt = null, marker = null;
  const history = [];
  for (const line of text.split('\n')) {
    let row; try { row = JSON.parse(line); } catch { continue; }
    const p = row.payload || {};
    if (row.type === 'session_meta') { meta = p; cwd = clean(p.cwd, 1024); }
    if (row.type === 'turn_context' && typeof p.cwd === 'string') cwd = clean(p.cwd, 1024);
    if (row.type !== 'event_msg') continue;
    const at = timestamp(row.timestamp);
    if (at) lastEventAt = at;
    const labels = { task_started: 'Giliran dimulai', task_complete: 'Giliran selesai', turn_aborted: 'Giliran dibatalkan' };
    if (labels[p.type] && at) {
      marker = { type: p.type, at, label: labels[p.type] };
      history.push(marker);
    }
  }
  if (!meta || !cwd) return null;
  let status = 'unknown';
  if (marker?.type === 'task_complete') status = 'complete';
  else if (marker?.type === 'turn_aborted') status = 'aborted';
  else if (marker?.type === 'task_started') status = now - Date.parse(lastEventAt || marker.at) < 120000 ? 'started' : 'stale';
  const spawn = meta.source?.subagent?.thread_spawn;
  return {
    id: clean(meta.id) || fallbackId,
    projectPath: cwd,
    projectName: portableName(cwd),
    name: clean(meta.agent_nickname, 60) || (spawn ? 'Subagent' : 'Codex'),
    role: clean(meta.agent_role, 100) || (spawn ? 'Subagent Codex' : 'Agent coding'),
    parentId: clean(spawn?.parent_thread_id),
    model: clean(meta.model, 60),
    startedAt: timestamp(meta.timestamp),
    lastEventAt, status, marker, history: history.slice(-5),
  };
}

async function sessionText(file, size) {
  const fd = await open(file, 'r');
  try {
    const head = Buffer.alloc(Math.min(size, HEAD_BYTES));
    const first = await fd.read(head, 0, head.length, 0);
    if (size <= HEAD_BYTES) return head.subarray(0, first.bytesRead).toString('utf8');
    const start = Math.max(HEAD_BYTES, size - TAIL_BYTES);
    const tail = Buffer.alloc(size - start);
    const last = await fd.read(tail, 0, tail.length, start);
    // Incomplete lines at either boundary are ignored by the parser.
    return head.subarray(0, first.bytesRead).toString('utf8') + '\n' + tail.subarray(0, last.bytesRead).toString('utf8');
  } finally { await fd.close(); }
}

export async function readCodex(root = process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), now = Date.now()) {
  const folder = path.join(root, 'sessions');
  const candidates = [];
  let examined = 0, inaccessible = 0, truncated = false;
  async function walk(dir, depth = 0) {
    if (depth > 5 || examined >= MAX_ENTRIES) { truncated = true; return; }
    const entries = await readdir(dir, { withFileTypes: true });
    // Date directories sort newest-first, so bounded scans prefer recent sessions.
    entries.sort((a,b) => b.name.localeCompare(a.name));
    for (const entry of entries) {
      if (++examined > MAX_ENTRIES) { truncated = true; break; }
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) { try { await walk(full, depth + 1); } catch { inaccessible++; } }
      else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        try { const s = await stat(full); candidates.push({ file: full, size: s.size, modified: s.mtimeMs }); } catch { inaccessible++; }
      }
    }
  }
  try { await walk(folder); } catch (error) {
    return { connection: error.code === 'ENOENT' ? 'missing' : 'error', sessions: [], scanned: 0, skipped: 0, limited: false, message: error.code === 'ENOENT' ? 'Folder sesi Codex belum ditemukan.' : 'Folder sesi Codex tidak dapat dibaca.' };
  }
  candidates.sort((a,b) => b.modified - a.modified);
  const sessions = [];
  let skipped = inaccessible;
  for (const item of candidates.slice(0, MAX_FILES)) {
    try {
      const session = parseSession(await sessionText(item.file, item.size), path.basename(item.file, '.jsonl'), now);
      if (session && !sessions.some(s => s.id === session.id)) sessions.push(session); else skipped++;
    } catch { skipped++; }
  }
  return { connection: 'readable', sessions, scanned: Math.min(candidates.length, MAX_FILES), skipped, limited: truncated || candidates.length > MAX_FILES,
    message: sessions.length ? 'Metadata sesi lokal terbaca. Ini bukan koneksi langsung ke proses agent.' : 'Folder terbaca, belum ada sesi dengan format yang dikenali.' };
}

export async function readContext(configFile) {
  if (!configFile) return { projects: [], notes: [], warning: null };
  try {
    const raw = JSON.parse(await readFile(configFile, 'utf8'));
    const items = input => (Array.isArray(input) ? input : []).slice(0, 100).map(x => {
      if (typeof x === 'string') return { title: clean(x, 200) };
      let url;
      try { const u = new URL(x.url); if (['https:', 'http:'].includes(u.protocol)) url = u.href; } catch {}
      return { title: clean(x.title, 200), url };
    }).filter(x => x.title);
    return {
      projects: (Array.isArray(raw.projects) ? raw.projects : []).slice(0, 100).filter(p => typeof p.path === 'string').map(p => ({ path: p.path, name: clean(p.name, 100) || portableName(p.path), description: clean(p.description, 1000), notes: items(p.notes), decisions: items(p.decisions), reviewed: items(p.reviewed) })),
      notes: items(raw.notes), warning: null,
    };
  } catch (error) { return { projects: [], notes: [], warning: error.code === 'ENOENT' ? 'Berkas konteks belum ditemukan.' : 'Berkas konteks tidak valid atau tidak terbaca.' }; }
}
