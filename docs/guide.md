# Panduan Instalasi & Verifikasi Sistem

## 1. Prasyarat Sistem
- **Runtime**: [Bun](https://bun.sh) >= 1.1

---

## 2. Instalasi & Setup

```bash
# Instal seluruh dependensi monorepo
bun install

# Inisialisasi basis data SQLite lokal & push skema Drizzle
bun run --filter @in-transit/server db:push

# Jalankan seeder master data (SKU & Locations)
bun run --filter @in-transit/server db:seed

# Jalankan server Hono dan frontend Vite
bun run dev
```

---

## 3. Skenario Pengujian Alur Kerja

1. **Penerimaan Inbound LPN**:
   - Kirim `POST /api/inbound/receive` dengan `sku_code: "SKU-1001"`, `quantity: 50`, `location_code: "IN-DOCK-01"`.
   - Verifikasi: Record LPN terbentuk dengan status `RECEIVED` pada lokasi `IN-DOCK-01`.

2. **Mutasi ke Transit Staging**:
   - Kirim `POST /api/mutations/move` dengan target `to_location_code: "STAGE-A-01"`.
   - Verifikasi: Status LPN berubah ke `STAGED`, `mutation_logs` bertambah 1 entri, dan event terkirim ke stream SSE.

3. **Pemantauan Dwell-Time / Aging**:
   - Akses `GET /api/inventory/staging`.
   - Verifikasi: LPN terdata dengan kalkulasi dwell-time aktual dan indikator status aging (`NORMAL` / `OVERDUE`).

4. **Pengiriman Outbound (FIFO Dispatch)**:
   - Kirim `POST /api/outbound/dispatch` ke lokasi `OUT-DOCK-01`.
   - Verifikasi: Sistem memvalidasi urutan FIFO, status LPN beralih ke `DISPATCHED`, dan LPN terlepas dari buffer staging.
