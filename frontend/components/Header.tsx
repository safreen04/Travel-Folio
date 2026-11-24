"use client";

import React from "react";
import { Sparkles, Layers, ShieldCheck, RefreshCw } from "lucide-react";

interface HeaderProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading }) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#0c121e]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5E14] to-[#f97316] flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-xl tracking-tighter">
            TF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Travel-Folio
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FF5E14]/15 text-[#FF5E14] border border-[#FF5E14]/30">
                  TBO.COM EDITION
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              AI Decision-Support & Risk-Adjusted Inventory Procurement Engine
            </p>
          </div>
        </div>

        {/* Status Pills & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>HiGHS MILP Optimizer: Online</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Censored Demand Recovery Active</span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
              title="Recalculate Portfolio"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-orange-400" : ""}`} />
              <span>Optimize</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
