"""
FastAPI Server for Travel-Folio (TBO.com)
Exposes inventory and portfolio optimization endpoints.
"""

import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from data_generator import generate_inventory
from optimizer import optimize_portfolio

app = FastAPI(
    title="Travel-Folio API",
    description="AI-driven decision-support platform for travel inventory procurement and optimization (TBO.com)",
    version="1.0.0",
)

# Enable CORS for Next.js frontend (default port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory inventory cache generated on startup
GLOBAL_INVENTORY: List[Dict[str, Any]] = generate_inventory(seed=42)


class OptimizeRequest(BaseModel):
    max_budget: float = Field(default=250000.0, ge=1000.0, le=5000000.0, description="Total procurement budget in USD")
    risk_appetite: str = Field(default="balanced", description="Risk appetite: conservative | balanced | aggressive")
    filter_type: Optional[str] = Field(default="All", description="Inventory filter: All | Hotel Block | Flight Seat Block")


class KpiSummary(BaseModel):
    total_budget_used: float
    budget_limit: float
    budget_utilization_pct: float
    expected_profit: float
    risk_adjusted_roi: float
    estimated_unsold_risk_pct: float
    items_procured_count: int
    total_units_procured: int
    risk_appetite: str
    lambda_penalty: float


class AllocationItem(BaseModel):
    id: str
    name: str
    destination: str
    type: str
    travel_period: str
    event_name: str
    historical_bookings: int
    unconstrained_demand: int
    censorship_multiplier: float
    look_to_book_ratio: float
    was_sold_out: bool
    procurement_cost_per_unit: float
    base_selling_price: float
    dynamic_selling_price: float
    price_surge_pct: float
    max_available_units: int
    recommended_quantity: int
    allocated_budget: float
    expected_profit: float
    profit_margin_pct: float
    demand_volatility: float
    cancellation_rate: float
    strategy: str
    purchase_window: str
    reasoning: str


class FrontierPoint(BaseModel):
    risk_score: float
    expected_profit: float
    budget_used: float
    lambda_val: float
    label: str
    is_current: bool


class OptimizeResponse(BaseModel):
    kpis: KpiSummary
    allocations: List[AllocationItem]
    frontier: List[FrontierPoint]


@app.get("/")
def root():
    return {
        "app": "Travel-Folio API (TBO.com Edition)",
        "status": "online",
        "interactive_docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "health": "/api/health",
            "inventory": "/api/inventory",
            "optimize": "POST /api/optimize"
        },
        "description": "AI-driven decision-support platform for travel inventory procurement & optimization"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "Travel-Folio API",
        "total_inventory_items": len(GLOBAL_INVENTORY),
    }


@app.get("/api/inventory")
def get_inventory():
    """Returns the full synthetic catalog of travel inventory items with raw signals."""
    return {
        "count": len(GLOBAL_INVENTORY),
        "items": GLOBAL_INVENTORY,
    }


@app.post("/api/optimize", response_model=OptimizeResponse)
def run_optimization(req: OptimizeRequest):
    """
    Executes the two-stage decision optimization:
    1. Unconstrained demand recovery from censored booking signals.
    2. Mixed-Integer Knapsack Optimization balancing expected profit vs. unsold risk.
    3. Classification into Pre-Buy (Hard) vs. Supplier Integration (Soft) strategies.
    """
    try:
        result = optimize_portfolio(
            items=GLOBAL_INVENTORY,
            max_budget=req.max_budget,
            risk_appetite=req.risk_appetite,
            filter_type=req.filter_type or "All",
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
