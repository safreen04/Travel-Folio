# Travel-Folio (TBO.com Edition)

> **AI-Driven Decision-Support Platform for Travel Inventory Procurement & Optimization**

Built for hackathons and production evaluation, **Travel-Folio** solves one of the hardest challenges in B2B travel distribution: **how much inventory to commit to upfront (Pre-Buy hard blocks) versus draw down dynamically via live API connections (Supplier Soft Allocations)**, subject to strict budget ceilings, volatile travel demand, and cancellation risks.

---

## 🚀 Key Features

### 1. Censored Demand Recovery Engine (`backend/optimizer.py`)
In real-world travel sales, whenever inventory sells out, observed historical bookings are truncated. Travel-Folio detects truncated demand and recovers the unconstrained latent demand by factoring in:
- Historical sold-out signals (`was_sold_out`)
- Look-to-book ratios (search intensity surge)
- Seasonal multipliers (`seasonality_index`)
- External event signals (festivals, conferences, concerts e.g., Sunburn Festival, Dubai Shopping Festival, Singapore F1)

$$\text{Unconstrained Demand}_i = \text{Historical Bookings}_i \times \beta_i \times \text{Seasonality}_i \times \text{Event Multiplier}_i$$

### 2. Risk-Adjusted Mathematical Optimization (`scipy.optimize.milp`)
Formulated as a **Mixed-Integer Bounded Knapsack Problem** using SciPy's HiGHS solver:
- **Maximize:** $\sum_{i} (\text{Expected Net Profit}_i - \lambda \times \text{Unsold \& Cancellation Risk}_i) \cdot x_i$
- **Subject to:**
  $$\sum_{i} (\text{procurement\_cost}_i \times x_i) \le \text{max\_budget}$$
  $$0 \le x_i \le \min(\text{max\_available\_units}_i, \text{Demand Buffer}_i)$$
  $$x_i \in \mathbb{Z}_{\ge 0}$$
- **Risk Penalty ($\lambda$):**
  - **Conservative:** $\lambda = 1.45$ (tight buffers, strict risk minimization)
  - **Balanced:** $\lambda = 0.75$ (optimal Sharpe-style risk/reward)
  - **Aggressive:** $\lambda = 0.22$ (capital maximization, capturing high-margin surges)

### 3. Hybrid Allocation Strategy & Dynamic Pricing
- **Pre-Buy (Hard Allocation):** Low-volatility ($\le 18\%$), high-confidence inventory committed upfront to lock in steep volume discounts.
- **Supplier Integration (Soft Allocation):** High-volatility or event-uncertain inventory routed to live API draw-down with flexible cancellation buffers.
- **Dynamic Selling Price:** Algorithmic markup/discount reflecting true latent demand pressure.
- **AI Reasoning:** Natural English explanation accompanying every asset decision.

### 4. Interactive Command Center Dashboard
- **Real-Time Control Bar:** Interactive Budget Slider ($50k to $1M), Risk Appetite pills, and Hotel/Flight filters.
- **4 Executive KPI Cards:** Expected Net Profit, Risk-Adjusted ROI %, Budget Utilized, and Unsold Risk %.
- **Dual Visualizations:**
  1. **Budget Allocation Chart:** Destination breakdown by Pre-Buy vs. Soft Allotment.
  2. **Efficient Frontier Chart:** Markowitz risk-return curve highlighting active portfolio placement.
- **Actionable Procurement Table:** Sortable, searchable table with purchase window recommendations and one-click **CSV Export**.
- **Deep-Dive Modal:** Inspection of raw market signals and censored demand recovery steps for any asset.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.13, FastAPI, Pydantic, Pandas, NumPy, SciPy (`scipy.optimize.milp` with HiGHS solver), Uvicorn.
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts.

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend and create virtual environment
python -m venv backend/.venv

# Activate virtual environment (Windows PowerShell)
.\backend\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup
```bash
# Navigate to frontend and install dependencies
cd frontend
npm install

# Start development server
npm run dev
```
Dashboard will be live at: [http://localhost:3000](http://localhost:3000)

### 4. Running Automated Tests
```bash
# Run backend mathematical tests and budget constraint verification
backend\.venv\Scripts\python backend\test_optimizer.py

# Run full-stack end-to-end verification
backend\.venv\Scripts\python verify_system.py
```

---

## 📊 Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & catalog item count |
| `GET` | `/api/inventory` | Raw synthetic catalog with market signals |
| `POST` | `/api/optimize` | Two-stage demand recovery & portfolio knapsack optimization |
