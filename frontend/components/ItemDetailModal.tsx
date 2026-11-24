"use client";

import React from "react";
import { X, Calendar, Sparkles, AlertCircle, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { AllocationItem } from "../types";

interface ItemDetailModalProps {
  item: AllocationItem | null;
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const isPreBuy = item.strategy.includes("Pre-Buy");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold text-[#FF5E14] bg-[#FF5E14]/15 px-2 py-0.5 rounded border border-[#FF5E14]/30">
                {item.id}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {item.destination} • {item.type}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{item.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Strategy & Recommended Action */}
          <div className={`p-4 rounded-xl border ${isPreBuy ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isPreBuy ? "text-emerald-400" : "text-amber-400"}`}>
                Strategy: {item.strategy}
              </span>
              <span className="text-xs font-medium text-slate-300">
                Purchase Window: <strong className="text-white">{item.purchase_window}</strong>
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {item.reasoning}
            </p>
          </div>

          {/* Censored Demand Recovery Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Stage 1: Censored Demand Recovery Breakdown
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Observed Bookings</span>
                <span className="text-base font-bold text-white font-mono">{item.historical_bookings}</span>
                <span className="text-[10px] text-slate-500 block">Past Period</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Sold Out History</span>
                <span className={`text-base font-bold font-mono ${item.was_sold_out ? "text-amber-400" : "text-slate-300"}`}>
                  {item.was_sold_out ? "YES (Censored)" : "NO"}
                </span>
                <span className="text-[10px] text-slate-500 block">Truncation Flag</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Look-to-Book Ratio</span>
                <span className="text-base font-bold text-purple-400 font-mono">{item.look_to_book_ratio}</span>
                <span className="text-[10px] text-slate-500 block">Search Intensity</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Unconstrained Demand</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{item.unconstrained_demand}</span>
                <span className="text-[10px] text-emerald-500/80 block">+{((item.unconstrained_demand / Math.max(item.historical_bookings, 1) - 1) * 100).toFixed(0)}% Latent Surge</span>
              </div>
            </div>

            {/* Event Signal note */}
            <div className="mt-3 text-xs text-slate-400 flex items-center justify-between bg-slate-800/40 px-3 py-2 rounded-lg border border-slate-700/30">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                Travel Period: <strong className="text-slate-200">{item.travel_period}</strong>
              </span>
              <span>
                Event: <strong className="text-slate-200">{item.event_name}</strong>
              </span>
            </div>
          </div>

          {/* Pricing & Unit Economics */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Stage 2 & 3: Allocation & Dynamic Pricing
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Procurement Cost</span>
                <span className="text-base font-bold text-white font-mono">${item.procurement_cost_per_unit}</span>
                <span className="text-[10px] text-slate-500 block">Negotiated rate</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Dynamic Selling Price</span>
                <span className="text-base font-bold text-sky-400 font-mono">${item.dynamic_selling_price}</span>
                <span className="text-[10px] text-sky-400/80 block">
                  {item.price_surge_pct >= 0 ? `+${item.price_surge_pct}% surge` : `${item.price_surge_pct}% promo`}
                </span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Recommended Quantity</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {item.recommended_quantity} <span className="text-xs text-slate-500 font-normal">/ {item.max_available_units} units</span>
                </span>
                <span className="text-[10px] text-slate-500 block">${item.allocated_budget.toLocaleString()} allocated</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30 flex justify-between items-center text-xs">
                <span className="text-slate-400">Demand Volatility:</span>
                <span className="font-mono font-semibold text-white">{(item.demand_volatility * 100).toFixed(0)}%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30 flex justify-between items-center text-xs">
                <span className="text-slate-400">Cancellation Rate:</span>
                <span className="font-mono font-semibold text-white">{(item.cancellation_rate * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close Deep Dive
          </button>
        </div>
      </div>
    </div>
  );
};
