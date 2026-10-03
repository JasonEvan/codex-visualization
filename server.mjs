import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCodex, readContext } from './codex-reader.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function arg(name) { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; }
const port = Number(arg('--port') || 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Port harus antara 1024 dan 65535.');
const codexHome = arg('--codex-home');
const config = arg('--config');
const allowedHosts = new Set([`localhost:${port}`, `127.0.0.1:${port}`]);
let cached, pending;
async function snapshot() {
  if (cached && Date.now() - cached.time < 4000) return cached.data;
  if (!pending) pending = (async () => {
    const [codex, context] = await Promise.all([readCodex(codexHome), readContext(config)]);
    const data = { ...codex, context, checkedAt: new Date().toISOString(), refreshSeconds: 5 };
    cached = { time: Date.now(), data }; return data;
  })().finally(() => pending = null);
  return pending;
}
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png' };
export function createRequestHandler({ getSnapshot = snapshot } = {}) { return async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  if (!allowedHosts.has(req.headers.host) || (req.headers.origin && ![`http://localhost:${port}`, `http://127.0.0.1:${port}`].includes(req.headers.origin))) {
    res.writeHead(403); res.end('Hanya akses localhost asal yang sama.'); return;
  }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow:'GET, HEAD' }); res.end(); return; }
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/api/world') {
      const data = await getSnapshot(); res.writeHead(200, { 'Content-Type':'application/json; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : JSON.stringify(data)); return;
    }
    // Serve public assets only; vendored Three.js works fully offline.
    const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const file = path.resolve(here, 'public', relative);
    if (!file.startsWith(path.join(here, 'public') + path.sep)) { res.writeHead(403); res.end(); return; }
    let body = await readFile(file);
    res.writeHead(200, { 'Content-Type':types[path.extname(file)] || 'application/octet-stream' }); res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) { res.writeHead(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500); res.end('Tidak tersedia.'); }
}; }
const server = http.createServer(createRequestHandler());
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} sedang digunakan. Coba npm start -- --port 4174` : error.message); process.exitCode = 1; });
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) server.listen(port, '127.0.0.1', () => console.log(`\n  Kantor Kecil\n  Buka http://localhost:${port}\n  Pembaca sesi lokal hanya-baca, pembaruan setiap 5 detik.\n  Ctrl+C untuk berhenti. Tidak ada deploy atau telemetri.\n`));
