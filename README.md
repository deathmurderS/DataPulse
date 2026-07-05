# DataPulse 📊

**Pipeline Data End-to-End: Scraping → ETL → Database → API → Dashboard**

DataPulse adalah proyek demo/portofolio yang menunjukkan kemampuan membangun pipeline data end-to-end: pengambilan data (scraping), pembersihan (ETL), penyimpanan ke PostgreSQL, hingga penyajian insight melalui dashboard web interaktif dan REST API.

> ⚠️ **Disclaimer**: Proyek ini adalah versi demo/portofolio menggunakan data sample berskala kecil — bukan produk komersial yang berjalan di production dengan data real-time skala besar.

---

## 📋 Daftar Isi

- [Fitur](#fitur)
- [Arsitektur](#arsitektur)
- [Tech Stack](#tech-stack)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Struktur Proyek](#struktur-proyek)
- [API Documentation](#api-documentation)
- [Dashboard](#dashboard)
- [Monitoring & Notifikasi](#monitoring--notifikasi)
- [Backup](#backup)
- [KPI Produk](#kpi-produk)
- [Roadmap](#roadmap)
- [Lisensi](#lisensi)

---

## ✨ Fitur

### V1 (Saat Ini)
| Kode | Fitur | Status |
|------|-------|--------|
| FR-01 | Scraping data otomatis sesuai jadwal harian | ✅ |
| FR-02 | Deduplikasi data berdasarkan unique key | ✅ |
| FR-03 | Validasi tipe dan kelengkapan data | ✅ |
| FR-04 | Dashboard dengan 8 chart statistik | ✅ |
| FR-05 | Pencarian dan filter data di dashboard | ✅ |
| FR-06 | Ekspor data CSV/Excel/JSON | ✅ |
| FR-07 | Dokumentasi API otomatis (Swagger/OpenAPI) | ✅ |
| FR-08 | Notifikasi scraping gagal & anomali data | ✅ |
| FR-09 | Rate limiting API | ✅ |

### V2 (Rencana)
- Multi-source scraping
- AI Summary/Insight (Ollama)
- Advanced analytics

### V3 (Rencana)
- Mobile app (Flutter)
- Push notification

---

## 🏗️ Arsitektur

```
┌─────────┐    ┌──────────────┐    ┌────────────┐    ┌─────────┐    ┌──────────────┐
│ Scraper │───▶│ ETL Pipeline │───▶│ PostgreSQL │───▶│ FastAPI │───▶│   Streamlit  │
│ (Daily) │    │ (Clean/Val)  │    │  Database  │    │  REST   │    │  Dashboard   │
└─────────┘    └──────────────┘    └────────────┘    └─────────┘    └──────────────┘
                                                          │
                                                          ▼
                                                   ┌──────────────┐
                                                   │  Swagger UI  │
                                                   │  /docs       │
                                                   └──────────────┘
```

### Komponen Utama:
1. **Scraper** — Mengambil data dari sumber publik (sample data untuk demo)
2. **ETL Pipeline** — Membersihkan, memvalidasi, dan deduplikasi data
3. **PostgreSQL** — Database utama
4. **FastAPI** — REST API dengan dokumentasi Swagger otomatis
5. **Streamlit Dashboard** — Dashboard interaktif dengan 8 chart
6. **Scheduler** — Menjalankan pipeline scraping & ETL secara periodik
7. **Notifier** — Mengirim alert via Telegram/Email

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Scraper | Python, requests, BeautifulSoup4 |
| ETL | Python, pandas, pydantic |
| Database | PostgreSQL 16 (SQLAlchemy ORM) |
| Backend API | FastAPI (Swagger/OpenAPI) |
| Dashboard | Streamlit, Plotly |
| Scheduler | APScheduler |
| Notifikasi | python-telegram-bot / SMTP |
| Infrastruktur | Docker & docker-compose |
| Backup | pg_dump, Bash/Python script |

---

## 📋 Persyaratan Sistem

- **Docker** v24+ dan **docker-compose** v2+
- **Git**
- **RAM**: Minimal 2GB (4GB recommended)
- **Disk**: Minimal 1GB free space

---

## 🚀 Instalasi & Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/deathMurderS/datapulse.git
cd datapulse
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env
# Edit .env sesuai kebutuhan (opsional untuk demo)
```

### 3. Jalankan dengan Docker

```bash
# Build dan jalankan semua service
docker-compose up -d --build

# Cek status container
docker-compose ps
```

### 4. Akses Aplikasi

| Service | URL |
|---------|-----|
| **Dashboard** | http://localhost:8501 |
| **API** | http://localhost:8000 |
| **Swagger Docs** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |

### 5. Pipeline Data

Scheduler akan otomatis menjalankan pipeline scraping & ETL saat container pertama kali dijalankan. Pipeline akan berjalan setiap 24 jam (dapat dikonfigurasi di `.env`).

Untuk menjalankan pipeline manual:

```bash
docker-compose exec scheduler python -m app.scheduler.main
```

### 6. Backup Database

Backup otomatis berjalan setiap hari. Untuk backup manual:

```bash
docker-compose exec backup python scripts/backup.py
```

---

## 📁 Struktur Proyek

```
datapulse/
├── app/
│   ├── __init__.py
│   ├── config.py              # Konfigurasi aplikasi
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI endpoints
│   │   └── rate_limiter.py    # Rate limiting
│   ├── dashboard/
│   │   ├── __init__.py
│   │   └── main.py            # Streamlit dashboard
│   ├── etl/
│   │   ├── __init__.py
│   │   └── pipeline.py        # ETL pipeline
│   ├── models/
│   │   ├── __init__.py
│   │   ├── database.py        # Database connection
│   │   └── job.py             # Job model
│   ├── notifications/
│   │   ├── __init__.py
│   │   └── alerter.py         # Notifikasi Telegram/Email
│   ├── scheduler/
│   │   ├── __init__.py
│   │   └── main.py            # APScheduler
│   └── scraper/
│       ├── __init__.py
│       └── job_scraper.py     # Job scraper
├── scripts/
│   ├── backup.py              # Backup script
│   └── init-db.sql            # DB initialization
├── data/
│   ├── backup/                # Backup files
│   └── sample/                # Sample data
├── tests/                     # Test files
├── docs/                      # Documentation
├── .env.example               # Environment template
├── .gitignore
├── docker-compose.yml         # Docker services
├── Dockerfile                 # Docker image
├── requirements.txt           # Python dependencies
└── README.md
```

---

## 📖 API Documentation

API terdokumentasi otomatis melalui Swagger UI dan ReDoc.

### Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/` | Informasi API |
| GET | `/health` | Health check |
| GET | `/api/jobs` | Daftar lowongan (paginated) |
| GET | `/api/jobs/search` | Cari & filter lowongan |
| GET | `/api/jobs/{id}` | Detail lowongan |
| GET | `/api/jobs/stats` | Statistik agregat |
| GET | `/api/jobs/export` | Ekspor data (CSV/JSON) |
| GET | `/api/jobs/categories` | Daftar kategori |
| GET | `/api/jobs/companies` | Daftar perusahaan |

### Akses Dokumentasi

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Rate Limiting

API dilindungi rate limiting: **10 request per 60 detik** per IP (dapat dikonfigurasi).

---

## 📊 Dashboard

Dashboard Streamlit menyediakan:

### 8 Chart Statistik
1. **Lowongan per Kategori** — Bar chart
2. **Top 10 Perusahaan** — Horizontal bar chart
3. **Top 10 Lokasi** — Horizontal bar chart
4. **Tipe Pekerjaan** — Pie chart
5. **Rata-rata Gaji per Kategori** — Grouped bar chart
6. **Lowongan per Hari** — Line chart
7. **Distribusi Gaji** — Histogram
8. **Gaji vs Tipe Pekerjaan** — Box plot

### Fitur Dashboard
- 🔎 Pencarian teks (judul, perusahaan, deskripsi)
- 🏷️ Filter kategori, perusahaan, lokasi, tipe pekerjaan
- 💰 Filter rentang gaji
- 📅 Filter tanggal posting
- 📥 Ekspor data (CSV, Excel, JSON)
- 📱 Responsive layout

---

## 🔔 Monitoring & Notifikasi

Sistem notifikasi berbasis rule (bukan AI):

| Event | Channel | Threshold |
|-------|---------|-----------|
| Scraping gagal | Telegram/Email | Setiap kegagalan |
| Anomali data | Telegram/Email | Gaji tidak wajar, deskripsi hilang |
| Error rate ETL > 2% | Telegram/Email | Per pipeline run |
| Uptime pipeline < 95% | Telegram/Email | Setelah 10+ run |
| Backup gagal | Telegram/Email | Setiap kegagalan |

Konfigurasi notifikasi di `.env`:
```env
NOTIFICATION_ENABLED=true
NOTIFICATION_TYPE=telegram  # atau email
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

---

## 💾 Backup

- **Otomatis**: Setiap hari via container `backup`
- **Manual**: `docker-compose exec backup python scripts/backup.py`
- **Retensi**: 7 hari (dapat dikonfigurasi)
- **Format**: SQL dump compressed (gzip)
- **Notifikasi**: Alert jika backup gagal

---

## 📈 KPI Produk

| Kategori | Indikator | Target | Status |
|----------|-----------|--------|--------|
| Kualitas Data | Error rate cleaning/validasi | < 2% | ✅ |
| Kualitas Data | Duplikasi data setelah ETL | 0% | ✅ |
| Reliabilitas | Keberhasilan scraping harian | ≥ 95% | ✅ |
| Performa | Waktu buka dashboard | < 3 detik | ✅ |
| Performa | Response time API rata-rata | < 500 ms | ✅ |
| Kelengkapan Fitur | Jumlah chart aktif | 8 chart | ✅ |
| Kelengkapan Fitur | Filter & search berfungsi | 100% | ✅ |
| Operasional | Backup database harian | 100% sukses | ✅ |
| Operasional | Notifikasi terkirim saat insiden | ≥ 95% | ✅ |
| Dokumentasi | Kelengkapan dokumentasi API | 100% endpoint | ✅ |

---

## 🗺️ Roadmap

### V1 (Saat Ini) — Single Source + Dashboard
- ✅ Scraping dari 1 sumber data
- ✅ ETL pipeline (cleaning, validasi, deduplikasi)
- ✅ PostgreSQL database
- ✅ FastAPI dengan Swagger docs
- ✅ Streamlit dashboard (8 chart)
- ✅ Notifikasi rule-based
- ✅ Docker deployment
- ✅ Backup otomatis

### V2 (Rencana) — Multi-Source + AI
- ⬜ Multi-source scraping
- ⬜ AI Summary/Insight (Ollama)
- ⬜ Advanced analytics & forecasting
- ⬜ Role management

### V3 (Rencana) — Mobile
- ⬜ Mobile app (Flutter)
- ⬜ Push notification
- ⬜ Offline data access

### V4 (Rencana) — Advanced
- ⬜ Anomaly detection berbasis model
- ⬜ Real-time data streaming
- ⬜ Advanced role management

---

## 🤝 Kontribusi

Proyek ini adalah portofolio pribadi. Namun, feedback dan saran sangat diterima!

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan portofolio/demo. Silakan digunakan sebagai referensi belajar.

---

**Dibuat dengan ❤️ menggunakan Python, FastAPI, Streamlit, dan Docker**