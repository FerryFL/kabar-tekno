# PRD Next.js: Admin dan Data Layer Klasifikasi Berita

## Tujuan

Menambahkan fitur admin pada aplikasi Kabar Tekno untuk memberi label berita, menjalankan training/testing melalui Flask, mengaktifkan model, dan melihat hasil prediksi tanpa mengubah alur berita, bookmark, atau read tracking.

## Scope

- UI admin untuk label `baik`, `buruk`, dan `netral`.
- Bulk labeling.
- Pengambilan dataset berlabel dari PostgreSQL.
- Orkestrasi request training/testing ke Flask.
- Penyimpanan metadata model, evaluation run, dan prediction history.
- UI metrik model dan hasil prediction.
- Authorization admin dan error handling service.

## Non-goals

- Menjalankan Python atau scikit-learn di browser.
- Menyimpan model artifact di PostgreSQL.
- Mengakses Flask langsung dari browser.
- Klasifikasi otomatis saat RSS refresh pada versi pertama.

## User story dan acceptance criteria

- Admin dapat memberi label satu atau banyak berita.
- Label invalid ditolak sebelum ditulis ke database.
- Admin dapat menjalankan Train & Test dari dataset berlabel.
- Status model terlihat sebagai `training`, `ready`, atau `failed`.
- Metrik dan confusion matrix dari Flask tersimpan serta dapat dilihat kembali.
- Admin dapat memilih model aktif.
- Prediction dapat ditelusuri berdasarkan berita dan versi model.
- User non-admin tidak dapat menjalankan operasi klasifikasi.

## Data ownership

Next.js adalah pemilik database dan source of truth untuk:

- artikel dan user
- label manual
- metadata model
- evaluation run
- histori prediction

Flask hanya menerima payload ML dan mengembalikan hasil. Flask tidak diberi credential database aplikasi.

## Alur komunikasi

1. Server Action/Route Handler memeriksa admin.
2. Next.js mengambil data dari Drizzle.
3. Next.js mengirim JSON ke Flask dengan token internal.
4. Next.js memvalidasi response Flask.
5. Next.js menyimpan hasil dalam transaction.
6. UI melakukan revalidation pada halaman admin.

