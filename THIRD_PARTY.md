# Komponen pihak ketiga

Three.js **r180 / 0.180.0**, termasuk OrbitControls, digunakan untuk rendering 3D.

- Sumber: https://github.com/mrdoob/three.js/tree/r180
- File asli: `build/three.module.min.js`, `build/three.core.min.js`, `examples/jsm/controls/OrbitControls.js`.
- OrbitControls hanya diubah pada alamat import agar menunjuk ke modul lokal `./three.module.min.js`.
- Lisensi MIT asli disertakan pada `public/vendor/LICENSE`; header lisensi pada modul dipertahankan.
- Tidak ada font, audio, atau gambar yang perlu diunduh saat aplikasi berjalan.

Playwright hanya dipakai pada skrip uji browser opsional dan tidak disertakan atau diperlukan untuk menjalankan aplikasi.
