# Previo Meta Evaluation

Dokumen ini merangkum:

- apa yang sudah dikerjakan dari sesi sebelumnya sampai hari ini
- keputusan produk dan arsitektur yang sudah diambil
- kondisi aplikasi saat ini
- evaluasi arah produk
- saran lanjutan yang paling masuk akal untuk fase berikutnya

Tujuan dokumen ini adalah membantu evaluasi `meta-level`, bukan dokumentasi implementasi detail per file.

---

## 1. Ringkasan Singkat

Secara keseluruhan, arah Previo sekarang sudah jauh lebih jelas dibanding sebelumnya.

Sebelumnya, aplikasi masih berada di area yang agak ambigu:

- apakah graph visual adalah source of truth
- apakah node bebas/custom masih menjadi bagian penting
- apakah input manual masih jalur utama
- apakah output task list dan summary benar-benar bisa dipercaya

Setelah serangkaian perubahan dan diskusi, arah Previo sekarang lebih tegas:

- `Previo bukan general whiteboard`
- `Previo bukan clone Jira/Notion`
- `Previo adalah import-first architecture synthesis tool`

Itu menurut saya adalah positioning yang paling kuat.

---

## 2. Apa Yang Sudah Dikerjakan

### A. Import-first strategy

Sudah dipindahkan ke model:

- source artifact dari luar bisa menjadi input utama
- normalized structured data menjadi canonical state
- manual input bukan jalur utama untuk node yang sudah punya source matang

Implikasinya:

- user tidak harus mengisi semua node satu per satu
- Previo lebih cocok menjadi alat `normalization + synthesis`
- produk lebih realistis untuk solo dev dan workflow client-facing

### B. Provenance dan source tracking

Sudah ditambahkan konsep:

- `source_type`
- `source_artifact`
- `generation_status`
- `override_status`
- `delivery_mode`

Ini penting karena sekarang aplikasi bisa membedakan:

- mana node hasil import
- mana node hasil generate
- mana node manual
- mana node yang sudah dioverride

Tanpa ini, summary dan task list akan sulit dipercaya.

### C. Methodology-aware planning

Sudah ada framing:

- `agile`
- `waterfall`
- `hybrid`

Yang berubah bukan task model dasarnya, tapi cara task digrouping dan ditampilkan.

Ini keputusan yang tepat karena:

- data canonical tetap stabil
- output planning bisa disesuaikan
- engine tidak bercabang terlalu liar

### D. Editor UX redesign

Editor sudah bergeser ke model:

- `Import existing source`
- `Generate draft`
- `Fill manually` hanya jika masih diizinkan

Ini perbaikan penting karena sebelumnya editor terasa terlalu padat dan memaksa user menulis terlalu banyak dari nol.

### E. QA dan pipeline

Sudah dilakukan penguatan pada:

- `typecheck`
- `lint`
- `unit test`
- `Playwright E2E`
- `prod smoke`
- visual regression baseline

Secara engineering quality, ini salah satu peningkatan paling penting.

### F. Tooling standardization

Repo sekarang distandardisasi ke:

- `Node.js 22`
- `pnpm`

Ini keputusan yang menurut saya benar untuk maintainability jangka panjang.

### G. README dan LICENSE

Sudah dirapikan agar lebih siap dipahami, dibagikan, dan dievaluasi.

---

## 3. Keputusan Produk Yang Sudah Terkunci

### 3.1 Source of truth

Yang menjadi source of truth:

- structured fields
- typed relations di dalam node
- normalized imported artifacts
- derived outputs yang dibentuk engine

Yang bukan source of truth:

- garis visual di canvas
- layout graph
- project notes
- free notes mentah

Keputusan ini sangat penting dan menurut saya benar.

### 3.2 Canvas graph

Canvas sekarang seharusnya dipahami sebagai:

- workflow map
- navigation layer
- progress layer
- validation visualization layer

Bukan:

- editor relasi bebas
- graph semantics engine

Ini menghilangkan konflik antara “apa yang dilihat user” dan “apa yang dibaca sistem”.

### 3.3 Add node policy

Keputusan sekarang:

- generic add node tidak lagi relevan untuk v1
- core nodes berasal dari template canonical
- optional typed node boleh ada di masa depan, tapi bukan node bebas

Ini menurunkan kompleksitas produk secara signifikan.

### 3.4 Blank template

Template `blank` sudah tidak cocok lagi dengan model canonical workflow.

Karena itu keputusan untuk menghapusnya sangat masuk akal.

### 3.5 Project notes

Catatan bebas dipindahkan menjadi:

- `project-level notes`
- non-canonical
- tidak ikut summary/task/validation

Ini keputusan yang sehat karena tetap memberi ruang berpikir untuk user tanpa merusak engine.

---

## 4. Evaluasi Kondisi Aplikasi Saat Ini

### Yang sudah kuat

#### 1. Arah produk makin jelas

Ini pencapaian terbesar.

Sekarang Previo tidak lagi terasa seperti aplikasi yang “ingin melakukan semuanya”, tapi mulai punya core identity yang lebih kuat:

- menerima artifact yang sudah ada
- merapikannya
- menghubungkannya
- memvalidasi
- menghasilkan task list dan summary

#### 2. Traceability foundation sudah ada

Relasi penting antarnode sudah mulai terbentuk:

- brief -> requirements
- requirements -> stories
- stories -> use cases
- use cases -> flowchart / sequence
- erd <-> dfd
- diagram/data/behavior -> task board
- semua -> summary

Ini sangat penting untuk membangun output yang masuk akal.

#### 3. QA baseline sudah solid

Untuk ukuran aplikasi produk yang masih berkembang, coverage dan gate saat ini sudah cukup baik untuk refactor lanjutan.

#### 4. Editor sekarang lebih masuk akal

Editor mode-first jauh lebih cocok dengan produk ini dibanding form panjang biasa.

---

## 5. Kelemahan atau Gap Yang Masih Terlihat

### 5.1 Task generation masih useful, tapi belum “review-ready by default”

Task generator sekarang sudah berguna sebagai starter backlog, tapi belum selalu terasa seperti output senior engineer atau tech lead.

Gap yang masih terlihat:

- task masih bisa terlalu generik
- grouping kadang masih mekanis
- dependency antar task belum eksplisit
- dedupe belum cukup cerdas
- belum selalu terasa seperti sprint-ready backlog

Kesimpulan:

- `usable`: ya
- `final planning grade`: belum

### 5.2 Summary sudah bagus, tapi belum jadi dokumen evaluasi kelas atas

Summary sekarang cukup representatif, tapi masih bisa naik kelas menjadi lebih “executive-review ready”.

Yang masih bisa ditambah:

- assumptions
- unresolved decisions
- key risks
- recommended next actions
- implementation confidence

### 5.3 Ingestion masih perlu diperdalam

Ini justru area dengan nilai bisnis terbesar.

Kalau import support masih terbatas, user akan balik ke input manual, dan itu bisa menurunkan adoption.

### 5.4 Domain selection belum diposisikan tegas

Pilihan seperti:

- SaaS
- Ecommerce
- Mobile Web

masih relevan, tapi harus dipahami sebagai:

- domain context
- prefill lens
- bukan workflow structure

Kalau ini tidak dipisah tegas, user akan bingung.

---

## 6. Evaluasi Strategis Produk

Menurut saya, produk ini paling kuat jika diarahkan ke posisi berikut:

> `Previo is an import-first architecture synthesis workspace that transforms scattered project artifacts into validated implementation structure, task plans, and review-ready summaries.`

Kenapa ini kuat:

- berbeda dari whiteboard tool
- berbeda dari docs tool
- berbeda dari task board tool
- dekat dengan masalah nyata solo dev dan freelancer
- cukup spesifik untuk dibangun
- cukup fleksibel untuk berkembang

Yang menurut saya jangan dilakukan:

- menjadikan Previo general visual knowledge graph
- membiarkan custom graph bebas menjadi pusat engine
- terlalu bergantung pada manual input panjang
- menambah terlalu banyak fitur tanpa memperkuat ingestion dan synthesis

---

## 7. Saran Lanjutan Yang Paling Masuk Akal

Kalau saya harus memilih arah implementasi berikutnya, urutannya akan seperti ini.

### Prioritas 1: Perkuat ingestion

Fokus:

- Markdown brief / PRD paste
- requirement table parser yang lebih kuat
- Jira / Linear CSV import yang lebih rapi
- DBML / SQL parser yang lebih tahan error
- Mermaid import yang lebih konsisten

Tujuan:

- user makin jarang isi manual
- value produk langsung terasa

### Prioritas 2: Traceability UI

Tambahkan tampilan yang membuat user mudah melihat:

- requirement ini turun ke story mana
- story ini dipakai use case mana
- use case ini sudah punya flowchart/sequence atau belum
- entity ini muncul di DFD atau belum

Ini akan jauh lebih berguna daripada membebaskan graph.

### Prioritas 3: Naikkan kualitas task generation

Fokus:

- dedupe lebih baik
- dependency task
- quality of naming
- grouping per feature / capability / phase
- backlog yang lebih dekat ke sprint planning

### Prioritas 4: Naikkan kualitas summary

Tambahkan section seperti:

- top project narrative
- assumptions
- missing decisions
- risk flags
- recommended next actions

### Prioritas 5: Artifact center

Pisahkan sumber input dari node editor.

Idealnya user punya satu tempat untuk melihat:

- artifact yang diimport
- source type
- parse status
- node target
- canonical result

Ini akan memperjelas mental model aplikasi.

---

## 8. Saran Yang Saya Ingin Terapkan Hari Ini atau Fase Berikutnya

Kalau saya lanjutkan dari kondisi sekarang, saya ingin menerapkan ini:

### A. Create project flow yang dipisah jadi 3 lapis

1. `Workflow`
   - Quick
   - Full

2. `Domain`
   - SaaS
   - Ecommerce
   - Mobile Web
   - Internal Tool
   - Marketplace
   - Content Platform

3. `Starter Content`
   - None
   - Light Prefill
   - Rich Prefill

Keuntungan:

- user lebih paham bedanya workflow vs domain
- engine tidak tercampur dengan pilihan konteks
- onboarding jadi lebih matang

### B. Node rule matrix final

Saya ingin memformalkan aturan per node:

- mana `import-first`
- mana `capture-first`
- mana `generate-first`
- mana `manual fallback only`
- mana `derived-only`

Ini akan membantu:

- UX
- validation
- task generation
- documentation
- future contributor onboarding

### C. Traceability panel

Bukan graph bebas, tapi panel sederhana yang menjawab:

- upstream source
- downstream dependency
- validation gaps
- task contribution

Menurut saya ini akan menaikkan trust user secara signifikan.

### D. Task generation v2

Fokus ke kualitas output, bukan kuantitas fitur baru.

---

## 9. Kesimpulan Akhir

Secara umum, saya menilai Previo sekarang sudah jauh lebih sehat dibanding titik awalnya.

Yang paling penting bukan sekadar banyak perubahan teknis, tapi arah produk dan arsitekturnya makin konsisten:

- canonical data lebih jelas
- graph tidak lagi membingungkan
- import lebih dihargai
- editor lebih masuk akal
- QA jauh lebih kuat

Kalau harus diringkas dalam satu kalimat:

> Previo sekarang mulai bergerak dari “tool eksperimen dokumentasi visual” menjadi “produk architecture-to-execution yang punya model data dan mental model yang lebih bisa dipercaya.”

Menurut saya itu perkembangan yang sangat baik.

---

## 10. Rekomendasi Final

Kalau kamu ingin menjaga momentum, saya sarankan fokus fase berikutnya ke:

1. ingestion depth
2. traceability visibility
3. task generation quality
4. summary quality
5. create-project flow yang memisahkan workflow vs domain

Bukan ke:

1. graph bebas
2. node custom
3. fitur tambahan yang tidak memperkuat source normalization

Kalau produk ini konsisten ke arah itu, saya rasa Previo punya identitas yang semakin kuat dan semakin layak dipakai serius.
