"use client";

import React from "react";
import { DollarSign, ShieldAlert, ShieldCheck, Zap, Sliders, Building2, Plane, Filter } from "lucide-react";
import { RiskAppetite, InventoryTypeFilter } from "../types";

interface ControlBarProps {
  maxBudget: number;
  onBudgetChange: (val: number) => void;
  riskAppetite: RiskAppetite;
  onRiskChange: (val: RiskAppetite) => void;
  filterType: InventoryTypeFilter;
  onFilterChange: (val: InventoryTypeFilter) => void;
  isUpdating: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  maxBudget,
  onBudgetChange,
  riskAppetite,
  onRiskChange,
  filterType,
  onFilterChange,
  isUpdating,
}) => {
  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const budgetPresets = [100000, 250000, 500000, 1000000];

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Subtle top indicator if actively optimizing */}
      {isUpdating && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF5E14] to-transparent animate-pulse" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Control 1: Max Budget Slider (5 Cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#FF5E14]" />
              Procurement Budget Cap
            </label>
            <span className="text-lg font-bold text-white font-mono bg-slate-900/80 px-2.5 py-0.5 rounded border border-slate-700/60 shadow-inner">
              {formatCurrency(maxBudget)}
            </span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min={50000}
              max={1000000}
              step={10000}
              value={maxBudget}
              onChange={(e) => onBudgetChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FF5E14]"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>$50,000</span>
              <span>$500,000</span>
              <span>$1,000,000</span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
            {budgetPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => onBudgetChange(preset)}
                className={`text-[11px] px-2 py-0.5 rounded font-mono transition-colors ${
                  maxBudget === preset
                    ? "bg-[#FF5E14] text-white font-semibold"
                    : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                }`}
              >
                ${preset >= 1000000 ? "1.0M" : `${preset / 1000}k`}
              </button>
            ))}
          </div>
        </div>

        {/* Control 2: Risk Appetite Selector (4 Cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-sky-400" />
              Risk Appetite Profile
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {riskAppetite === "conservative" && "λ = 1.45 (High Penalty)"}
              {riskAppetite === "balanced" && "λ = 0.75 (Balanced)"}
              {riskAppetite === "aggressive" && "λ = 0.22 (Low Penalty)"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onRiskChange("conservative")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                riskAppetite === "conservative"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <ShieldCheck className="w-4 h-4 mb-1" />
              <span>Conservative</span>
            </button>

            <button
              onClick={() => onRiskChange("balanced")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                riskAppetite === "balanced"
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Zap className="w-4 h-4 mb-1" />
              <span>Balanced</span>
            </button>

            <button
              onClick={() => onRiskChange("aggressive")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                riskAppetite === "aggressive"
                  ? "bg-[#FF5E14]/20 text-[#FF5E14] border border-[#FF5E14]/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <ShieldAlert className="w-4 h-4 mb-1" />
              <span>Aggressive</span>
            </button>
          </div>
        </div>

        {/* Control 3: Inventory Type Filter (3 Cols) */}
        <div className="lg:col-span-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-purple-400" />
              Asset Class
            </label>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onFilterChange("All")}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                filterType === "All"
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => onFilterChange("Hotel Block")}
              className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all ${
                filterType === "Hotel Block"
                  ? "bg-slate-800 text-sky-400 border border-sky-600/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Hotels
            </button>
            <button
              onClick={() => onFilterChange("Flight Seat Block")}
              className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all ${
                filterType === "Flight Seat Block"
                  ? "bg-slate-800 text-orange-400 border border-orange-600/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              Flights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
