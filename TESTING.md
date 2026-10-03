# Pemeriksaan lokal

Jalankan `npm run check` dan `npm test`, lalu `npm start`.

1. Buka http://localhost:4173. Tanpa sesi lokal yang dikenali, **Dunia contoh** harus berlabel data contoh. Peta harus menampilkan ruangan, karakter, dan basement; tidak ada klaim proses aktif.
2. Coba putar, zoom, seret kanan, reset; klik ruangan dan karakter. Coba daftar ruangan menggunakan Tab/Enter. Panel harus sesuai pilihan.
3. Pilih **Tur ruangan**, maju/mundur. Kamera harus mendekati ruangan; pembaruan data setiap 5 detik tidak mengatur ulang langkah yang dipilih.
4. Jeda animasi. Karakter harus berhenti, sementara kamera tetap bisa dikontrol. Lanjutkan untuk melihat karakter berjalan melewati pintu ke kafe, istirahat, lalu pulang.
5. Pilih **Sesi Codex**. Jalankan Codex CLI pada proyekmu. Setelah paling lama sekitar 5 detik, sesi dengan format yang didukung harus muncul. Event selesai berarti giliran selesai, bukan seluruh proyek selesai.
6. Matikan server. Setelah permintaan refresh berikutnya gagal, panel harus menyatakan pembaca terputus dan tidak mengklaim status terkini. Jalankan kembali lalu perbarui.
7. Coba `--config workspace.local.json`; ganti judul catatan dan periksa panel setelah refresh. Jangan masukkan data contoh sebagai bukti review sungguhan.
8. Aktifkan musik dan suara kantor secara terpisah, geser volume, lalu **Matikan semua suara**. Tutup dialog dengan Escape. Awalnya tidak boleh ada suara.
9. Gunakan responsive mode browser pada 390 × 844. Peta tampil di atas, panel di bawah; tidak boleh ada scroll horizontal halaman. Periksa juga pembesaran teks 200%.
10. Jika 3D kosong, lihat pesan fallback, aktifkan akselerasi hardware, dan periksa console browser. Tangkapan layar/error console membantu diagnosis.

UI smoke test otomatis membutuhkan Playwright + Chromium. Kode pemeriksaan browser tersedia di `test/browser-smoke.mjs`; pemasangan alat uji itu opsional, bukan dependensi aplikasi. Jalankan server dahulu, pasang `npm install --no-save playwright` dan `npx playwright install chromium`, lalu `node test/browser-smoke.mjs`. Script ini tidak membaca atau mengirim prompt Codex, dan memakai Dunia contoh untuk pengujian.
