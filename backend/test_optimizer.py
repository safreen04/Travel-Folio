"""
Test script for Travel-Folio optimizer and data generator.
"""

from data_generator import generate_inventory
from optimizer import optimize_portfolio, recover_censored_demand

def test_data_generation():
    items = generate_inventory(seed=42)
    assert len(items) >= 50, f"Expected >= 50 items, got {len(items)}"
    destinations = set(it["destination"] for it in items)
    assert len(destinations) >= 6, f"Expected multiple destinations, got {len(destinations)}"
    types = set(it["type"] for it in items)
    assert "Hotel Block" in types and "Flight Seat Block" in types
    
    for it in items:
        assert "historical_bookings" in it
        assert "look_to_book_ratio" in it
        assert "was_sold_out" in it
        assert "procurement_cost_per_unit" in it
        assert "base_selling_price" in it
        assert "max_available_units" in it
        assert "cancellation_rate" in it
        assert "demand_volatility" in it
        assert 0.05 <= it["demand_volatility"] <= 0.40
    print(f"Data Generation Test Passed: {len(items)} items across {len(destinations)} destinations.")

def test_censored_demand():
    items = generate_inventory(seed=42)
    sold_out_items = [it for it in items if it["was_sold_out"]]
    assert len(sold_out_items) > 0, "Expected at least one sold-out item"
    
    for it in sold_out_items[:5]:
        true_demand, mult = recover_censored_demand(it)
        assert mult >= 1.0, f"Censorship multiplier should be >= 1.0, got {mult}"
        print(f"Item: {it['name']} | Hist: {it['historical_bookings']} | Mult: {mult}x | True Demand: {true_demand}")
    print("Censored Demand Recovery Test Passed.")

def test_optimizer_budgets():
    items = generate_inventory(seed=42)
    test_budgets = [50000.0, 150000.0, 300000.0, 750000.0]
    
    for budget in test_budgets:
        for appetite in ["conservative", "balanced", "aggressive"]:
            res = optimize_portfolio(items, max_budget=budget, risk_appetite=appetite)
            kpis = res["kpis"]
            allocations = res["allocations"]
            frontier = res["frontier"]
            
            # CRITICAL CONSTRAINT CHECK
            budget_used = kpis["total_budget_used"]
            assert budget_used <= budget + 1e-4, f"Budget exceeded! Used: {budget_used}, Max: {budget}"
            
            # Check non-negative profit and valid allocations
            assert kpis["expected_profit"] >= 0
            assert len(frontier) > 0
            
            # Verify allocation details
            procured = [a for a in allocations if a["recommended_quantity"] > 0]
            for a in procured:
                assert a["recommended_quantity"] <= a["max_available_units"]
                assert a["strategy"] in ["Pre-Buy (Hard Allocation)", "Supplier Integration (Soft Allocation)"]
                assert a["dynamic_selling_price"] >= a["procurement_cost_per_unit"]
                assert len(a["reasoning"]) > 10
                
            print(f"Budget ${budget:,.0f} [{appetite.upper()}]: Used ${budget_used:,.0f} ({kpis['budget_utilization_pct']}%) | Profit: ${kpis['expected_profit']:,.0f} | Procured items: {kpis['items_procured_count']}")

    print("Portfolio Optimizer All Budget Constraints Test Passed!")

if __name__ == "__main__":
    test_data_generation()
    test_censored_demand()
    test_optimizer_budgets()
    print("ALL BACKEND TESTS PASSED SUCCESSFULLY!")
