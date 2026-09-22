# Spesifikasi Fungsional: In-Transit Warehouse Management System

## 1. Konvensi Penamaan Database (English-First)

Seluruh nama tabel, kolom/atribut, indeks, dan nilai enum pada database wajib menggunakan bahasa Inggris (English-First) dengan format `snake_case` untuk kolom/tabel dan `UPPERCASE` untuk nilai status/tipe.

---

## 2. Entitas Domain (Domain Entities)

### SKU (Stock Keeping Unit)
- `id`: Unique identifier (UUID/Text)
- `code`: SKU code (e.g., `SKU-1001`)
- `name`: Item description
- `unit`: Packaging unit (`PCS`, `BOX`, `PALLET`)
- `created_at`: Record creation timestamp

### Location
- `id`: Unique identifier (UUID/Text)
- `code`: Bin location code (e.g., `IN-DOCK-01`, `STAGE-A-01`, `OUT-DOCK-01`)
- `type`: Location category (`INBOUND`, `TRANSIT`, `OUTBOUND`)
- `capacity`: Maximum LPN capacity
- `created_at`: Record creation timestamp

### LPN (License Plate Number)
- `id`: Unique identifier (UUID/Text)
- `lpn_code`: Unique barcode/tracking code (e.g., `LPN-2026-0001`)
- `sku_id`: Foreign key reference to `skus.id`
- `quantity`: Quantity of items in this LPN
- `status`: Current lifecycle state (`RECEIVED`, `STAGED`, `PICKED`, `DISPATCHED`)
- `current_location_id`: Foreign key reference to `locations.id`
- `received_at`: Timestamp when received at Inbound
- `dispatched_at`: Timestamp when dispatched from Outbound

### Mutation Log
- `id`: Unique identifier (UUID/Text)
- `lpn_id`: Foreign key reference to `lpns.id`
- `from_location_id`: Foreign key reference to origin `locations.id`
- `to_location_id`: Foreign key reference to destination `locations.id`
- `operator_id`: Identifier of operator performing the move
- `moved_at`: Timestamp of physical movement

---

## 3. LPN Lifecycle & State Machine

```
[Supplier Truck]
       │
       ▼
  (RECEIVED)  ──► Location: INBOUND (Dock)
       │
       ▼
   (STAGED)   ──► Location: TRANSIT (Buffer Area / Dwell-Time Active)
       │
       ▼
   (PICKED)   ──► Location: TRANSIT (Staging Exit Path)
       │
       ▼
 (DISPATCHED) ──► Location: OUTBOUND (Dock / Transport Dispatch)
```

### State Transitions
1. `RECEIVED`: LPN created at Inbound Dock upon receipt.
2. `STAGED`: LPN placed into transit staging/buffer location.
3. `PICKED`: LPN selected and moved for outbound loading.
4. `DISPATCHED`: LPN confirmed loaded to outbound vehicle; inventory lifecycle completed.

---

## 4. Alur Kerja Utama (Core Workflow)

### Inbound Flow
1. Menerima barang fisik di lokasi bertipe `INBOUND`.
2. Generate `lpn_code` unik, kaitkan dengan `sku_id` dan `quantity`.
3. Set status awal LPN ke `RECEIVED`.

### Transit / Mutation Flow
1. Operator memindahkan LPN dari lokasi `INBOUND` ke lokasi bertipe `TRANSIT`.
2. Sistem memvalidasi kapasitas lokasi tujuan (`locations.capacity`).
3. Sistem mencatat log mutasi imutabel pada `mutation_logs` (`from_location_id` -> `to_location_id`).
4. Update `lpns.current_location_id`, ubah status ke `STAGED`, dan mulai perhitungan *dwell-time*.

### Outbound Flow
1. Mengambil LPN berstatus `STAGED` dari lokasi `TRANSIT` berdasarkan urutan FIFO (`received_at` terlama).
2. Memindahkan LPN ke lokasi bertipe `OUTBOUND`.
3. Sistem mencatat `mutation_logs` terakhir dan memperbarui status LPN menjadi `DISPATCHED` beserta `dispatched_at`.

---

## 5. Aturan Bisnis (Business Rules)

- **FIFO Enforcement**: Prioritas pengeluaran wajib mengutamakan LPN dengan `received_at` paling awal pada SKU yang sama.
- **Aging Alert**: LPN berstatus `STAGED` dengan durasi > 24 jam ditandai sebagai `OVERDUE` pada sistem monitoring.
- **Append-Only Mutation Log**: Tabel `mutation_logs` bersifat *strictly immutable* (hanya operasi `INSERT`, dilarang `UPDATE`/`DELETE`).
- **Single Active Location**: Satu LPN hanya dapat menempati tepat satu `current_location_id` pada satu waktu.
- **Strict Inventory Integrity**: Nilai `quantity` wajib positif (> 0) dan tidak boleh bernilai negatif.
