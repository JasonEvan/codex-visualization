# Kantor Kecil

Kantor 3D interaktif berbahasa Indonesia untuk mengamati sesi **Codex CLI di komputermu**. Tidak perlu deploy, akun, API key, atau layanan cloud. Pustaka Three.js disertakan di `public/vendor`, sehingga aplikasi tidak perlu mengunduh dependensi atau aset saat berjalan.

## Mulai dalam satu perintah

1. Pasang **Node.js 20 atau lebih baru** (disarankan versi LTS).
2. Ekstrak folder `kantor-kecil` dari ZIP.
3. Buka terminal di folder itu, lalu jalankan:

```sh
npm start
```

Alternatif tanpa npm: `node server.mjs`.

4. Buka **http://localhost:4173** di browser modern dengan WebGL/akselerasi hardware aktif.
5. Jalankan **Codex CLI seperti biasa** di terminal lain, dari folder proyekmu.

**Tidak perlu `npm install` atau build.** Jangan membuka `index.html` langsung, karena pembaca lokal memerlukan server.

Yang perlu tetap berjalan:

- Terminal `npm start`: menyajikan website sekaligus pembaca log lokal.
- Browser: menampilkan kantor dan menjalankan animasi/suara.
- Codex CLI: hanya jika kamu ingin ada pekerjaan nyata dan event baru. Log historis tetap terbaca setelah Codex ditutup.

`Ctrl+C` di terminal server menghentikan website/pembaca. Menutup tab tidak menghentikan atau membatalkan Codex. Menyalakan kantor juga **tidak menjalankan agent**.

## Beberapa proyek dan agent

- Secara default membaca `~/.codex/sessions`. Variabel lingkungan `CODEX_HOME` dihormati jika sudah disetel.
- Sesi dikelompokkan menurut `cwd` (folder kerja). Setiap folder proyek mendapat ruangan sendiri.
- Setiap sesi mendapat satu karakter. Beberapa sesi bisa menempati satu ruangan.
- Nama agent dari metadata digunakan jika tersedia; selain itu karakter mendapat nama visual seperti Rubi/Mika. Nama/kepribadian/outfit visual tidak mengubah agent nyata.
- Subagent ditandai bila metadata `source.subagent.thread_spawn` tersedia. Metadata induk ditampilkan di detail.
- Worktree/folder berbeda dihitung sebagai proyek berbeda. Sesi lama tetap bisa muncul: ini bukan daftar proses aktif.
- Tanpa sesi yang dikenali, aplikasi membuka **Dunia contoh** dengan label jelas. Pilih **Sesi Codex** untuk melihat keadaan lokal yang sebenarnya.

Direktori Codex khusus:

```sh
npm start -- --codex-home "/path/ke/.codex"
```

Contoh Windows PowerShell:

```powershell
npm start -- --codex-home "$env:USERPROFILE\.codex"
```

Jika Codex berjalan di WSL, jalankan server di distro WSL yang sama agar pembaca melihat folder sesi yang sama. `--codex-home` menunjuk ke folder `.codex`, bukan ke folder `sessions` atau folder proyek.

Port lain jika 4173 sudah digunakan:

```sh
npm start -- --port 4174
```

Kemudian buka http://localhost:4174.

## Arti status — bukan klaim aktivitas langsung

Pembaca memeriksa metadata log setiap 5 detik. Ini **bukan koneksi langsung ke proses Codex**, bukan task runner, dan bukan fitur remote control.

| Tampilan | Bukti yang tersedia |
| --- | --- |
| Log Codex terbaca | Folder sesi dapat dibaca oleh server. |
| Giliran dimulai (log) | Ada event `task_started` dan pembaruan event dalam 2 menit. Proses yang masih berjalan **tidak** diverifikasi. |
| Giliran selesai (log) | Ada event `task_complete`. Hanya giliran terakhir yang terbaca; tidak menyatakan seluruh proyek selesai. |
| Giliran dibatalkan (log) | Ada event `turn_aborted`. |
| Status saat ini tidak diketahui | Penanda mulai ditemukan, tetapi event terakhir sudah lebih dari 2 menit. |
| Status tugas tidak tersedia | Metadata sesi terbaca, tetapi penanda tugas tidak dikenali. |
| Pembaca terputus | Browser gagal menjangkau server. Data sebelumnya mungkin sudah berubah. |

**Karakter sesi lokal mengikuti status log:** saat `started`, karakter berjalan melalui pintu ke meja ruang proyek dan tetap bekerja di sana. Saat `complete` atau `aborted`, karakter boleh menuju kafe dan beristirahat. Giliran baru langsung membalik arah perjalanan kembali ke meja tanpa teleport. Status `stale`, `unknown`, atau pembaca terputus menghentikan perjalanan/gerak kerja dengan keterangan menunggu status. Pembaruan status diterapkan setiap polling tanpa membangun ulang dunia. Gerakan ini ilustrasi status giliran, bukan rekaman tindakan spesifik (misalnya file yang sedang diedit). Karakter contoh dan penghuni umum tetap mempunyai rutinitas dekoratif. Nara di basement adalah maskot koordinator, bukan agent yang diam-diam menjalankan pekerjaan. Bimo adalah barista dekoratif. Tidak ada agent baru yang dibuat.

Format log Codex bisa berubah. Versi ini mengenali JSONL dengan `session_meta`, `turn_context`, dan `event_msg`. Format yang belum dikenal ditampilkan sebagai tidak tersedia; tidak ditebak.

Untuk menjaga pemindaian ringan, pembaca memindai maksimal 20.000 entri direktori dan 80 file sesi terbaru menurut waktu modifikasi, hingga kedalaman 5. File besar hanya dibaca pada 64 KiB pertama dan 384 KiB terakhir; penanda di bagian tengah bisa tidak terlihat. Sesi arsip di `archived_sessions` belum dibaca. Jumlah file yang dilewati dan pembatasan muncul di footer.

## Catatan, keputusan, dan hasil review

Salin `workspace.example.json` menjadi `workspace.local.json`, lalu **ganti semua nilai contoh**. `path` harus sama persis dengan `cwd` sesi agar menyatu dengan proyek tersebut.

```json
{
  "projects": [
    {
      "path": "/Users/kamu/code/proyek-asli",
      "name": "Aplikasi Toko",
      "description": "Merapikan pengalaman checkout.",
      "notes": [{"title": "Catatan arsitektur", "url": "https://example.com/catatan"}],
      "decisions": ["Checkout satu halaman disetujui"],
      "reviewed": [{"title": "Review PR checkout", "url": "https://example.com/review"}]
    }
  ],
  "notes": [{"title": "Indeks pengetahuan bersama", "url": "https://example.com/wiki"}]
}
```

Di JSON Windows, tulis backslash dua kali, misalnya `"C:\\Users\\kamu\\code\\proyek"`.

Jalankan:

```sh
npm start -- --config workspace.local.json
```

Berkas diperiksa ulang saat refresh. `notes` paling luar mengisi perpustakaan. Konteks per proyek tampil pada detail ruangan; catatan menambah buku dan keputusan/review mengisi papan. Furnitur serta buku dasar tetap dekoratif. `reviewed` adalah hasil yang **kamu nyatakan sudah direview**, bukan klaim review otomatis. Judul/tautan disimpan lokal; isi Notion/Drive/GitHub tidak otomatis diambil. Tautan hanya dibuka ketika kamu mengekliknya.

## Kontrol

- Seret kiri: putar peta.
- Gulir atau tombol − / +: zoom.
- Seret kanan: geser peta.
- Klik karakter atau ruangan: tampilkan detail.
- Daftar **Jelajahi ruangan** dan chip penghuni: alternatif klik 3D yang bisa dipakai lewat keyboard.
- **Tur ruangan**: langkah demi langkah, dengan fokus kamera dan detail tiap ruangan.
- Tombol ⌂: reset kamera; ⟳: putar 45°; Ⅱ / ▶: jeda / lanjutkan rutinitas.
- Pada layar sentuh: satu jari memutar, dua jari menggeser atau zoom.
- Musik dan suara kantor mati saat awal. Tombol ♫ membuka dua sakelar terpisah, volume, dan mute semua. Suara disintesis di browser, tanpa streaming; tab tersembunyi menghentikan suara sementara.
- Preferensi sistem **reduced motion** menjeda karakter saat awal.

Layout responsif untuk viewport HP. Server hanya menerima koneksi `127.0.0.1`, sehingga `localhost` pada HP fisik **tidak** membuka server di laptop. Tidak ada eksposur LAN atau internet dalam versi ini.

## Privasi dan batas akses

- Server hanya mendengarkan di `127.0.0.1` dan memeriksa `Host`/`Origin`.
- Tidak ada telemetri, analytics, CDN, API eksternal, pengiriman pesan, atau deploy.
- Log Codex hanya dibaca; tidak diubah atau dihapus. Aplikasi tidak membaca `auth.json`.
- Browser menerima nama/path proyek, identitas sesi, hubungan induk bila tersedia, serta timestamp/jenis penanda log. Isi prompt, pesan assistant, kode, command, dan output tool tidak dikirim sebagai data tampilan.
- Konteks yang kamu tulis di JSON dikirim ke browser lokal agar bisa ditampilkan.
- Animasi dunia contoh tidak menunjukkan background task.

## Pengujian dan struktur

```sh
npm run check
npm test
```

`server.mjs`: server HTTP lokal dengan pembatasan asal dan cache 4 detik. `codex-reader.mjs`: pembaca log hanya-baca dan konteks. `public/world.js`: geometri 3D, kamera, karakter, dan rutinitas. `public/app.js`: panel, sumber data, tur, dan audio. `public/session-motion.js`: perjalanan dan gerakan berdasarkan status sesi. `public/vendor`: Three.js r180 + OrbitControls dengan lisensi MIT asli.

Versi awal ini menggunakan geometri 3D bergaya mainan yang lebih sederhana daripada gambar mockup. Ini adalah dunia yang dirender dan dianimasikan, bukan gambar mockup dengan hotspot.

Pembaca log dan respons HTTP diuji dengan fixture lokal. Di lingkungan pembuatan, sandbox melarang socket localhost dan proses browser, sehingga visual/WebGL serta interaksi browser **belum diverifikasi langsung**. Lihat `TESTING.md` untuk pemeriksaan cepat di komputermu.
