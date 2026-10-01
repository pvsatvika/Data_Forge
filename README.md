# DataForge — Autonomous Data Cleaning

<p align="center">
  <b>
    AI-assisted data cleaning with deterministic execution,
    human approval, validation, version control, rollback,
    and cloud persistence.
  </b>
</p>

<p align="center">

 **Live Demo:**  
<a href="https://data-forge-phi-six.vercel.app/">
https://data-forge-phi-six.vercel.app/
</a>

</p>


---

# Table of Contents

- Overview
- Problem Statement
- Proposed Solution

---

# Overview

DataForge is an AI-assisted autonomous data cleaning platform designed to transform raw datasets into cleaner, validated, version-controlled datasets.

Instead of allowing an AI model to directly modify the dataset, DataForge separates:

1. **Data understanding**
2. **AI reasoning**
3. **Transformation planning**
4. **Dry-run simulation**
5. **Human approval**
6. **Deterministic execution**
7. **Validation**
8. **Versioning and rollback**

This design makes the cleaning process more transparent, reproducible, and safer than allowing an AI model to directly manipulate data.

### Live Application

**Frontend:**

https://data-forge-phi-six.vercel.app/

**Backend API:**

https://data-forge-h7eg.onrender.com/api/v1

**API Documentation:**

https://data-forge-h7eg.onrender.com/docs

**Health Check:**

https://data-forge-h7eg.onrender.com/api/v1/health

---

# Problem Statement

Real-world datasets frequently contain problems such as:

- Missing values
- Duplicate records
- Inconsistent formatting
- Different date formats
- Invalid email formats
- Inconsistent phone numbers
- Incorrect data types
- Leading/trailing whitespace
- Inconsistent capitalization
- Invalid or inconsistent values

Traditional data cleaning often requires manually writing scripts for every dataset.

This creates several problems:

- Cleaning logic can be difficult to understand.
- Manual scripts are time-consuming.
- Data transformations may be difficult to reproduce.
- Users may not know how much information will be changed or removed.
- There may be no easy rollback mechanism.
- AI-generated transformations can be difficult to audit if execution is uncontrolled.

DataForge addresses these problems by combining AI-based reasoning with deterministic data transformation.

---

# Proposed Solution

DataForge uses AI to **understand the dataset and recommend a cleaning plan**, but the AI does not directly execute arbitrary code against the data.

The system follows this architecture:

```text
Raw Dataset
     │
     ▼
Dataset Profiling
     │
     ▼
AI Analysis
     │
     ▼
Transformation Plan
     │
     ▼
Dry-Run Simulation
     │
     ▼
Human Approval
     │
     ▼
Deterministic Execution
     │
     ▼
Validation
     │
     ▼
Versioned Dataset
