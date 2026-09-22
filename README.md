# In-Transit Warehouse Management System

Sistem Manajemen Pergudangan (WMS) modern yang dirancang untuk pelacakan *License Plate Number* (LPN), pemantauan durasi huni (*dwell-time*) di area *transit staging*, serta pengendalian mutasi barang berbasis FIFO pada *Distribution Center* (DC).

## Fitur Utama

- **Pelacakan LPN Real-Time**: Monitoring posisi dan status barang dari *Inbound* hingga *Outbound*.
- **Penegakan Aturan FIFO**: Prioritisasi otomatis pengeluaran barang berdasarkan waktu masuk staging.
- **Monitoring Dwell-Time &amp; Alerting**: Peringatan otomatis untuk LPN yang mengendap melebihi ambang batas batas waktu (24 jam).
- **Audit Log Mutasi Imutabel**: Riwayat perpindahan barang tercatat secara *append-only* untuk akurasi data.

## Alur Kerja Utama

```mermaid
flowchart LR
    A["Inbound Dock<br/>(Penerimaan)"] --> B["Transit Staging / Buffer<br/>(Dwell-Time & FIFO)"]
    B --> C["Outbound Dock<br/>(Pengiriman)"]
```

## Dokumentasi Teknis

- [Spesifikasi Fungsional](docs/spec.md) — Entitas domain, *state machine*, dan aturan bisnis.
- [Arsitektur Teknis](docs/architecture.md) — Skema database, *tech stack*, dan API endpoint.
- [Panduan Setup &amp; Verifikasi](docs/guide.md) — Prosedur instalasi dan pengujian.

