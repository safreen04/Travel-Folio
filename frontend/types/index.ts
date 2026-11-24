export type RiskAppetite = "conservative" | "balanced" | "aggressive";
export type InventoryTypeFilter = "All" | "Hotel Block" | "Flight Seat Block";

export interface AllocationItem {
  id: string;
  name: string;
  destination: string;
  type: "Hotel Block" | "Flight Seat Block";
  travel_period: string;
  event_name: string;
  historical_bookings: number;
  unconstrained_demand: number;
  censorship_multiplier: number;
  look_to_book_ratio: number;
  was_sold_out: boolean;
  procurement_cost_per_unit: number;
  base_selling_price: number;
  dynamic_selling_price: number;
  price_surge_pct: number;
  max_available_units: number;
  recommended_quantity: number;
  allocated_budget: number;
  expected_profit: number;
  profit_margin_pct: number;
  demand_volatility: number;
  cancellation_rate: number;
  strategy: "Pre-Buy (Hard Allocation)" | "Supplier Integration (Soft Allocation)" | "No Allocation";
  purchase_window: string;
  reasoning: string;
}

export interface KpiSummaryData {
  total_budget_used: number;
  budget_limit: number;
  budget_utilization_pct: number;
  expected_profit: number;
  risk_adjusted_roi: number;
  estimated_unsold_risk_pct: number;
  items_procured_count: number;
  total_units_procured: number;
  risk_appetite: string;
  lambda_penalty: number;
}

export interface FrontierPoint {
  risk_score: number;
  expected_profit: number;
  budget_used: number;
  lambda_val: number;
  label: string;
  is_current: boolean;
}

export interface OptimizeResponse {
  kpis: KpiSummaryData;
  allocations: AllocationItem[];
  frontier: FrontierPoint[];
}
