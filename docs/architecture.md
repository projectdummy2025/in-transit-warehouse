# Arsitektur Teknis: In-Transit Warehouse Management System

## 1. Ringkasan Sistem

Ledger transaksi inventaris *append-only* berkinerja tinggi yang dioptimalkan untuk pelacakan *in-transit* cepat, pengelolaan mutasi volume tinggi, dan eksekusi pengiriman berbasis FIFO pada skenario Distribution Center (DC).

---

## 2. Tech Stack &amp; Ekosistem

- **Runtime &amp; Package Manager**: Bun (TypeScript) via Bun Workspaces (`workspace:*`)
- **Monorepo Build Orchestrator**: Turborepo (`turbo`)
- **Backend Framework**: Hono (`apps/server`)
- **Frontend Framework**: Vite + React + TypeScript + Tailwind CSS (`apps/web`)
- **Database &amp; Engine**: SQLite (`bun:sqlite`) via Drizzle ORM
  - Mode: **WAL (Write-Ahead Logging)** (`PRAGMA journal_mode = WAL;`) untuk konkurensi tinggi (read tidak memblokir append-only write).
- **Validasi &amp; Kontrak**: Zod (`packages/shared`)
- **Protokol Real-Time**: **SSE (Server-Sent Events)** (`/api/events/activity-stream`) untuk live log aktivitas dan alert aging satu arah yang aman via HTTP/2 standar.

---

## 3. Struktur Monorepo (Bun Workspaces + Turborepo)

```
in-transit/
├── apps/
│   ├── server/               # Backend Service (Hono + Bun + bun:sqlite)
│   │   ├── src/
│   │   │   ├── modules/      # Inbound, Mutation, Outbound, Aging
│   │   │   ├── db/           # Drizzle schema, client, & migrations
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── web/                  # Frontend Service (Vite + React + TS)
│       ├── src/
│       │   ├── components/   # Scanner UI, Quick-keys, Live SSE Activity Log
│       │   ├── hooks/        # Global Barcode Listener, Optimistic Updates, useSSE
│       │   └── pages/        # Staging Grid, Operator Workbench
│       └── package.json
│
├── packages/
│   └── shared/               # Shared TS Contracts & Schemas
│       ├── src/
│       │   ├── schemas/      # Zod validation schemas
│       │   └── types/        # Domain types & DTOs
│       └── package.json
│
├── package.json              # Root workspace definition (Bun packageManager)
├── turbo.json                # Turborepo task pipeline configuration
└── bunfig.toml
```

### 3.1 Konfigurasi Turborepo Pipeline (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

### 3.2 Resolusi Dependensi Internal (`workspace:*`)

Aplikasi internal (seperti `apps/server` dan `apps/web`) mengimpor `packages/shared` menggunakan protokol Bun workspace:

```json
{
  "name": "@in-transit/server",
  "dependencies": {
    "@in-transit/shared": "workspace:*"
  }
}
```

---

## 4. Strategi High-Throughput Lingkungan DC

1. **Frontend (Vite + React)**:
   - **Keyboard &amp; Scanner-First**: Listener global `onKeyDown` untuk barcode scanner tanpa mewajibkan fokus pada elemen input.
   - **Optimistic UI + Local Queue**: Aksi pemindaian langsung direfleksikan di UI; request mutasi dikirim secara asinkron ke background.
   - **Virtual Scrolling**: Rendering daftar log aktivitas ribuan baris tanpa degradasi performa browser.
   - **Resilient SSE Reconnection**: Konsumsi stream dengan `EventSource` standar yang otomatis *auto-reconnect* jika koneksi jaringan gudang drop.
2. **Backend (Hono + Bun)**:
   - **Append-Only Fast Write**: Data log mutasi bersifat murni `INSERT` untuk memaksimalkan throughput penulisan.
   - **SQLite WAL Mode**: Pembacaan analitik dan polling dwell-time tidak mengunci (*lock*) proses penulisan mutasi LPN baru.
   - **Transaksi Atomik**: Perpindahan LPN dijamin dalam satu transaksi basis data (`UPDATE lpns` + `INSERT mutation_logs`).
   - **Kontrak Tipe Terintegrasi**: Penggunaan schema Zod terpusat dari `packages/shared` untuk eliminasi redundansi validasi.

---

## 5. Skema Basis Data (SQLite)

```sql
-- Konfigurasi Performa SQLite WAL
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE skus (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK(unit IN ('PCS', 'BOX', 'PALLET')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('INBOUND', 'TRANSIT', 'OUTBOUND')),
  capacity INTEGER NOT NULL DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lpns (
  id TEXT PRIMARY KEY,
  lpn_code TEXT NOT NULL UNIQUE,
  sku_id TEXT NOT NULL REFERENCES skus(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  status TEXT NOT NULL CHECK(status IN ('RECEIVED', 'STAGED', 'PICKED', 'DISPATCHED')),
  current_location_id TEXT NOT NULL REFERENCES locations(id),
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  dispatched_at DATETIME
);

CREATE TABLE mutation_logs (
  id TEXT PRIMARY KEY,
  lpn_id TEXT NOT NULL REFERENCES lpns(id),
  from_location_id TEXT NOT NULL REFERENCES locations(id),
  to_location_id TEXT NOT NULL REFERENCES locations(id),
  operator_id TEXT NOT NULL,
  moved_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lpns_location ON lpns(current_location_id);
CREATE INDEX idx_lpns_status ON lpns(status);
CREATE INDEX idx_lpns_received_at ON lpns(received_at);
CREATE INDEX idx_mutation_lpn ON mutation_logs(lpn_id);
```

---

## 6. API Endpoints &amp; Event Streams

### Inbound

- `POST /api/inbound/receive`
  - Request Body: `{ sku_code, quantity, location_code, operator_id }`
  - Respon/Aksi: Membuat `LPN` baru di `INBOUND_DOCK` dengan status `RECEIVED`.

### Mutasi (Internal Move)

- `POST /api/mutations/move`
  - Request Body: `{ lpn_code, to_location_code, operator_id }`
  - Respon/Aksi: Memperbarui `LPN.current_location_id` dan `status` (`STAGED`), mencatat `mutation_logs`, serta broadcast event ke SSE.

### Outbound (Dispatch)

- `POST /api/outbound/dispatch`
  - Request Body: `{ lpn_code, outbound_location_code, operator_id }`
  - Respon/Aksi: Memvalidasi urutan FIFO, memindahkan LPN ke `OUTBOUND_DOCK`, menandai status `DISPATCHED`, serta broadcast event ke SSE.

### Pemantauan &amp; Live Streaming

- `GET /api/inventory/staging`
  - Query Parameter: `?max_hours=24`
  - Respon: Daftar LPN di area staging beserta durasi huni (*dwell-time*).
- `GET /api/inventory/history/:lpn_code`
  - Respon: Riwayat lengkap mutasi LPN terkait.
- `GET /api/events/activity-stream` (SSE)
  - Respon Stream: Event stream real-time untuk log mutasi dan notifikasi peringatan *dwell-time* terlewati.

---

## 7. Pembagian Kerja Tim (3 Developer)

- **Developer 1 (Backend Core &amp; DB)**: Konstruksi Hono server, Drizzle ORM + SQLite (WAL Mode), API Inbound/Mutation/Outbound, dan verifikasi engine FIFO.
- **Developer 2 (Frontend Operator UI)**: Konstruksi Vite + React frontend, scanner hook listener, antarmuka operator DC, visualisasi staging grid, dan integrasi SSE consumer.
- **Developer 3 (Shared Contracts &amp; SSE Stream)**: Paket `packages/shared` (Zod schemas &amp; types), modul publisher SSE di Hono, dan background worker pemantau dwell-time (&gt; 24 jam).

