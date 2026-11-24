"""
Demand & Portfolio Optimization Engine for Travel-Folio (TBO.com)
Stage 1: Censored Demand Recovery (unconstrained latent demand estimation)
Stage 2: Risk-Adjusted Portfolio Optimization (scipy.optimize.milp Mixed-Integer Knapsack)
Stage 3: Hybrid Allocation Classification & Dynamic Pricing
"""

from typing import List, Dict, Any, Tuple
import numpy as np
from scipy.optimize import milp, LinearConstraint, Bounds

RISK_APPETITE_MAP = {
    "conservative": {"lambda": 1.45, "demand_buffer": 0.95, "label": "Conservative"},
    "balanced": {"lambda": 0.75, "demand_buffer": 1.12, "label": "Balanced"},
    "aggressive": {"lambda": 0.22, "demand_buffer": 1.30, "label": "Aggressive"},
}

def recover_censored_demand(item: Dict[str, Any]) -> Tuple[int, float]:
    """
    Stage 1: Recover latent unconstrained demand when inventory was sold out,
    amplified by high look-to-book ratios, seasonality, and external event signals.
    Returns: (unconstrained_demand, censorship_multiplier)
    """
    hist = item["historical_bookings"]
    look_to_book = item["look_to_book_ratio"]
    was_sold_out = item["was_sold_out"]
    seasonality = item["seasonality_index"]
    event_signal = item["external_event_signal"]

    if was_sold_out:
        # High look-to-book during sold-out periods reveals significant unmet demand
        search_surge = min(1.0, max(0.0, (look_to_book - 20.0) / 30.0))
        season_surge = max(0.0, seasonality - 1.0)
        # Multiplier ranges from 1.30 to 1.95x
        censorship_mult = 1.0 + (0.50 * search_surge) + (0.35 * season_surge)
    else:
        # Inventory had remaining capacity; slight signal adjustment
        censorship_mult = 1.0 + (0.10 * max(0.0, (look_to_book - 35.0) / 40.0))

    unconstrained_base = hist * censorship_mult
    # Multiply by market seasonality and external event signal (e.g. festivals, conferences)
    true_demand = int(round(unconstrained_base * seasonality * event_signal))
    return true_demand, round(censorship_mult, 2)


def compute_dynamic_pricing(
    item: Dict[str, Any], unconstrained_demand: int
) -> Tuple[float, float]:
    """
    Stage 3 Helper: Computes surge-adjusted dynamic selling price.
    Returns: (dynamic_price, price_surge_pct)
    """
    base_price = item["base_selling_price"]
    hist = item["historical_bookings"]
    demand_ratio = unconstrained_demand / max(hist, 1)

    if demand_ratio > 1.25:
        surge_pct = min(0.28, 0.08 + 0.14 * (demand_ratio - 1.0))
    elif demand_ratio > 1.0:
        surge_pct = 0.05 + 0.08 * (demand_ratio - 1.0)
    else:
        surge_pct = max(-0.06, -0.05 * (1.0 - demand_ratio))

    dynamic_price = round(base_price * (1.0 + surge_pct), 2)
    return dynamic_price, round(surge_pct * 100, 1)


def classify_allocation_strategy(
    quantity: int, volatility: float, demand_ratio: float, period: str
) -> Tuple[str, str, str]:
    """
    Stage 3: Hybrid procurement classification, purchase window, and explanation.
    """
    if quantity == 0:
        strategy = "No Allocation"
        window = "Hold / Monitor"
        explanation = "High downside volatility or unfavorable risk-reward profile relative to current budget cap."
        return strategy, window, explanation

    if volatility <= 0.18 and demand_ratio >= 1.0:
        strategy = "Pre-Buy (Hard Allocation)"
        if period == "Peak Holiday":
            window = "Immediate Pre-Buy (45–60 days out)"
        elif period == "Long Weekend":
            window = "Prime Window (30–45 days out)"
        else:
            window = "Optimal Window (20–30 days out)"
        explanation = f"High demand confidence with low volatility ({int(volatility*100)}%) justifies locking in hard block rates to maximize profit spread."
    else:
        strategy = "Supplier Integration (Soft Allocation)"
        if period == "Peak Holiday":
            window = "Soft Allotment with 14-day Release"
        elif period == "Long Weekend":
            window = "Dynamic API Pull (7–14 days out)"
        else:
            window = "Just-in-Time Live Integration (3–7 days out)"
        explanation = f"Elevated demand volatility ({int(volatility*100)}%) warrants soft on-demand API procurement to hedge cancellation and unsold inventory risk."

    return strategy, window, explanation


def optimize_portfolio(
    items: List[Dict[str, Any]],
    max_budget: float,
    risk_appetite: str = "balanced",
    filter_type: str = "All",
) -> Dict[str, Any]:
    """
    Stage 2: Solves the risk-adjusted constrained knapsack optimization.
    Returns:
    - kpis: dict
    - allocations: list of enriched items
    - frontier: list of points across lambda values
    """
    appetite_config = RISK_APPETITE_MAP.get(risk_appetite.lower(), RISK_APPETITE_MAP["balanced"])
    lambda_val = appetite_config["lambda"]
    demand_buffer = appetite_config["demand_buffer"]

    # Filter items if needed
    if filter_type and filter_type != "All":
        filtered_items = [it for it in items if it["type"].lower() == filter_type.lower()]
    else:
        filtered_items = list(items)

    if not filtered_items:
        return {
            "kpis": {
                "total_budget_used": 0.0,
                "expected_profit": 0.0,
                "risk_adjusted_roi": 0.0,
                "estimated_unsold_risk_pct": 0.0,
                "items_procured_count": 0,
            },
            "allocations": [],
            "frontier": [],
        }

    # Step 1: Precompute recovered demand and unit economics
    item_metadata = []
    costs = []
    obj_coeffs = []
    upper_bounds = []

    for it in filtered_items:
        true_demand, censor_mult = recover_censored_demand(it)
        dynamic_price, surge_pct = compute_dynamic_pricing(it, true_demand)

        cost = it["procurement_cost_per_unit"]
        cancel_rate = it["cancellation_rate"]
        volatility = it["demand_volatility"]
        max_units = it["max_available_units"]

        # Unit economics:
        # Realized net revenue per unit = dynamic_price * (1 - cancel_rate)
        # Unit expected profit = Realized net revenue - cost
        unit_expected_profit = (dynamic_price * (1.0 - cancel_rate)) - cost

        # Unit unsold & cancellation risk dollar metric:
        # Cost at risk amplified by volatility and cancellation probability
        unit_risk = cost * (volatility * 1.6 + cancel_rate)

        # Net objective coefficient = Expected Profit - (lambda * Unit Risk)
        net_value = unit_expected_profit - (lambda_val * unit_risk)

        # Demand-informed maximum quantity we would willingly procure
        capped_demand = int(np.ceil(true_demand * demand_buffer))
        ub = min(max_units, max(0, capped_demand))

        costs.append(cost)
        obj_coeffs.append(net_value)
        upper_bounds.append(ub)

        item_metadata.append({
            "item": it,
            "true_demand": true_demand,
            "censor_mult": censor_mult,
            "dynamic_price": dynamic_price,
            "surge_pct": surge_pct,
            "unit_profit": unit_expected_profit,
            "unit_risk": unit_risk,
            "net_value": net_value,
            "ub": ub,
        })

    num_items = len(filtered_items)
    costs = np.array(costs, dtype=float)
    obj_coeffs = np.array(obj_coeffs, dtype=float)
    upper_bounds = np.array(upper_bounds, dtype=float)

    # Step 2: Solve Integer Linear Program (MILP)
    # Maximize sum(obj_coeffs[i] * x[i])  <=>  Minimize sum(-obj_coeffs[i] * x[i])
    # Subject to: sum(costs[i] * x[i]) <= max_budget
    # 0 <= x[i] <= upper_bounds[i], x[i] in Z
    c = -obj_coeffs
    integrality = np.ones(num_items)  # all integer variables
    bounds = Bounds(lb=np.zeros(num_items), ub=upper_bounds)
    constraints = LinearConstraint(costs.reshape(1, -1), lb=0, ub=max_budget)

    # If any net_value is strictly <= 0, enforce upper bound 0 so we never buy losing inventory
    loss_mask = obj_coeffs <= 0
    if np.any(loss_mask):
        effective_ub = upper_bounds.copy()
        effective_ub[loss_mask] = 0
        bounds = Bounds(lb=np.zeros(num_items), ub=effective_ub)

    try:
        res = milp(c=c, integrality=integrality, bounds=bounds, constraints=constraints)
        if res.success:
            quantities = np.round(res.x).astype(int)
        else:
            # Fallback to greedy knapsack
            quantities = _solve_greedy_knapsack(costs, obj_coeffs, upper_bounds, max_budget)
    except Exception:
        quantities = _solve_greedy_knapsack(costs, obj_coeffs, upper_bounds, max_budget)

    # Double check budget constraint strictly respected
    while np.sum(quantities * costs) > max_budget:
        # Decrement item with lowest positive margin/cost ratio
        positive_indices = np.where(quantities > 0)[0]
        if len(positive_indices) == 0:
            break
        # Pick the one with lowest net value per cost
        ratios = [obj_coeffs[idx] / costs[idx] for idx in positive_indices]
        worst_idx = positive_indices[np.argmin(ratios)]
        quantities[worst_idx] -= 1

    # Step 3: Build enriched allocation output & calculate overall KPIs
    allocations = []
    total_budget_used = 0.0
    total_expected_profit = 0.0
    total_risk_dollars = 0.0
    total_units_procured = 0

    for idx, meta in enumerate(item_metadata):
        it = meta["item"]
        q = int(quantities[idx])
        cost = it["procurement_cost_per_unit"]
        total_cost = round(q * cost, 2)
        exp_profit = round(q * meta["unit_profit"], 2) if q > 0 else 0.0
        risk_dollars = round(q * meta["unit_risk"], 2) if q > 0 else 0.0

        if q > 0:
            total_budget_used += total_cost
            total_expected_profit += exp_profit
            total_risk_dollars += risk_dollars
            total_units_procured += q

        demand_ratio = meta["true_demand"] / max(it["historical_bookings"], 1)
        strategy, window, explanation = classify_allocation_strategy(
            quantity=q,
            volatility=it["demand_volatility"],
            demand_ratio=demand_ratio,
            period=it["travel_period"],
        )

        margin_pct = round((meta["unit_profit"] / cost) * 100, 1) if cost > 0 else 0.0

        allocations.append({
            "id": it["id"],
            "name": it["name"],
            "destination": it["destination"],
            "type": it["type"],
            "travel_period": it["travel_period"],
            "event_name": it["event_name"],
            "historical_bookings": it["historical_bookings"],
            "unconstrained_demand": meta["true_demand"],
            "censorship_multiplier": meta["censor_mult"],
            "look_to_book_ratio": it["look_to_book_ratio"],
            "was_sold_out": it["was_sold_out"],
            "procurement_cost_per_unit": cost,
            "base_selling_price": it["base_selling_price"],
            "dynamic_selling_price": meta["dynamic_price"],
            "price_surge_pct": meta["surge_pct"],
            "max_available_units": it["max_available_units"],
            "recommended_quantity": q,
            "allocated_budget": total_cost,
            "expected_profit": exp_profit,
            "profit_margin_pct": margin_pct,
            "demand_volatility": it["demand_volatility"],
            "cancellation_rate": it["cancellation_rate"],
            "strategy": strategy,
            "purchase_window": window,
            "reasoning": explanation,
        })

    # Sort allocations: first items with recommended_quantity > 0 by expected profit descending, then others
    allocations.sort(key=lambda x: (x["recommended_quantity"] > 0, x["expected_profit"]), reverse=True)

    # Compute overall portfolio KPIs
    risk_adjusted_roi = round(
        ((total_expected_profit - (lambda_val * total_risk_dollars)) / max(total_budget_used, 1.0)) * 100,
        1,
    ) if total_budget_used > 0 else 0.0

    unsold_risk_pct = round(
        (total_risk_dollars / max(total_budget_used, 1.0)) * 100,
        1,
    ) if total_budget_used > 0 else 0.0

    kpis = {
        "total_budget_used": round(total_budget_used, 2),
        "budget_limit": max_budget,
        "budget_utilization_pct": round((total_budget_used / max(max_budget, 1.0)) * 100, 1),
        "expected_profit": round(total_expected_profit, 2),
        "risk_adjusted_roi": risk_adjusted_roi,
        "estimated_unsold_risk_pct": unsold_risk_pct,
        "items_procured_count": sum(1 for q in quantities if q > 0),
        "total_units_procured": total_units_procured,
        "risk_appetite": risk_appetite,
        "lambda_penalty": lambda_val,
    }

    # Step 4: Efficient Frontier Calculation (sweep lambda across risk spectrum)
    frontier = _compute_efficient_frontier(filtered_items, max_budget, current_lambda=lambda_val)

    return {
        "kpis": kpis,
        "allocations": allocations,
        "frontier": frontier,
    }


def _solve_greedy_knapsack(
    costs: np.ndarray, obj_coeffs: np.ndarray, upper_bounds: np.ndarray, max_budget: float
) -> np.ndarray:
    """Fallback greedy solver for knapsack optimization."""
    quantities = np.zeros(len(costs), dtype=int)
    remaining_budget = max_budget

    # Efficiency ratio: value / cost
    ratios = []
    for i in range(len(costs)):
        if obj_coeffs[i] > 0 and costs[i] > 0:
            ratios.append((obj_coeffs[i] / costs[i], i))
        else:
            ratios.append((-1.0, i))

    ratios.sort(key=lambda x: x[0], reverse=True)

    for ratio, i in ratios:
        if ratio <= 0 or remaining_budget <= 0:
            break
        cost = costs[i]
        max_can_buy = int(remaining_budget // cost)
        buy_qty = min(int(upper_bounds[i]), max_can_buy)
        if buy_qty > 0:
            quantities[i] = buy_qty
            remaining_budget -= buy_qty * cost

    return quantities


def _compute_efficient_frontier(
    items: List[Dict[str, Any]], max_budget: float, current_lambda: float
) -> List[Dict[str, Any]]:
    """
    Computes points on the Efficient Frontier by varying lambda (risk penalty).
    Returns list of { risk_score, expected_profit, budget_used, lambda_val, is_current, label }
    """
    lambdas = [
        (0.15, "Very Aggressive"),
        (0.30, "Aggressive"),
        (0.55, "Growth"),
        (0.75, "Balanced"),
        (1.10, "Moderate"),
        (1.45, "Conservative"),
        (1.90, "Defensive"),
    ]

    frontier_points = []
    num_items = len(items)
    if num_items == 0:
        return frontier_points

    costs = np.array([it["procurement_cost_per_unit"] for it in items], dtype=float)

    # Pre-calculate true demand and unit economics for each item
    item_stats = []
    for it in items:
        true_demand, _ = recover_censored_demand(it)
        dynamic_price, _ = compute_dynamic_pricing(it, true_demand)
        cost = it["procurement_cost_per_unit"]
        unit_profit = (dynamic_price * (1.0 - it["cancellation_rate"])) - cost
        unit_risk = cost * (it["demand_volatility"] * 1.6 + it["cancellation_rate"])
        ub = min(it["max_available_units"], int(np.ceil(true_demand * 1.15)))
        item_stats.append({
            "unit_profit": unit_profit,
            "unit_risk": unit_risk,
            "ub": ub,
        })

    for l_val, label in lambdas:
        obj_coeffs = np.array([
            st["unit_profit"] - (l_val * st["unit_risk"])
            for st in item_stats
        ])
        upper_bounds = np.array([st["ub"] for st in item_stats], dtype=float)

        effective_ub = upper_bounds.copy()
        effective_ub[obj_coeffs <= 0] = 0

        # Fast knapsack solve
        quantities = _solve_greedy_knapsack(costs, obj_coeffs, effective_ub, max_budget)

        tot_budget = float(np.sum(quantities * costs))
        tot_profit = float(np.sum([
            quantities[i] * item_stats[i]["unit_profit"] for i in range(num_items)
        ]))
        tot_risk = float(np.sum([
            quantities[i] * item_stats[i]["unit_risk"] for i in range(num_items)
        ]))

        is_current = abs(l_val - current_lambda) < 0.12

        frontier_points.append({
            "risk_score": round(tot_risk, 0),
            "expected_profit": round(tot_profit, 0),
            "budget_used": round(tot_budget, 0),
            "lambda_val": l_val,
            "label": label,
            "is_current": is_current,
        })

    frontier_points.sort(key=lambda p: p["risk_score"])
    return frontier_points
