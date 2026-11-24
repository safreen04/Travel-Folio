import urllib.request
import json
import sys

def verify_all():
    print("=== STARTING FULL STACK VERIFICATION ===")
    
    # 1. Test Backend Health
    health_url = "http://127.0.0.1:8000/api/health"
    req = urllib.request.Request(health_url)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        print(f"Health Check Passed: {data}")
        assert data["total_inventory_items"] >= 50

    # 2. Test Inventory Endpoint
    inv_url = "http://127.0.0.1:8000/api/inventory"
    with urllib.request.urlopen(inv_url) as resp:
        assert resp.status == 200
        inv_data = json.loads(resp.read().decode())
        print(f"Inventory Endpoint Passed: {inv_data['count']} items returned.")

    # 3. Test Optimize Endpoint with various constraints
    test_cases = [
        {"max_budget": 100000.0, "risk_appetite": "conservative", "filter_type": "All"},
        {"max_budget": 250000.0, "risk_appetite": "balanced", "filter_type": "Hotel Block"},
        {"max_budget": 500000.0, "risk_appetite": "aggressive", "filter_type": "Flight Seat Block"},
        {"max_budget": 1000000.0, "risk_appetite": "balanced", "filter_type": "All"},
    ]

    opt_url = "http://127.0.0.1:8000/api/optimize"
    for tc in test_cases:
        payload = json.dumps(tc).encode("utf-8")
        req = urllib.request.Request(opt_url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            res = json.loads(resp.read().decode())
            kpis = res["kpis"]
            allocations = res["allocations"]
            frontier = res["frontier"]

            # Strict Budget Check
            used = kpis["total_budget_used"]
            cap = tc["max_budget"]
            assert used <= cap, f"BUDGET BREACH! Used {used} > Cap {cap}"
            
            print(f"Test Case [Budget: ${cap:,.0f}, Risk: {tc['risk_appetite']}, Filter: {tc['filter_type']}]:")
            print(f"  -> Budget Utilized: ${used:,.0f} ({kpis['budget_utilization_pct']}%)")
            print(f"  -> Expected Profit: ${kpis['expected_profit']:,.0f}")
            print(f"  -> Risk-Adjusted ROI: {kpis['risk_adjusted_roi']}%")
            print(f"  -> Items Procured: {kpis['items_procured_count']} | Units: {kpis['total_units_procured']}")
            print(f"  -> Frontier Points: {len(frontier)}")
            
            # Check allocation validity
            for a in allocations[:3]:
                if a["recommended_quantity"] > 0:
                    assert a["dynamic_selling_price"] >= a["procurement_cost_per_unit"]
                    assert a["strategy"] in ["Pre-Buy (Hard Allocation)", "Supplier Integration (Soft Allocation)"]
                    assert len(a["reasoning"]) > 10

    # 4. Test Frontend Server (Next.js)
    frontend_url = "http://localhost:3000"
    req_fe = urllib.request.Request(frontend_url)
    with urllib.request.urlopen(req_fe) as resp:
        assert resp.status == 200
        html = resp.read().decode("utf-8")
        assert "Travel-Folio" in html or "Next" in html
        print("Frontend Server Passed: Next.js app serving HTTP 200 successfully!")

    print("=== ALL VERIFICATION CHECKS PASSED PERFECTLY! ===")

if __name__ == "__main__":
    verify_all()
