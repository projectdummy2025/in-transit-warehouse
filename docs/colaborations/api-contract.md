# Kontrak API & Skema Pertukaran Data

Dokumen ini mendefinisikan kontrak komunikasi antara Backend (`apps/server`) dan Frontend (`apps/web`) menggunakan Zod Schema terpusat dari `packages/shared`. Seluruh entitas dan atribut menggunakan konvensi **English-First**.

---

## 1. Standar Respons API

### Format Respons Sukses
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-09-23T10:00:00.000Z"
}
```

### Format Respons Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | CONFLICT_FIFO | CAPACITY_EXCEEDED",
    "message": "Deskripsi kendala yang terjadi"
  },
  "timestamp": "2026-09-23T10:00:00.000Z"
}
```

---

## 2. Endpoint RESTful

### 2.1 Inbound Receive
Mendaftarkan LPN baru saat barang tiba di Inbound Dock.

- **Method**: `POST`
- **Path**: `/api/inbound/receive`
- **Request Payload**:
  ```json
  {
    "sku_code": "SKU-1001",
    "quantity": 50,
    "location_code": "IN-DOCK-01",
    "operator_id": "OP-042"
  }
  ```
- **Zod Schema**:
  ```typescript
  export const InboundReceiveSchema = z.object({
    sku_code: z.string().min(1),
    quantity: z.number().int().positive(),
    location_code: z.string().min(1),
    operator_id: z.string().min(1)
  });
  ```
- **Response Data (`201 Created`)**:
  ```json
  {
    "id": "uuid-v4",
    "lpn_code": "LPN-20260923-0001",
    "sku_id": "uuid-sku",
    "quantity": 50,
    "status": "RECEIVED",
    "current_location_id": "uuid-loc-inbound",
    "received_at": "2026-09-23T10:00:00.000Z"
  }
  ```

---

### 2.2 Mutation Move (Internal Transit)
Memindahkan LPN antar lokasi (contoh: dari Inbound ke Staging Transit). Transaksi wajib atomik dan mencatat riwayat ke `mutation_logs`.

- **Method**: `POST`
- **Path**: `/api/mutations/move`
- **Request Payload**:
  ```json
  {
    "lpn_code": "LPN-20260923-0001",
    "to_location_code": "STAGE-A-01",
    "operator_id": "OP-042"
  }
  ```
- **Zod Schema**:
  ```typescript
  export const MutationMoveSchema = z.object({
    lpn_code: z.string().min(1),
    to_location_code: z.string().min(1),
    operator_id: z.string().min(1)
  });
  ```
- **Response Data (`200 OK`)**:
  ```json
  {
    "lpn_code": "LPN-20260923-0001",
    "status": "STAGED",
    "from_location_code": "IN-DOCK-01",
    "to_location_code": "STAGE-A-01",
    "moved_at": "2026-09-23T10:15:00.000Z"
  }
  ```

---

### 2.3 Outbound Dispatch (FIFO)
Mengeluarkan LPN menuju Outbound Dock dengan validasi FIFO wajib.

- **Method**: `POST`
- **Path**: `/api/outbound/dispatch`
- **Request Payload**:
  ```json
  {
    "lpn_code": "LPN-20260923-0001",
    "outbound_location_code": "OUT-DOCK-01",
    "operator_id": "OP-088"
  }
  ```
- **Response Data (`200 OK`)**:
  ```json
  {
    "lpn_code": "LPN-20260923-0001",
    "status": "DISPATCHED",
    "dispatched_at": "2026-09-23T12:00:00.000Z"
  }
  ```

---

### 2.4 Staging Inventory & Aging
Mendapatkan daftar LPN di area transit dengan kalkulasi durasi huni (*dwell-time*).

- **Method**: `GET`
- **Path**: `/api/inventory/staging?max_hours=24`
- **Response Data (`200 OK`)**:
  ```json
  [
    {
      "lpn_code": "LPN-20260923-0001",
      "sku_code": "SKU-1001",
      "sku_name": "Widget A",
      "quantity": 50,
      "location_code": "STAGE-A-01",
      "dwell_time_minutes": 145,
      "is_overdue": false,
      "received_at": "2026-09-23T10:00:00.000Z"
    }
  ]
  ```

---

## 3. Kontrak Real-Time SSE (Server-Sent Events)

- **Endpoint**: `GET /api/events/activity-stream`
- **Headers**:
  ```
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
  ```

### Struktur Event Data

#### Event 1: `mutation:created`
Dipicu setiap terjadi perpindahan fisik LPN.
```json
event: mutation:created
data: {
  "lpn_code": "LPN-20260923-0001",
  "from_location": "IN-DOCK-01",
  "to_location": "STAGE-A-01",
  "operator_id": "OP-042",
  "timestamp": "2026-09-23T10:15:00.000Z"
}
```

#### Event 2: `aging:overdue`
Dipicu oleh background worker saat ada LPN melampaui batas huni 24 jam.
```json
event: aging:overdue
data: {
  "lpn_code": "LPN-20260922-0089",
  "location_code": "STAGE-B-04",
  "dwell_time_hours": 24.5,
  "timestamp": "2026-09-23T10:30:00.000Z"
}
```
