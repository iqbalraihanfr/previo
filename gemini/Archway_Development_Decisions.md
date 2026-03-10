# Archway — Development Decisions Log

> Keputusan-keputusan penting selama development Archway v3.
> Last updated: 2026-03-08

---

## 1. Hybrid Template Approach

**Konteks**: Archway v3 spec punya 10 node (Brief, Requirements, User Stories, Use Cases, Flowchart, DFD, ERD, Sequence, Task Board, Summary). Tapi untuk real use case solo dev yang kerjaan hariannya: terima BQ dari client → bikin task list → vibe coding, 10 node itu overkill.

**Keputusan**: Buat 2 template project:

| Template | Node | Status |
|----------|------|--------|
| **Quick Start** (default) | Brief → Requirements → ERD → Task Board → Summary | Stable, daily use |
| **Full Architecture** | Semua 10 node | "In Development" badge |

**Alasan**:
- Quick Start = workflow harian yang realistis (isi brief, tulis requirement, desain database, generate tasks, mulai coding)
- Full Architecture = untuk project yang butuh dokumentasi formal atau belajar SDLC
- User bisa tambah node optional (User Stories, Use Cases, dll) dari dropdown "Add Node" yang dinamis

---

## 2. Tab System: Guided sebagai Sumber Utama

**Konteks**: Setiap node editor punya beberapa tab (Guided, Mermaid, SQL, Notes, Files). Perlu kejelasan mana yang jadi "source of truth".

**Keputusan**: **Guided tab = satu-satunya sumber data** yang berpengaruh ke sistem.

| Tab | Fungsi | Pengaruh ke Sistem |
|-----|--------|-------------------|
| **Guided** | Isi data terstruktur | Generate diagram, tasks, validasi, export |
| **Mermaid** | Auto-generated dari Guided, bisa diedit manual | Edit manual tidak balik ke Guided |
| **SQL** (ERD only) | Paste SQL sebagai referensi | Belum di-parse otomatis |
| **Notes** | Catatan bebas | Tidak pengaruh apapun |
| **Files** | Upload dokumen referensi (BQ, quotation, mockup) | Tidak di-parse |

**Next dev**: Parse uploaded files (PDF/DOCX) → auto-extract ke Guided fields. Ditunda sampai app stable.

**UX**: Setiap tab punya hint text yang menjelaskan fungsinya supaya user tidak bingung.

---

## 3. Cross-Validation: 3 Severity Levels

**Keputusan**: Validation warnings punya 3 level severity:

| Severity | Warna | Arti |
|----------|-------|------|
| **Error** (merah) | Masalah serius, harus diperbaiki | UC reference ke UC yang tidak ada |
| **Warning** (kuning) | Potensi gap, sebaiknya diperbaiki | ERD entity orphan, scope tanpa FR |
| **Info** (biru) | Soft hint, opsional | Entity belum disebut di User Story |

**Alasan**: Tidak semua warning sama pentingnya. Info-level untuk hal yang "nice to have" tapi tidak blocking (CV-12, CV-16, CV-17).

---

## 4. Quick Start: Node yang Dipilih

**Konteks**: Dari 10 node, harus pilih mana yang essential untuk workflow solo dev.

**Keputusan**: 5 node → **Brief, Requirements, ERD, Task Board, Summary**

**Alasan**:
- **Brief**: Selalu perlu — capture konteks project, target user, scope
- **Requirements**: Core — tulis apa yang harus dibangun (FR + NFR)
- **ERD**: Database design — hampir semua project butuh ini
- **Task Board**: Output utama — generate task list buat mulai coding
- **Summary**: Auto-generated overview + export

**Yang di-skip (bisa ditambah manual)**:
- User Stories: Berguna tapi bisa di-skip kalau solo dev yang udah paham konteks
- Use Cases: Formal, lebih untuk tim/dokumentasi
- Flowchart: Bisa divisualisasi mental atau digambar terpisah
- DFD: Academic/formal, jarang dipakai solo dev
- Sequence: Berguna untuk API design tapi bisa ditambah nanti

---

## 5. Add Node: Dropdown Dinamis

**Keputusan**: Dropdown "Add Node" di workspace hanya menampilkan node yang **belum ada** di project.

**Alasan**: Quick Start project mulai dengan 5 node, tapi user bisa expand ke 10 node kapan saja tanpa harus buat project baru. Dropdown otomatis menyesuaikan.

---

## 6. Implementation Priority

**Keputusan**: Urutan implementasi berdasarkan impact:

1. ✅ **Phase 1**: Node Editors (structured fields) — fondasi data
2. ✅ **Phase 2**: Cross-Validation Rules (18 rules) — intelligence
3. ⬜ **Phase 3**: Task Deduplication — quality
4. ⬜ **Phase 4**: Summary Polish — presentation

**Alasan**: Structured input harus benar dulu sebelum validasi bisa jalan. Validasi harus jalan sebelum summary bisa akurat.

---

## Tech Decisions

| Area | Keputusan | Alasan |
|------|-----------|--------|
| **State** | Dexie (IndexedDB) + useLiveQuery | Offline-first, reactive, no backend needed |
| **Cross-node data** | Custom hooks (useBriefFields, useRequirementsFields) | Reactive data fetching antar editor |
| **Backward compat** | Auto-migration on load | Old projects tidak rusak saat upgrade |
| **Diagram generation** | Auto from structured fields | User tidak perlu tulis Mermaid syntax |
| **Task generation** | Deterministic from structured_fields | Consistent, reproducible, state-mergeable |
