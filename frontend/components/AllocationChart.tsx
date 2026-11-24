"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Layers } from "lucide-react";
import { AllocationItem } from "../types";

interface AllocationChartProps {
  allocations: AllocationItem[];
}

interface DestinationData {
  destination: string;
  preBuy: number;
  softAllocation: number;
  total: number;
}

export const AllocationChart: React.FC<AllocationChartProps> = ({ allocations }) => {
  const chartData = useMemo(() => {
    const destMap: Record<string, { preBuy: number; softAllocation: number }> = {};

    allocations.forEach((item) => {
      if (item.recommended_quantity <= 0) return;
      if (!destMap[item.destination]) {
        destMap[item.destination] = { preBuy: 0, softAllocation: 0 };
      }
      if (item.strategy.includes("Pre-Buy")) {
        destMap[item.destination].preBuy += item.allocated_budget;
      } else {
        destMap[item.destination].softAllocation += item.allocated_budget;
      }
    });

    const result: DestinationData[] = Object.keys(destMap).map((dest) => ({
      destination: dest,
      preBuy: Math.round(destMap[dest].preBuy),
      softAllocation: Math.round(destMap[dest].softAllocation),
      total: Math.round(destMap[dest].preBuy + destMap[dest].softAllocation),
    }));

    // Sort by total allocated budget descending
    return result.sort((a, b) => b.total - a.total).slice(0, 8);
  }, [allocations]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const preBuyVal = payload.find((p: any) => p.dataKey === "preBuy")?.value || 0;
      const softVal = payload.find((p: any) => p.dataKey === "softAllocation")?.value || 0;
      const total = preBuyVal + softVal;

      return (
        <div className="bg-[#0f172a] border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
          <div className="font-bold text-white border-b border-slate-800 pb-1 text-sm">
            {label}
          </div>
          <div className="flex justify-between items-center text-emerald-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
              Pre-Buy (Hard):
            </span>
            <span className="font-mono font-semibold">${preBuyVal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-amber-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
              Supplier Int. (Soft):
            </span>
            <span className="font-mono font-semibold">${softVal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800 font-bold">
            <span>Total Destination:</span>
            <span className="font-mono">${total.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[380px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Budget Allocation by Destination & Strategy
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hard Pre-Buy vs. Soft Supplier Integration breakdown
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span>Pre-Buy</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span>Supplier Int.</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No active allocations for the current filter/budget.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="destination"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="preBuy"
                name="Pre-Buy (Hard)"
                stackId="dest"
                fill="#10b981"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="softAllocation"
                name="Supplier Int. (Soft)"
                stackId="dest"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
