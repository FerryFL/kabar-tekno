# PRD Flask: Machine Learning Service Klasifikasi Berita

## Tujuan

Menyediakan service Flask mandiri untuk melatih, menguji, dan menjalankan prediction model multiclass SVM berbasis teks berita.

## Scope

- REST API Flask.
- Validasi dataset dan request.
- Penggabungan title dan description.
- TF-IDF vectorization.
- Linear SVM multiclass.
- Stratified train/test split 80/20.
- Cross-validation pada data training.
- Metrik accuracy, precision, recall, F1, dan confusion matrix.
- Penyimpanan dan loading model artifact.
- Prediction batch.
- Health check dan service authentication.

## Non-goals

- Login user aplikasi.
- Akses langsung ke PostgreSQL Kabar Tekno.
- UI admin.
- Deep learning, GPU, atau transformer.
- Menentukan model aktif di sisi bisnis.

## Acceptance criteria

- Service berjalan mandiri dalam container.
- Dataset dengan tiga kelas valid dapat dilatih dan diuji.
- Dataset kosong, label invalid, kelas hilang, dan data kurang menghasilkan error terstruktur.
- Pipeline TF-IDF dan SVM disimpan sebagai satu artifact.
- Prediction mengembalikan label valid, confidence, dan skor kelas.
- Endpoint internal menolak token yang salah.
- Artifact dapat dimuat ulang setelah restart container.
- Hasil memakai random seed yang dapat direproduksi.

## Contract dengan Next.js

Flask menyediakan:

- `GET /health`
- `POST /v1/train-test`
- `POST /v1/predict`

Semua endpoint selain health membutuhkan Bearer token internal. Response error selalu memiliki `error.code`, `error.message`, dan optional `error.details`.

