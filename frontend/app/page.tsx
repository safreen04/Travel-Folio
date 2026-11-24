"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "../components/Header";
import { ControlBar } from "../components/ControlBar";
import { KpiSummary } from "../components/KpiSummary";
import { AllocationChart } from "../components/AllocationChart";
import { EfficientFrontierChart } from "../components/EfficientFrontierChart";
import { ProcurementTable } from "../components/ProcurementTable";
import { ItemDetailModal } from "../components/ItemDetailModal";
import { RiskAppetite, InventoryTypeFilter, OptimizeResponse, AllocationItem } from "../types";
import { AlertCircle, RefreshCw, Sparkles, TrendingUp, ShieldAlert, Cpu } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [maxBudget, setMaxBudget] = useState<number>(250000);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>("balanced");
  const [filterType, setFilterType] = useState<InventoryTypeFilter>("All");

  const [data, setData] = useState<OptimizeResponse | null>(null);
  const [selectedItem, setSelectedItem] = useState<AllocationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOptimization = useCallback(
    async (budget: number, appetite: RiskAppetite, filter: InventoryTypeFilter, isInitial: boolean = false) => {
      try {
        if (isInitial) {
          setLoading(true);
        } else {
          setIsUpdating(true);
        }
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/optimize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            max_budget: budget,
            risk_appetite: appetite,
            filter_type: filter,
          }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        const json: OptimizeResponse = await res.json();
        setData(json);
      } catch (err: any) {
        console.error("Optimization failed:", err);
        setError(err.message || "Failed to connect to Travel-Folio optimization backend.");
      } finally {
        setLoading(false);
        setIsUpdating(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchOptimization(maxBudget, riskAppetite, filterType, true);
  }, []);

  // Debounced trigger on controls change
  const handleBudgetChange = (newBudget: number) => {
    setMaxBudget(newBudget);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchOptimization(newBudget, riskAppetite, filterType);
    }, 200);
  };

  const handleRiskChange = (newAppetite: RiskAppetite) => {
    setRiskAppetite(newAppetite);
    fetchOptimization(maxBudget, newAppetite, filterType);
  };

  const handleFilterChange = (newFilter: InventoryTypeFilter) => {
    setFilterType(newFilter);
    fetchOptimization(maxBudget, riskAppetite, newFilter);
  };

  const handleManualRefresh = () => {
    fetchOptimization(maxBudget, riskAppetite, filterType, false);
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col">
      {/* Sticky Top Header */}
      <Header onRefresh={handleManualRefresh} isLoading={isUpdating || loading} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Value Proposition Hero / Context Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e172a] to-slate-900 border border-slate-800 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#FF5E14] bg-[#FF5E14]/10 px-2.5 py-0.5 rounded-full border border-[#FF5E14]/25">
                  <Cpu className="w-3.5 h-3.5" />
                  Dual-Stage Algorithmic Engine
                </span>
                <span className="text-[11px] text-slate-400">
                  Built for TBO.com B2B Travel Inventory
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Autonomous Inventory Portfolio Optimization
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Reconstructs <span className="text-sky-400 font-semibold">censored true demand</span> from truncated booking logs, optimizes risk-adjusted capital via <span className="text-emerald-400 font-semibold">HiGHS MILP Knapsack</span>, and segregates allocations into high-conviction <strong>Pre-Buys</strong> vs. hedgeable <strong>Supplier Soft Allotments</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl text-center min-w-[110px]">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Destinations</span>
                <span className="text-lg font-bold text-white font-mono">10 Hubs</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl text-center min-w-[110px]">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Catalog Items</span>
                <span className="text-lg font-bold text-[#FF5E14] font-mono">70 Batches</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Control Bar */}
        <ControlBar
          maxBudget={maxBudget}
          onBudgetChange={handleBudgetChange}
          riskAppetite={riskAppetite}
          onRiskChange={handleRiskChange}
          filterType={filterType}
          onFilterChange={handleFilterChange}
          isUpdating={isUpdating}
        />

        {/* Error Alert if any */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleManualRefresh}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white font-semibold"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !data && (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#FF5E14] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              Running Censored Demand Recovery & MILP Optimization...
            </p>
            <p className="text-xs text-slate-500">
              Connecting to FastAPI backend at {API_BASE_URL}
            </p>
          </div>
        )}

        {/* Main Dashboard Content */}
        {data && (
          <div className="space-y-6">
            {/* KPI Summary Row */}
            <KpiSummary kpis={data.kpis} />

            {/* Visualizations Row (2 Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AllocationChart allocations={data.allocations} />
              <EfficientFrontierChart
                frontier={data.frontier}
                currentRoi={data.kpis.risk_adjusted_roi}
              />
            </div>

            {/* Actionable Procurement Table */}
            <ProcurementTable
              allocations={data.allocations}
              onSelectItem={(item) => setSelectedItem(item)}
            />
          </div>
        )}
      </main>

      {/* Item Signals Deep Dive Modal */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-5 px-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            <strong>Travel-Folio</strong> © {new Date().getFullYear()} — Decision-Support Platform for TBO.com
          </span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>FastAPI + SciPy HiGHS</span>
            <span>•</span>
            <span>Next.js 14 App Router</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Recharts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
