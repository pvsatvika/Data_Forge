# Data Forge

> **AI-Powered Agentic Data Profiling, Cleaning, Validation, Information-Loss Estimation & Rollback Platform**

Data Forge is an agentic data-cleaning platform that profiles raw CSV/XLSX datasets, infers semantic constraints using LLMs, and executes test-driven data-cleaning pipelines with in-memory dry-run simulation, automated validation, and immutable Parquet versioning.

---

## Overview

Data Forge addresses the unpredictability of automated data cleaning by combining **AI-driven semantic analysis** with **deterministic execution safeguards**. 

### LLM Decides — Code Executes
The AI engine is strictly decoupled from dataset execution paths. The LLM **never**:
- Directly mutates dataset files
- Executes arbitrary generated Python code or scripts
- Alters underlying storage systems directly

Instead, the AI layer inspects statistical profile metadata, infers enterprise semantic constraints, and generates structured transformation recommendations. All actual transformations are executed by **deterministic, allow-listed Python functions** only after human approval.

---

## Core Pipeline

Data Forge implements a 7-stage workflow:

```
 PROFILE ──> UNDERSTAND ──> PLAN ──> SIMULATE ──> APPROVE ──> CLEAN ──> VALIDATE ──> ROLLBACK
```

1. **Profile (Ingestion & Statistical Profiling)**: Validates CSV/XLSX file headers, computes SHA-256 checksums, and extracts column-level statistics (null ratios, data types, distinct counts, semantic hints).
2. **Understand (AI Semantic Inference)**: Uses Groq API (`llama-3.3-70b-versatile`) to infer column semantics, business rules, and recommend allow-listed cleaning operations with risk levels.
3. **Plan (Cleaning Plan Builder)**: Generates a structured transformation plan where operators select or unselect specific transformations.
4. **Simulate (Dry-Run Simulator)**: Runs in-memory transformation preview on a DataFrame copy without altering raw data, calculating cell diffs and an Information Loss Index score.
5. **Approve (Human Approval Gate)**: Requires explicit operator approval (`approved` status) before execution is authorized.
6. **Clean (Deterministic Execution Engine)**: Executes approved transformations using allow-listed Python functions (`trim_whitespace`, `fill_missing`, `convert_type`, etc.).
7. **Validate & Rollback (Automated Test Suite & Parquet Versioning)**: Runs automated post-transformation validation assertions (schema preservation, data loss limits, formatting). Commits an immutable Parquet version snapshot (`v1.parquet`, `v2.parquet`) and enables 1-click SHA-256 verified rollback.

---

## Architecture

### AI + Deterministic Separation

```
┌─────────────────────────────────┐
│     Statistical Profiler        │ (Extracts non-sensitive metadata)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Groq LLM (llama-3.3-70b)       │ (Recommends allow-listed transformations)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Server-Side Parameter Validator │ (Enforces type safety & registry limits)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Human Approval Gate         │ (Operator approves or rejects plan)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Deterministic Execution Engine  │ (Applies allow-listed Pandas functions)
└─────────────────────────────────┘
```

- **Groq Integration**: Default configured model is `llama-3.3-70b-versatile` utilizing JSON Schema response mode.
- **Strict Parameter Validation**: Server-side logic (`validate_transformation_parameters`) validates every recommendation argument (e.g. enforcing numeric constants for numeric column fills, checking strategy allow-lists).

---

## Data Cleaning Plan & Supported Operations

Operators build structured cleaning declarations containing itemized recommendations, confidence scores, and risk classifications (**LOW**, **MEDIUM**, **HIGH**).

### Supported Transformation Types
The deterministic execution engine strictly supports 10 allow-listed operations:

| Operation | Description | Supported Parameters |
| :--- | :--- | :--- |
| `trim_whitespace` | Trims leading/trailing whitespace from text columns | None |
| `lowercase` | Converts text values to lowercase | None |
| `uppercase` | Converts text values to uppercase | None |
| `normalize_email` | Standardizes email formats and trims spaces | None |
| `normalize_phone` | Normalizes phone number format strings | None |
| `fill_missing` | Fills missing/null values | `strategy` (`constant`, `mean`, `median`, `mode`), `value` |
| `replace_values` | Replaces specific values using a dictionary mapping | `mapping` (key-value dictionary) |
| `convert_type` | Converts column data type | `target_type` (`string`, `integer`, `float`, `boolean`, `date`) |
| `normalize_dates` | Standardizes date representations into ISO formats | None |
| `remove_duplicates` | Removes duplicate rows from the dataset | None |

---

## Dry-Run Simulation & Information Loss

Before modifying the active dataset, Data Forge simulates selected transformations in memory on a DataFrame copy.

### Preview Metrics Calculated
- **Original Row Count** vs. **Simulated Row Count**
- **Rows Affected**: Number of rows modified by transformations
- **Cells Changed**: Total individual cell values mutated
- **Rows Removed**: Rows dropped (e.g., duplicate removal)
- **Values Nullified**: Values converted to null/NaN during conversion
- **Information Loss Index**: Quantitative score estimating dataset information loss
- **Per-Transformation Statistics**: Itemized breakdown per operation
- **Cell Modification Diffs**: Sample diff log (row index, column name, old value, new value, operation) truncated at 50 records

---

## Validation & Safety Safeguards

1. **Parameter & Type Validation**: Rejects invalid strategies or type-incompatible fill values before plan creation.
2. **Human Approval Gate**: Transformation execution is blocked unless the cleaning plan status is explicitly set to `approved`.
3. **Protection of Original Data**: Raw uploaded files are stored immutably. Version 0 (`v0.parquet`) is generated immediately to preserve the raw baseline.
4. **Post-Execution Validation Suite**:
   - `SCHEMA_PRESERVATION` (Critical): Asserts all original columns exist; failure blocks commit.
   - `DATA_LOSS_CHECK` (Critical): Asserts actual row loss does not exceed dry-run simulation estimates.
   - `UNIQUENESS` (Warning): Checks unique constraints on identifier columns.
   - `FORMAT_CHECK` (Warning): Checks format match ratios on email/phone columns.
   - `TRANSFORMATION_CONSISTENCY` (Critical): Asserts applied transformations produced expected state.

---

## Versioning, History & Rollback

- **Immutable Parquet Storage**: Every executed cleaning pipeline generates a new compressed Parquet snapshot (`v1.parquet`, `v2.parquet`, ...) stored under `data/storage/{dataset_id}/versions/`.
- **Change Log Tracking**: Stores row-level cell diff entries in SQLite for audit history.
- **SHA-256 Integrity Rollback**: Before rolling back to a target version, Data Forge verifies the SHA-256 checksum of the target Parquet snapshot on disk.
- **Non-Destructive Pointer Reversal**: Rollbacks update the current dataset version pointer. Historical Parquet files are never overwritten or deleted.
- **Clean CSV Export**: Stream active or historical version states directly as CSV files (`/datasets/{dataset_id}/download`).

---

## Frontend Overview

The Data Forge frontend is built as a single-page application using React 18, Vite, TypeScript, and Tailwind CSS.

### Implemented Pages & Features
- **Login (`/login`) & Register (`/register`)**: Supabase email/password authentication with JWT bearer token management.
- **Dashboard (`/`)**: System overview, dataset activity metrics, subsystem architecture matrix.
- **Datasets (`/datasets`)**: File dropzone supporting CSV/XLSX ingestion up to 25MB, upload progress, dataset listing.
- **Profile (`/profile`)**: Statistical profile view with column data types, null ratios, distinct counts, and sample records.
- **AI Analysis (`/analysis`)**: Groq AI semantic inference dashboard displaying inferred constraints and recommendations.
- **Cleaning Plan (`/plan`)**: Interactive plan builder allowing selection/unselection of transformations, risk badges, and human approval controls (`Approve Plan` / `Reject Plan`).
- **Preview (`/preview`)**: Dry-run simulation breakdown, information loss score cards, per-operation stats, cell value diff table.
- **Validation (`/validation`)**: Automated post-execution test suite report with `PASS`, `WARN`, `FAIL` badges.
- **History (`/history`)**: Immutable Parquet version timeline, version download buttons, 1-click SHA-256 verified rollback modal dialog.
- **Light / Dark Theme System**: Theme toggle persisting selection in `localStorage` (`data-forge-theme`) and toggling `dark` class on root HTML.

---

## Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18.2.0, Vite 5.1.0, TypeScript 5.2.2 |
| **Frontend Styling** | Tailwind CSS 3.4.1, Lucide React 0.330.0 |
| **Routing & State** | React Router 6.22.0, Context API |
| **Authentication** | Supabase Auth (`@supabase/supabase-js` 2.117.2), PyJWT 2.8.0 |
| **Backend Framework** | Python 3.11+, FastAPI 0.109.0+, Uvicorn 0.27.0+ |
| **Data & Storage Engine** | Pandas 2.2.0+, DuckDB 0.10.0+, PyArrow 15.0.0+, OpenPyXL 3.1.2+, SQLAlchemy 2.0.25+ |
| **AI Engine** | Groq API (`groq` 0.4.0+ / HTTPX client, `llama-3.3-70b-versatile`) |
| **Database** | SQLite (`data_forge.db` via SQLAlchemy / aiosqlite) |
| **Testing Tools** | PyTest 8.0.0+, pytest-asyncio 0.23.0+, HTTPX 0.27.0+ |
| **Containerization** | Docker, Docker Compose |

---

## Project Structure

```
Data_Forge/
├── backend/
│   ├── app/
│   │   ├── ai/                # Groq API client, prompt templates, response parsing
│   │   ├── api/               # FastAPI router and dataset/health endpoints
│   │   ├── config/            # Pydantic environment settings
│   │   ├── db/                # SQLAlchemy database session & ORM models
│   │   ├── loss_estimation/   # In-memory dry-run simulator & loss score calculator
│   │   ├── models/            # Pydantic API request/response schemas
│   │   ├── planning/          # Cleaning plan builder & risk summarizer
│   │   ├── profiling/         # Statistical profiling & metadata generator
│   │   ├── security/          # Supabase JWT authentication & file validation
│   │   ├── transformations/   # Deterministic allow-listed operation registry
│   │   ├── validation/        # Post-execution validation test suite
│   │   ├── versioning/        # Parquet snapshot manager & SHA-256 rollback engine
│   │   └── main.py            # FastAPI application entry point
│   ├── requirements.txt       # Backend Python dependencies
│   └── .env.example           # Backend environment configuration template
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, WorkflowStepper, ProtectedRoute
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── pages/             # Dashboard, Datasets, AIAnalysis, CleaningPlan, etc.
│   │   ├── services/          # Axios API service & Supabase client
│   │   ├── App.tsx            # Main application layout & route setup
│   │   └── main.tsx           # React entry point
│   ├── package.json           # Frontend dependencies & npm scripts
│   ├── tailwind.config.js     # Tailwind theme tokens & color definitions
│   ├── vite.config.ts         # Vite build configuration
│   └── .env.example           # Frontend environment configuration template
├── tests/                     # Backend PyTest test suite (69 tests)
├── docker-compose.yml         # Docker orchestration specification
└── README.md                  # Project documentation
```

---

## Getting Started

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher

---

### Environment Variables Setup

Copy `.env.example` templates to `.env` files in `backend/` and `frontend/`:

```bash
# Backend environment setup
cp backend/.env.example backend/.env

# Frontend environment setup
cp frontend/.env.example frontend/.env
```

#### Backend Environment (`backend/.env`)
```env
ENVIRONMENT=development
PROJECT_NAME="Data Forge API"
VERSION="0.1.0"
DEBUG=true

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Supabase Authentication (JWT verification via JWKS or secret)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here
SUPABASE_AUDIENCE=authenticated

# Host & Database Settings
HOST=0.0.0.0
PORT=8000
DATABASE_URL=sqlite:///./data/storage/data_forge.db
STORAGE_DIR=../data/storage
UPLOAD_DIR=../data/uploads
MAX_UPLOAD_SIZE_MB=25

# CORS Origins
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]
```

#### Frontend Environment (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
```

---

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

---

### Frontend Setup

```bash
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

---

## Running the Application

Once both servers are running:
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:8000`
- **Interactive OpenAPI (Swagger) Docs**: `http://localhost:8000/docs`
- **System Health Check**: `http://localhost:8000/api/v1/health`

Alternatively, start all services via Docker Compose:
```bash
docker-compose up --build
```

---

## API Overview

All API endpoints are mounted under `/api/v1`.

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System health check & environment metadata |
| `POST` | `/api/v1/datasets/upload` | Ingest dataset file (CSV/XLSX), compute SHA-256, extract statistical profile |
| `GET` | `/api/v1/datasets` | List all ingested datasets owned by authenticated user |
| `GET` | `/api/v1/datasets/{dataset_id}` | Retrieve metadata for a specific dataset |
| `GET` | `/api/v1/datasets/{dataset_id}/profile` | Retrieve statistical profile data for a dataset |
| `POST` | `/api/v1/datasets/{dataset_id}/analyze` | Trigger Groq AI semantic analysis on dataset profile |
| `GET` | `/api/v1/datasets/{dataset_id}/analyze` | Retrieve stored AI semantic analysis report |
| `POST` | `/api/v1/datasets/{dataset_id}/plan` | Create/update structured cleaning plan from selected transformations |
| `GET` | `/api/v1/datasets/{dataset_id}/plan` | Retrieve active cleaning plan for a dataset |
| `POST` | `/api/v1/datasets/{dataset_id}/preview` | Run dry-run simulation on in-memory DataFrame & compute loss metrics |
| `POST` | `/api/v1/plan/{plan_id}/approve` | Approve a cleaning plan (authorizes execution) |
| `POST` | `/api/v1/plan/{plan_id}/reject` | Reject a cleaning plan |
| `POST` | `/api/v1/datasets/{dataset_id}/execute` | Execute approved plan, run validation suite, commit Parquet version |
| `GET` | `/api/v1/datasets/{dataset_id}/validation` | Retrieve post-execution validation report |
| `GET` | `/api/v1/datasets/{dataset_id}/history` | Retrieve version history log and audit chain |
| `POST` | `/api/v1/datasets/{dataset_id}/rollback` | Rollback dataset active version pointer to specified version |
| `GET` | `/api/v1/datasets/{dataset_id}/download` | Stream active or historical dataset version as clean CSV |

---

## Testing

### Backend Unit & Integration Tests
Run PyTest suite from the `backend/` directory:

```bash
cd backend
.\venv\Scripts\python.exe -m pytest ..\tests
```

**Verified Test Status**: `69 passed` (100% pass rate across upload, profiling, AI analysis, plan building, preview simulation, execution, validation, Parquet versioning, rollback, and authentication/ownership tests).

### Frontend Type Check & Production Build
Run TypeScript type checking and Vite build from `frontend/`:

```bash
cd frontend
npx tsc --noEmit
npm run build
```

**Verified Status**: `0 TypeScript compilation errors`, production bundle built successfully.

---

## Security

- **Environment Isolation**: All secrets (`GROQ_API_KEY`, `SUPABASE_JWT_SECRET`) must remain in `.env` files. `.env` files are ignored by git via `.gitignore`.
- **API Secret Protection**: API keys and secrets are never committed or hardcoded in source code or documentation. `.env.example` contains placeholders only.
- **JWT Verification**: Backend verifies Supabase JWT access tokens via asymmetric JWKS (`ES256`/`RS256`) endpoints or symmetric HMAC secret (`HS256`). Unverified tokens are rejected with HTTP 401.
- **Execution Isolation**: Transformations are executed strictly through allow-listed Python functions. No `eval()`, `exec()`, or dynamic code execution is permitted.

---

## Project Status

- **Fully Implemented**: 7-stage data cleaning pipeline, Groq AI semantic profiling, structured cleaning plan builder, dry-run simulation engine, human approval gate, deterministic operation registry, automated post-execution validation suite, immutable Parquet snapshot versioning, SHA-256 verified rollback engine, Supabase authentication & dataset ownership enforcement, Light/Dark responsive React frontend.
- **Storage Strategy**: Local SQLite database (`data_forge.db`) for metadata and audit logs; local file system (`data/storage/`) for versioned Parquet snapshots.

---

## Development

To contribute or develop locally:

1. Clone repository:
   ```bash
   git clone https://github.com/pvsatvika/Data_Forge.git
   cd Data_Forge
   ```
2. Follow [Backend Setup](#backend-setup) and [Frontend Setup](#frontend-setup) to install dependencies.
3. Configure local environment variables in `backend/.env` and `frontend/.env`.
4. Run tests before submitting changes:
   - Backend: `cd backend && .\venv\Scripts\python.exe -m pytest ..\tests`
   - Frontend: `cd frontend && npx tsc --noEmit`
