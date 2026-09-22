# Panduan Kolaborasi &amp; Pemecahan Tiket Tugas Developer

Dokumen ini berisi aturan kerja tim, konvensi Git, serta pemecahan tiket tugas secara rinci dan terstruktur untuk 3 developer pada proyek In-Transit Warehouse Management System.

---

## 1. Konvensi Git &amp; Alur Kerja

1. **Aturan Commit Message**:
   - Gunakan Bahasa Inggris sepenuhnya.
   - Dilarang menggunakan prefix konvensional (seperti `feat:`, `fix:`, `chore:`). Langsung jelaskan perubahan yang terjadi.
   - Contoh benar: `Add atomic move transaction and append mutation log`
   - Contoh salah: `feat: add move API` atau `tambah transaksi mutasi`
2. **Workflow Commit &amp; Push**:
   - Lakukan `git add` terkelompok (maksimal 3-4 file per commit).
   - Setiap kali melakukan `git commit`, wajib langsung diiringi `git push`.
3. **Strategi Branch**:
   - `main`: Branch produksi teruji.
   - `dev-backend`: Pekerjaan Developer 1.
   - `dev-frontend`: Pekerjaan Developer 2.
   - `dev-shared-stream`: Pekerjaan Developer 3.

---

## 2. Pemecahan Tiket Tugas Terperinci (3 Developer)

### Developer 1: Backend Core &amp; Database Engine (`apps/server`)

Fokus: Inisialisasi basis data SQLite, transaksi mutasi atomik, dan engine FIFO.

- **DEV1-TICK-01-A: Setup Workspace Server &amp; Hono Framework**
  - Buat berkas `apps/server/package.json` dan inisialisasi Hono app di `apps/server/src/index.ts`.
  - Konfigurasi router awal dan middleware error handling.
- **DEV1-TICK-01-B: Konfigurasi SQLite &amp; Drizzle ORM**
  - Buat client Drizzle di `apps/server/src/db/client.ts` mengolah `bun:sqlite`.
  - Tambahkan skrip inisialisasi WAL mode (`PRAGMA journal_mode = WAL;`) dan `PRAGMA foreign_keys = ON;`.
  - Buat berkas `drizzle.config.ts` untuk pengolahan migrasi.
- **DEV1-TICK-01-C: Definisi Skema Tabel Database**
  - Definisikan skema Drizzle di `apps/server/src/db/schema.ts` untuk tabel `skus`, `locations`, `lpns`, dan `mutation_logs`.
  - Buat indeks pada `current_location_id`, `status`, `received_at`, dan `lpn_id`.
  - Jalankan generasi migrasi awal.
- **DEV1-TICK-02-A: Service &amp; Controller Inbound Receive**
  - Buat controller `POST /api/inbound/receive`.
  - Implementasikan pembuatan LPN baru dengan status `RECEIVED` dan penentuan lokasi awal `INBOUND`.
- **DEV1-TICK-02-B: Validasi Kapasitas Lokasi &amp; Generator LPN Code**
  - Buat fungsi pengecekan kapasitas lokasi (`locations.capacity`).
  - Buat utilitas pembuat kode unik LPN (`LPN-YYYYMMDD-XXXX`).
- **DEV1-TICK-03-A: Transaksi Atomik Mutasi Internal**
  - Buat controller `POST /api/mutations/move`.
  - Bungkus eksekusi `UPDATE lpns` (lokasi baru &amp; status `STAGED`) dan `INSERT mutation_logs` dalam satu transaksi atomik Drizzle.
- **DEV1-TICK-03-B: Outbound Dispatch &amp; Engine Pengecekan FIFO**
  - Buat query pemastian FIFO (memilih LPN dengan `received_at` terlama untuk SKU terkait).
  - Buat controller `POST /api/outbound/dispatch` yang memvalidasi ketaatan FIFO sebelum mengubah status LPN ke `DISPATCHED`.
- **DEV1-TICK-03-C: Integration Testing API Mutasi**
  - Buat pengujian integrasi menggunakan `bun:test` untuk alur Inbound -&gt; Move -&gt; Dispatch.

---

### Developer 2: Frontend Operator Workbench &amp; UI (`apps/web`)

Fokus: Interface pemindaian barcode, antarmuka kerja operator DC, dan rendering log real-time.

- **DEV2-TICK-01-A: Setup Workspace Frontend &amp; Build Pipeline**
  - Inisialisasi Vite + React + TypeScript + Tailwind CSS pada `apps/web`.
  - Konfigurasi alias path dan sketsa layout dasar.
- **DEV2-TICK-01-B: Custom Hook Barcode Scanner Listener**
  - Buat custom hook `useBarcodeScanner` di `apps/web/src/hooks/useBarcodeScanner.ts`.
  - Implementasikan listener keyboard global `onKeyDown` dengan timer buffer untuk membedakan ketikan manual dan pemindaian cepat barcode scanner.
- **DEV2-TICK-01-C: Layout Base Workbench Operator DC**
  - Buat komponen layout antarmuka dengan kontras tinggi untuk lingkungan gudang.
  - Tambahkan penanda keyboard shortcut global.
- **DEV2-TICK-02-A: Halaman Inbound Scanner**
  - Buat antarmuka pemindaian barang masuk di `apps/web/src/pages/InboundPage.tsx`.
  - hubungkan input pemindaian dengan API `POST /api/inbound/receive`.
- **DEV2-TICK-02-B: Halaman Mutasi Scanner &amp; Optimistic UI**
  - Buat antarmuka pemindahan lokasi di `apps/web/src/pages/MutationPage.tsx`.
  - Penerapan *Optimistic UI* untuk memperbarui tampilan lokasi LPN secara instan sebelum respons server diterima.
- **DEV2-TICK-03-A: Komponen Visualisasi Staging Grid**
  - Buat komponen grid lokasi transit staging di `apps/web/src/components/StagingGrid.tsx`.
  - Tampilkan indikator persentase kapasitas lokasi dan pewarnaan status barang.
- **DEV2-TICK-03-B: Custom Hook SSE Consumer &amp; Live Activity Log**
  - Buat custom hook `useSSE` di `apps/web/src/hooks/useSSE.ts` memanfaatkan EventSource API dengan fitur *auto-reconnect*.
  - Buat komponen `LiveActivityLog.tsx` menggunakan virtual scrolling untuk menampilkan stream mutasi tanpa membebani memori browser.

---

### Developer 3: Shared Contracts, SSE Publisher &amp; Dwell-Time Alert Worker (`packages/shared` &amp; Streaming Service)

Fokus: Kontrak tipe data terpusat, pengiriman event stream SSE, dan pemantauan durasi huni (*dwell-time*).

- **DEV3-TICK-01-A: Setup Workspace Shared Package**
  - Buat berkas `packages/shared/package.json` dan `tsconfig.json`.
  - Konfigurasi skrip kompilasi dan skema ekspor paket.
- **DEV3-TICK-01-B: Pendefinisian Schema Zod Boundary API**
  - Buat Zod schema di `packages/shared/src/schemas/inbound.ts`, `mutation.ts`, dan `outbound.ts`.
  - Ekspor schema `InboundReceiveSchema`, `MutationMoveSchema`, dan `OutboundDispatchSchema`.
- **DEV3-TICK-01-C: Ekspor Tipe TypeScript &amp; Enum Domain**
  - Definisikan tipe DTO dan Enum status LPN (`RECEIVED`, `STAGED`, `PICKED`, `DISPATCHED`) serta tipe lokasi (`INBOUND`, `TRANSIT`, `OUTBOUND`).
- **DEV3-TICK-02-A: Modul Event Emitter pada Backend Hono**
  - Buat event emitter singleton di `apps/server/src/services/event-emitter.ts`.
- **DEV3-TICK-02-B: Endpoint SSE Activity Stream**
  - Buat controller `GET /api/events/activity-stream` di Hono server.
  - Set header HTTP `text/event-stream`, `no-cache`, dan `keep-alive`.
- **DEV3-TICK-02-C: Pengiriman Event Mutasi Real-Time**
  - Sambungkan service mutasi Developer 1 agar memicu event `mutation:created` dan `lpn:dispatched` ke event emitter SSE saat transaksi sukses.
- **DEV3-TICK-03-A: Service Pemantauan Dwell-Time Staging**
  - Buat query kalkulasi durasi huni LPN di lokasi `TRANSIT` (hitung selisih waktu `CURRENT_TIMESTAMP` dengan `received_at`).
  - Buat endpoint `GET /api/inventory/staging` yang menyertakan atribut `dwell_time_minutes` dan penanda boolean `is_overdue`.
- **DEV3-TICK-03-B: Background Worker Aging Alert (&gt;24 Jam)**
  - Buat background worker periodik di `apps/server/src/workers/aging-worker.ts` yang mengeksekusi pemeriksaan dwell-time setiap 5 menit.
  - Picu event SSE `aging:overdue` untuk setiap LPN yang melampaui batas huni 24 jam.
- **DEV3-TICK-03-C: End-to-End Test Event Stream &amp; Aging Worker**
  - Buat skrip pengujian untuk memverifikasi alur penerbitan event SSE dan akurasi deteksi *aging worker*.

---

## 3. Standar Kualitas Kode &amp; Proses Code Review

1. **Prinsip Kode Simpel**:
   - Panjang fungsi/komponen dibatasi maksimal 100-150 baris.
   - Kedalaman nesting maksimal 3 level. Pakai *Early Return* (Guard Clauses).
2. **Aturan Penamaan Codebase**:
   - Kode sumber: `camelCase` (Bahasa Inggris).
   - Skema DB &amp; API: `snake_case` (Bahasa Inggris).
3. **Validasi Boundary**:
   - Selalu pasang Zod schema pada tepi controller sebelum mengolah logika bisnis.

