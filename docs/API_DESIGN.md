# Data Forge API Specification

Base URL: `/api/v1`

## Complete API Endpoint Registry

| Method | Endpoint | Description | Status |
|---|---|---|---|
| `GET` | `/health` | System health and configuration metadata | Implemented |
| `POST` | `/upload` (or `/datasets/upload`) | Upload CSV or XLSX dataset file | Implemented |
| `GET` | `/datasets/{id}` | Fetch dataset metadata by unique ID | Implemented |
| `GET` | `/profile/{id}` (or `/datasets/{id}/profile`) | Generate / retrieve statistical profile | Implemented |
| `POST` | `/analyze/{id}` (or `/datasets/{id}/analyze`) | Trigger Groq AI semantic analysis | Implemented |
| `GET` | `/analyze/{id}` (or `/datasets/{id}/analyze`) | Retrieve stored AI semantic analysis | Implemented |
| `POST` | `/plan/{id}` (or `/datasets/{id}/plan`) | Construct validated cleaning plan from AI analysis | Implemented |
| `GET` | `/plan/{id}` (or `/datasets/{id}/plan`) | Retrieve latest cleaning plan | Implemented |
| `POST` | `/preview/{id}` (or `/datasets/{id}/preview`) | In-memory dry run simulation & loss estimation | Implemented |
| `POST` | `/plan/{plan_id}/approve` | Approval Gate authorization | Implemented |
| `POST` | `/plan/{plan_id}/reject` | Reject cleaning plan | Implemented |
| `POST` | `/execute/{id}` (or `/datasets/{id}/execute`) | Execute cleaning plan, validate & commit Parquet version | Implemented |
| `GET` | `/validation/{id}` (or `/datasets/{id}/validation`) | Retrieve post-cleaning validation report | Implemented |
| `GET` | `/history/{id}` (or `/datasets/{id}/history`) | Fetch version history and audit log | Implemented |
| `POST` | `/rollback/{id}` (or `/datasets/{id}/rollback`) | Rollback dataset state to historic version | Implemented |
| `GET` | `/download/{id}` (or `/datasets/{id}/download`) | Download active or historical dataset version | Implemented |
