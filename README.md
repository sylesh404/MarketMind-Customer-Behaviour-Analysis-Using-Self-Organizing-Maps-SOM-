# MarketMind: Customer Behaviour Analysis Using Self-Organizing Maps (SOM)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React_19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Bundler-Vite_8-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS_v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MiniSom](https://img.shields.io/badge/Algorithm-MiniSom_2.3-FF6F00.svg)](https://github.com/JustGlowing/minisom)
[![SQLite](https://img.shields.io/badge/Database-SQLite3-003B57.svg?logo=sqlite&logoColor=white)](https://sqlite.org)

**MarketMind** is a full-stack, end-to-end customer analytics and segmentation platform. It leverages unsupervised **Kohonen Self-Organizing Maps (SOM)** and **Hierarchical Agglomerative Clustering** to project multi-dimensional customer behavioral data onto a 2D neural lattice, visualize natural cluster boundaries with the **Unified Distance Matrix (U-Matrix)**, and automatically generate data-driven marketing playbooks and executive PDF reports.

---

## 📚 Complete Project Documentation (`readme/` Directory)

All detailed documentation is organized within the [`readme/`](file:///c:/Users/Sakthi%20sylesh/Downloads/Market%20Customer%20Behaviour%20Analysis%20using%20SOM/readme/README.md) folder:

| Document | Description |
| :--- | :--- |
| 📖 **[Master README](file:///c:/Users/Sakthi%20sylesh/Downloads/Market%20Customer%20Behaviour%20Analysis%20using%20SOM/readme/README.md)** | Full project guide covering SOM theory, segmentation rules, setup, and features. |
| 🏗️ **[System Architecture](file:///c:/Users/Sakthi%20sylesh/Downloads/Market%20Customer%20Behaviour%20Analysis%20using%20SOM/readme/ARCHITECTURE.md)** | High-level system design, ML pipeline, SQLite ER diagram, and component hierarchy. |
| 💻 **[Technology Stack](file:///c:/Users/Sakthi%20sylesh/Downloads/Market%20Customer%20Behaviour%20Analysis%20using%20SOM/readme/TECH_STACK.md)** | Detailed inventory of frameworks, libraries, versions, and selection rationale. |
| 🔄 **[Application Workflow](file:///c:/Users/Sakthi%20sylesh/Downloads/Market%20Customer%20Behaviour%20Analysis%20using%20SOM/readme/WORKFLOW.md)** | Step-by-step user and data flow across all 12 frontend tabs and backend services. |
| 📡 **[REST API Reference](file:///c:/Users/Sakthi%20sylesh/Downloads/Market%20Customer%20Behaviour%20Analysis%20using%20SOM/readme/API_REFERENCE.md)** | Complete endpoint specifications, request payloads, and JSON response models. |

---

## ⚡ Quick Start

### 1. Launch Backend Server

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```
*Backend runs on `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).*

### 2. Launch Frontend Client

```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🎯 Key Capabilities

- **12 Interactive Analytics Tabs**: From raw data ingestion, missing-value imputation, and feature correlation to U-Matrix exploration, segment profiling, churn risk scoring, and PDF generation.
- **Topological Clustering via SOM**: Unsupervised dimensionality reduction preserving non-linear customer relationships without arbitrary distance assumptions.
- **Dynamic Re-Clustering**: Adjust cluster count $k$ on-the-fly without retraining the 10,000-epoch SOM network.
- **Interactive U-Matrix Heatmap**: Visual ridge/valley representation with customer node density mapping and cell inspector.
- **Rule-Based Retention Risk Engine**: Stratifies customers into Low, Medium, and High Risk tiers with projected revenue impact.
- **Automated Multi-Format Export**: One-click generation of professional executive PDF reports, enriched customer CSVs, and complete JSON analyses.
