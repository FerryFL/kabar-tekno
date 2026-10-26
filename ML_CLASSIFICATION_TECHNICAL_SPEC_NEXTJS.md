# Technical Spec Next.js: ORM, Admin, dan Orkestrasi ML

## 1. Database schema Drizzle

Tambahkan enum:

```ts
export const classificationLabel = pgEnum("classification_label", [
  "baik",
  "buruk",
  "netral",
]);

export const modelStatus = pgEnum("model_status", [
  "training",
  "ready",
  "failed",
  "retired",
]);
```

Tambahkan tabel berikut:

### `news_labels`

- `id` UUID primary key
- `news_id` UUID FK `news.id`, cascade delete
- `label` `classificationLabel`, not null
- `labeled_by` UUID FK `users.id`
- `created_at`, `updated_at`
- unique index `news_id` untuk satu label aktif per berita

### `ml_models`

- `id` UUID primary key
- `version` text unique
- `algorithm` text, default `linear_svm`
- `status` `modelStatus`
- `artifact_name` text
- `training_sample_count`, `test_sample_count` integer
- `class_distribution` JSONB
- `metrics` JSONB nullable
- `is_active` boolean default false
- `created_by` UUID FK `users.id`
- `created_at`, `updated_at`

### `ml_evaluation_runs`

- `id` UUID primary key
- `model_id` UUID FK `ml_models.id`
- `status` text: `running | completed | failed`
- `random_seed`, `test_size`, `cross_validation_folds`
- accuracy, macro/weighted precision, recall, F1
- `confusion_matrix` JSONB
- `error_message` nullable
- `started_at`, `finished_at`

### `news_predictions`

- `id` UUID primary key
- `news_id` UUID FK `news.id`
- `model_id` UUID FK `ml_models.id`
- `label` `classificationLabel`
- `confidence` numeric
- `scores` JSONB nullable
- `predicted_at`
- index `(news_id, predicted_at)` dan `(model_id, predicted_at)`

Tambahkan `relations(...)` Drizzle untuk seluruh tabel klasifikasi. Gunakan migration resmi Drizzle; jangan mengubah database manual tanpa migration.

## 2. Server-side API boundary

Buat helper server-only, misalnya `src/features/classification/ml-client.ts`, dengan fungsi:

```ts
trainAndTest(payload): Promise<TrainTestResponse>
predict(payload): Promise<PredictionResponse>
checkMlHealth(): Promise<HealthResponse>
```

Konfigurasi:

```text
ML_SERVICE_URL=http://ml-service:5000
ML_SERVICE_TOKEN=<secret>
ML_REQUEST_TIMEOUT_MS=120000
```

Helper wajib:

- memakai `fetch` server-side
- menambahkan Bearer token
- memakai `AbortSignal.timeout`
- memvalidasi response dengan Zod
- memetakan HTTP error menjadi error aplikasi yang aman
- tidak meneruskan token user ke Flask

Route Handler atau Server Action tidak boleh memasukkan credential Flask ke response browser.

## 3. Server Actions dan queries

Implementasikan:

- `labelNewsAction(newsId, label)`
- `labelNewsBulkAction(newsIds, label)`
- `trainAndTestModelAction()`
- `predictNewsAction(newsIds, modelId)`
- `activateModelAction(modelId)`
- `getClassificationDataset()`
- `getEvaluationRuns()`
- `getLatestPredictions(newsIds, modelId?)`

Semua action:

1. Memeriksa `isAdmin()`.
2. Memvalidasi input dengan Zod.
3. Menggunakan transaction saat menyimpan hasil terkait.
4. Melakukan `revalidatePath` untuk halaman admin dan berita.

## 4. UI admin

Tambahkan halaman klasifikasi yang berisi:

- daftar berita belum berlabel
- filter dan pagination
- pilihan label per baris
- bulk selection dan bulk labeling
- tombol Train & Test
- daftar model dan status
- metrik evaluation
- tombol Activate Model
- form prediction batch
- hasil label/confidence terbaru

Training berjalan melalui server-side action. UI menampilkan loading, success, validation error, dan service unavailable secara terpisah.

## 5. Transaction dan consistency

- Insert model dengan status `training` sebelum request Flask.
- Jika Flask sukses, update model menjadi `ready` dan insert evaluation run.
- Jika Flask gagal, update model menjadi `failed` dengan error aman.
- Aktivasi model lama dan baru dilakukan dalam satu transaction.
- Prediction hanya boleh disimpan untuk model berstatus `ready`.
- Label manual tidak pernah ditimpa prediction.

## 6. Testing Next.js

- migration dan FK
- validasi enum label
- admin authorization
- dataset query hanya mengambil label valid
- parsing response Flask
- timeout, 401, 503, dan malformed response
- rollback saat penyimpanan hasil gagal
- model activation hanya satu active model
- regression fitur RSS, bookmark, read tracking, dan news detail

