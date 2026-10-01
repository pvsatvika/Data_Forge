# DataForge — Production Deployment Guide & Zero-Cost Architecture Specification

---

## 1. System Architecture

DataForge is engineered for **$0 operating cost** deployment using enterprise-grade free tier hosting services:

```mermaid
flowchart TD
    User["User Browser / Client"] -->|HTTPS Requests| Vercel["Vercel Hobby (Frontend SPA)"]
    User -->|Supabase Auth JWT| SupabaseAuth["Supabase Auth (Authentication & Session)"]
    User -->|Authenticated API Calls| Render["Render Free Web Service (FastAPI Backend)"]
    
    Render -->|SQL Queries via SQLAlchemy| SupabaseDB["Supabase Postgres DB (Metadata & Logs)"]
    Render -->|S3 API / Storage SDK| SupabaseStorage["Supabase Object Storage (Baselines & Parquet)"]
    Render -->|JSON Prompts| Groq["Groq Cloud Free Tier (openai/gpt-oss-120b)"]
```

* **Frontend Hosting**: Vercel Hobby Tier (Static SPA build with Vite + React + Tailwind CSS).
* **Backend Hosting**: Render Free Web Service (FastAPI / Uvicorn Python application).
* **Database & Metadata Store**: Supabase Free Tier Postgres (`DATABASE_URL`).
* **File & Parquet Persistence**: Supabase Object Storage (1 GB free persistent storage).
* **AI Analysis Engine**: Groq Cloud Free Tier (`openai/gpt-oss-120b`).

---

## 2. Prerequisites & Environment Matrix

### Backend Environment Variables (Render Web Service)

| Variable Name | Type | Description | Production Example Placeholder |
| :--- | :---: | :--- | :--- |
| `ENVIRONMENT` | string | Execution environment mode | `production` |
| `PROJECT_NAME` | string | API title | `"Data Forge API"` |
| `DEBUG` | boolean | Debug mode flag (disable in production) | `false` |
| `STORAGE_MODE` | string | Storage provider mode (`local`, `supabase`, `auto`) | `supabase` |
| `SUPABASE_STORAGE_BUCKET` | string | Supabase Storage bucket identifier | `data-forge-storage` |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | Supabase Service Role Key (Backend Storage API) | `ey...` |
| `GROQ_API_KEY` | secret | Backend-only Groq API key | `gsk_...` |
| `GROQ_MODEL` | string | Active Groq model identifier | `openai/gpt-oss-120b` |
| `SUPABASE_URL` | string | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_JWT_SECRET` | secret | Supabase JWT verification secret | `your-supabase-jwt-secret` |
| `SUPABASE_AUDIENCE` | string | Expected JWT audience | `authenticated` |
| `DATABASE_URL` | secret | Supabase Postgres connection string | `postgresql://postgres:...@db.xxx.supabase.co:5432/postgres` |
| `CORS_ORIGINS` | JSON list | Allowed frontend origin domains | `["https://dataforge.vercel.app"]` |
| `MAX_UPLOAD_SIZE_MB` | integer | Max upload file size limit | `25` |

> [!CAUTION]
> Never set `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SUPABASE_JWT_SECRET` in frontend environment files or client bundles.

---

### Frontend Environment Variables (Vercel Project)

| Variable Name | Type | Description | Production Example Placeholder |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | public | Backend API endpoint URL | `https://dataforge-backend.onrender.com/api/v1` |
| `VITE_SUPABASE_URL` | public | Public Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | public | Public Supabase anon key | `your-supabase-anon-key` |

---

## 3. Storage & Data Persistence Migration Plan

### Persistence Challenge
Render Free Web Services feature an **ephemeral container filesystem**. Any files stored locally in `./data/storage` or `./data/uploads` are destroyed whenever Render restarts, redeploys, or spins down due to inactivity.

### Migration Solution ($0 Zero Cost)
1. **Metadata Persistence**: Change `DATABASE_URL` from SQLite (`sqlite:///./data/storage/data_forge.db`) to **Supabase Postgres**. SQLAlchemy automatically creates and manages all tables (`datasets`, `versions`, `change_logs`, `rollback_events`, `analyses`, `cleaning_plans`).
2. **Parquet & Upload File Persistence**: Route uploaded baseline files and versioned Parquet files into a dedicated bucket in **Supabase Storage** (`data-forge-storage`). Supabase Free Tier provides 1 GB of permanent object storage at $0.

### Supabase Storage Bucket Setup Steps (One-Time Manual Step)
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) for your project.
2. Go to **Storage** -> **Buckets**.
3. Click **New Bucket**.
4. Set **Bucket Name**: `data-forge-storage`.
5. Keep **Public Bucket**: **OFF / Unchecked** (Private bucket for dataset security).
6. Click **Save**.
7. In project settings (**API** tab), copy the **`service_role` secret key** and set it as `SUPABASE_SERVICE_ROLE_KEY` in Render environment variables.


---

## 4. Backend Deployment Steps (Render Free Web Service)

1. Sign in to [Render](https://render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository (`Data_Forge`).
3. Set the following build and start configurations:
   * **Root Directory**: `backend`
   * **Environment**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In the **Environment Variables** section, enter all required backend variables.
5. Set the Health Check Path to: `/api/v1/health`.

---

## 5. Frontend Deployment Steps (Vercel Hobby)

1. Sign in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
2. Import the `Data_Forge` GitHub repository.
3. Set the project settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Add environment variables: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Ensure `vercel.json` is present for SPA routing fallback:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 6. Health Check Probe

The backend exposes an unauthenticated health probe:

* **Endpoint**: `GET /api/v1/health`
* **Response**:
  ```json
  {
    "status": "healthy",
    "version": "0.1.0",
    "database": "connected"
  }
  ```
* **Security Guarantee**: Contains no credentials, environment secrets, or internal server paths.

---

## 7. Zero-Cost Operating Limitations

* **Render Free Service Spin-Down**: Free Render web services automatically sleep after 15 minutes of inactivity. The first request after sleep takes 30–50 seconds to cold start.
* **Supabase Free Limits**: 500 MB Postgres database storage, 1 GB Object Storage, 50,000 monthly active auth users.
* **Groq Developer Limits**: Free tier rate limits (RPM/TPM) apply to `openai/gpt-oss-120b`.

---

## 8. Post-Deployment Security Checklist

- [x] `GROQ_API_KEY` is not present in frontend code or Vite environment.
- [x] `.env` files are added to `.gitignore` and excluded from repository commits.
- [x] CORS configuration enforces explicit origin domains (`CORS_ORIGINS`).
- [x] Authenticated dataset download endpoints require Supabase Bearer JWT tokens.
- [x] User dataset ownership is enforced across all API endpoints.
- [x] SPA fallback rewrite rules prevent 404s on direct route navigation.
