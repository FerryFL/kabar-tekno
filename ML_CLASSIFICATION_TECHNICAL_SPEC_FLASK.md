# Technical Spec Flask: SVM Training, Testing, dan Prediction

## 1. Struktur service

```text
ml-service/
  app/
    __init__.py
    config.py
    routes.py
    schemas.py
    errors.py
    ml/
      preprocessing.py
      training.py
      prediction.py
      artifacts.py
  tests/
  requirements.txt
  Dockerfile
  run.py
```

## 2. Dependencies

Pin versi di `requirements.txt`:

- Flask
- scikit-learn
- pandas
- numpy
- joblib
- gunicorn
- pytest

Artifact hanya boleh digunakan dengan versi dependency yang kompatibel dengan versi saat training.

## 3. Environment

```text
FLASK_ENV=production
ML_SERVICE_TOKEN=<secret>
MODEL_DIR=/var/lib/ml-models
MAX_TRAINING_ROWS=50000
REQUEST_TIMEOUT_SECONDS=120
RANDOM_SEED=42
```

## 4. Endpoint

### `GET /health`

Tidak memerlukan token.

```json
{
  "ok": true,
  "service": "news-classification",
  "model_loaded": true,
  "active_model_version": "2026-10-06T001"
}
```

### `POST /v1/train-test`

Header:

```text
Authorization: Bearer <ML_SERVICE_TOKEN>
Content-Type: application/json
```

Request:

```json
{
  "model_version": "2026-10-06T001",
  "random_seed": 42,
  "test_size": 0.2,
  "cv_folds": 5,
  "rows": [
    {
      "id": "news-uuid",
      "title": "Judul berita",
      "description": "Deskripsi berita",
      "label": "baik"
    }
  ]
}
```

Response sukses:

```json
{
  "run_id": "run-uuid",
  "model_version": "2026-10-06T001",
  "artifact_name": "model-2026-10-06T001.joblib",
  "training_sample_count": 80,
  "test_sample_count": 20,
  "metrics": {
    "accuracy": 0.8,
    "macro_precision": 0.79,
    "macro_recall": 0.78,
    "macro_f1": 0.78,
    "weighted_f1": 0.8,
    "classification_report": {},
    "confusion_matrix": [[8, 1, 0], [1, 7, 1], [0, 1, 1]]
  }
}
```

Validation:

- label hanya `baik`, `buruk`, `netral`
- minimal tiga kelas tersedia
- setiap kelas cukup untuk stratified split dan CV
- id tidak boleh duplicate
- jumlah data dibatasi `MAX_TRAINING_ROWS`

### `POST /v1/predict`

Request:

```json
{
  "model_version": "2026-10-06T001",
  "rows": [
    {
      "id": "news-uuid",
      "title": "Judul berita",
      "description": "Deskripsi berita"
    }
  ]
}
```

Response:

```json
{
  "model_version": "2026-10-06T001",
  "predictions": [
    {
      "id": "news-uuid",
      "label": "netral",
      "confidence": 0.73,
      "scores": {
        "baik": 0.12,
        "buruk": 0.15,
        "netral": 0.73
      }
    }
  ]
}
```

Confidence adalah nilai ternormalisasi dari `decision_function`, bukan probabilitas terkalibrasi. Jika probabilitas dibutuhkan, tambahkan `CalibratedClassifierCV` sebagai enhancement terpisah.

## 5. ML pipeline

1. Null title/description menjadi string kosong.
2. Gabungkan title dan description.
3. TF-IDF vectorizer.
4. Linear SVM multiclass.
5. Simpan vectorizer dan classifier sebagai satu joblib pipeline.
6. `train_test_split(..., stratify=y, random_state=42)` dengan test size 20%.
7. Cross-validation hanya pada data training.
8. Test set hanya digunakan untuk laporan final.
9. Label order eksplisit: `baik`, `buruk`, `netral`.

Preprocessing awal harus ringan dan deterministik. Stopword/stemming bahasa Indonesia ditambahkan setelah baseline dievaluasi.

## 6. Artifact management

- Artifact disimpan di `MODEL_DIR`.
- Nama file berdasarkan model version.
- Simpan metadata pipeline dan class order bersama artifact.
- Tulis ke temporary file lalu rename agar file tidak setengah tertulis.
- Prediction hanya boleh memakai artifact yang berhasil dimuat.
- Artifact tidak dikirim ke browser atau disimpan di PostgreSQL.

## 7. Error contract

```json
{
  "error": {
    "code": "INSUFFICIENT_CLASS_DATA",
    "message": "Each class requires at least 5 labeled rows.",
    "details": {}
  }
}
```

Status HTTP:

- `400` payload/dataset invalid
- `401` token invalid
- `404` model version tidak ditemukan
- `409` model version conflict
- `413` payload terlalu besar
- `500` error internal
- `503` artifact/service belum siap

## 8. Docker

Production command:

```text
gunicorn --bind 0.0.0.0:5000 --workers 1 --timeout 180 run:app
```

Gunakan volume persisten untuk `/var/lib/ml-models`. Satu worker dipakai pada versi awal untuk menghindari konflik loading dan penulisan artifact.

## 9. Testing Flask

- health endpoint
- bearer token valid/invalid
- schema validation
- tiga kelas lengkap
- kelas hilang atau jumlah terlalu sedikit
- deterministic random seed
- stratified split
- metrics dan confusion matrix
- save/load artifact
- prediction batch
- model version tidak ada
- payload melebihi limit
- restart container lalu reload artifact

