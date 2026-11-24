"use client";

import React from "react";
import { TrendingUp, Percent, Wallet, AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { KpiSummaryData } from "../types";

interface KpiSummaryProps {
  kpis: KpiSummaryData | null;
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({ kpis }) => {
  if (!kpis) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const cards = [
    {
      title: "Expected Net Profit",
      value: formatCurrency(kpis.expected_profit),
      subtitle: `${((kpis.expected_profit / Math.max(kpis.total_budget_used, 1)) * 100).toFixed(1)}% blended margin`,
      icon: TrendingUp,
      iconColor: "text-emerald-400",
      bgColor: "from-emerald-500/10 via-slate-900 to-slate-900",
      borderColor: "border-emerald-500/30",
      badge: "+ Projected Gain",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    {
      title: "Risk-Adjusted ROI",
      value: `${kpis.risk_adjusted_roi.toFixed(1)}%`,
      subtitle: `Net of penalty (λ = ${kpis.lambda_penalty})`,
      icon: Percent,
      iconColor: "text-sky-400",
      bgColor: "from-sky-500/10 via-slate-900 to-slate-900",
      borderColor: "border-sky-500/30",
      badge: "Sharpe-Equivalent",
      badgeColor: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    },
    {
      title: "Budget Utilized",
      value: formatCurrency(kpis.total_budget_used),
      subtitle: `${kpis.budget_utilization_pct.toFixed(1)}% of ${formatCurrency(kpis.budget_limit)} cap`,
      icon: Wallet,
      iconColor: "text-[#FF5E14]",
      bgColor: "from-[#FF5E14]/10 via-slate-900 to-slate-900",
      borderColor: "border-[#FF5E14]/30",
      badge: `${kpis.items_procured_count} assets procured`,
      badgeColor: "bg-[#FF5E14]/15 text-[#FF5E14] border-[#FF5E14]/30",
    },
    {
      title: "Unsold & Cancellation Risk",
      value: `${kpis.estimated_unsold_risk_pct.toFixed(1)}%`,
      subtitle: `${formatCurrency(kpis.total_budget_used * (kpis.estimated_unsold_risk_pct / 100))} portfolio exposure`,
      icon: AlertTriangle,
      iconColor: "text-amber-400",
      bgColor: "from-amber-500/10 via-slate-900 to-slate-900",
      borderColor: "border-amber-500/30",
      badge: "Hedging Active",
      badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`rounded-2xl p-5 bg-gradient-to-b ${card.bgColor} border ${card.borderColor} shadow-lg relative overflow-hidden transition-all hover:translate-y-[-2px]`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {card.value}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>{card.subtitle}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                {card.badge}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Real-Time
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
