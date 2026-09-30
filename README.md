# Data Forge

> **AI-Powered Agentic Enterprise Data Profiling, Cleaning, Validation, Information-Loss Estimation & Rollback Platform**

Data Forge is an intelligent, agentic system that autonomously profiles messy enterprise datasets, infers semantic constraints using LLMs, and generates reversible, test-driven data-cleaning pipelines while calculating potential information loss.

---

## ⚡ Core Principle: LLM DECIDES — CODE EXECUTES

The LLM is strictly isolated from raw execution paths. It **NEVER**:
- Directly modifies datasets
- Executes arbitrary generated Python code
- Alters file systems directly

The AI layer only analyzes structured metadata profiles, infers constraints, recommends allow-listed operations, and generates structured JSON cleaning declarations. All actual transformations are executed by **deterministic, allow-listed Python functions**.

---

## 🚀 Complete 10-Stage Pipeline

```
 OBSERVE ──> REASON ──> PLAN ──> SIMULATE ──> APPROVE ──> EXECUTE ──> TEST ──> COMMIT ──> VERSION ──> ROLLBACK
```

1. **Ingestion & Profiling**: CSV/XLSX file validation, SHA-256 calculation, statistical profile generation, and pattern heuristics.
2. **AI Semantic Intelligence**: Groq API (`llama-3.3-70b-versatile`) infers constraints and recommends allow-listed cleaning operations under strict Prompt Injection Defense.
3. **Validated Cleaning Plan**: Generates structured cleaning plans with plan-level Risk Summaries (LOW, MEDIUM, HIGH counts).
4. **Deterministic Dry-Run Simulator**: In-memory simulation calculates cell diffs, transformation stats, and project-defined Information Loss Index without altering raw files.
5. **Approval Gate Authorization**: Require explicit confirmation before plan execution.
6. **Deterministic Execution Engine**: Executes allow-listed Python transformations without `eval()` or `exec()`.
7. **Automated Validation Suite**: Post-transformation test suite verifying schema preservation, uniqueness, formats, and loss limits. A `FAIL` status blocks version commit.
8. **Immutable Parquet Versioning**: Stores versioned dataset states as compressed Parquet files with itemized change logs.
9. **Safe Download Engine**: Stream active or historical versions as clean CSV.
10. **Reversibility & Rollback Engine**: Instant 1-click rollback to any historical version after verifying SHA-256 integrity hashes. Historical version files are preserved.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Axios, Lucide Icons
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy
- **Data Engine**: Pandas, DuckDB, PyArrow, OpenPyXL
- **AI Engine**: Groq API (`llama-3.3-70b-versatile`), JSON Schema Response Mode
- **Storage**: SQLite (metadata, pipeline history & AI analysis results), Parquet (versioned dataset states)
- **Testing**: PyTest
- **Deployment**: Docker, Docker Compose

---

## 🚀 Quickstart & Setup

### Environment Configuration
Copy `.env.example` files to `.env`:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Add your Groq API Key to `.env` or `backend/.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

---

### Option 1: Run Independently (Recommended for Local Development)

#### Start Backend:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Backend API: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/v1/health`

#### Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
- Web Dashboard: `http://localhost:5173`

---

### Option 2: Run via Docker Compose

```bash
docker-compose up --build
```

---

## 🧪 Running Unit & Integration Tests

```bash
.\backend\venv\Scripts\pytest tests/
```

---

## 📄 License
MIT License
