"use client";

import React from "react";
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { Activity } from "lucide-react";
import { FrontierPoint } from "../types";

interface EfficientFrontierChartProps {
  frontier: FrontierPoint[];
  currentRoi?: number;
}

export const EfficientFrontierChart: React.FC<EfficientFrontierChartProps> = ({
  frontier,
}) => {
  // Find current active point
  const currentPoint = frontier.find((p) => p.is_current) || frontier[Math.floor(frontier.length / 2)];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as FrontierPoint;
      return (
        <div className="bg-[#0f172a] border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-white text-sm">{data.label}</span>
            {data.is_current && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FF5E14] text-white font-semibold">
                ACTIVE
              </span>
            )}
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Risk Penalty (λ):</span>
            <span className="font-mono text-sky-400 font-semibold">{data.lambda_val}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400">
            <span>Expected Profit:</span>
            <span className="font-mono font-semibold">${data.expected_profit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-amber-400">
            <span>Risk Exposure:</span>
            <span className="font-mono font-semibold">${data.risk_score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800">
            <span>Budget Utilized:</span>
            <span className="font-mono font-semibold">${data.budget_used.toLocaleString()}</span>
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
            <Activity className="w-4 h-4 text-sky-400" />
            Risk vs. Expected Profit Efficient Frontier
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Markowitz-style pareto optimal frontier across risk penalty λ
          </p>
        </div>

        {currentPoint && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E14] animate-ping" />
            <span className="text-[#FF5E14] font-semibold">Active: {currentPoint.label}</span>
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-0">
        {frontier.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Calculating Efficient Frontier...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={frontier}
              margin={{ top: 15, right: 25, left: -5, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="risk_score"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                name="Risk Exposure ($)"
              />
              <YAxis
                dataKey="expected_profit"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                name="Expected Profit ($)"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="expected_profit"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#0284c7", strokeWidth: 2, stroke: "#38bdf8" }}
                activeDot={{ r: 6, fill: "#FF5E14", stroke: "#ffffff" }}
              />

              {/* Highlight active portfolio point */}
              {currentPoint && (
                <ReferenceDot
                  x={currentPoint.risk_score}
                  y={currentPoint.expected_profit}
                  r={8}
                  fill="#FF5E14"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
