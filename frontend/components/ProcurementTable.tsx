"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Download,
  Building2,
  Plane,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { AllocationItem } from "../types";

interface ProcurementTableProps {
  allocations: AllocationItem[];
  onSelectItem: (item: AllocationItem) => void;
}

type SortField =
  | "expected_profit"
  | "recommended_quantity"
  | "dynamic_selling_price"
  | "procurement_cost_per_unit"
  | "profit_margin_pct"
  | "destination"
  | "unconstrained_demand";

export const ProcurementTable: React.FC<ProcurementTableProps> = ({
  allocations,
  onSelectItem,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [strategyFilter, setStrategyFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("expected_profit");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return allocations.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.event_name.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (strategyFilter === "prebuy") {
        return item.strategy.includes("Pre-Buy");
      }
      if (strategyFilter === "soft") {
        return item.strategy.includes("Supplier Integration");
      }
      if (strategyFilter === "procured_only") {
        return item.recommended_quantity > 0;
      }
      return true;
    });
  }, [allocations, searchTerm, strategyFilter]);

  // Sort Logic
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "string") {
        return sortAsc
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [filteredItems, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedItems.length / pageSize) || 1;
  const paginatedItems = sortedItems.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Item Name",
      "Destination",
      "Type",
      "Travel Period",
      "Strategy",
      "Recommended Qty",
      "Max Units",
      "Procurement Cost ($)",
      "Dynamic Selling Price ($)",
      "Surge %",
      "Expected Profit ($)",
      "Margin %",
      "Unconstrained Demand",
      "Historical Bookings",
      "Sold Out Past",
      "Look to Book Ratio",
      "Volatility",
      "Cancellation Rate",
      "Purchase Window",
      "AI Reasoning",
    ];

    const rows = sortedItems.map((item) => [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`,
      item.destination,
      item.type,
      item.travel_period,
      `"${item.strategy}"`,
      item.recommended_quantity,
      item.max_available_units,
      item.procurement_cost_per_unit,
      item.dynamic_selling_price,
      item.price_surge_pct,
      item.expected_profit,
      item.profit_margin_pct,
      item.unconstrained_demand,
      item.historical_bookings,
      item.was_sold_out ? "YES" : "NO",
      item.look_to_book_ratio,
      item.demand_volatility,
      item.cancellation_rate,
      `"${item.purchase_window}"`,
      `"${item.reasoning.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Travel-Folio_Procurement_Plan_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Top Header & Actions */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Actionable Procurement Schedule & AI Reasoning
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredItems.length} items
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Prescriptive allocations with optimal timing windows and dynamic surge pricing
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search destination, hotel, event..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF5E14] w-56 transition-colors"
            />
          </div>

          {/* Strategy Filter Tabs */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => {
                setStrategyFilter("all");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                strategyFilter === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStrategyFilter("procured_only");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                strategyFilter === "procured_only" ? "bg-[#FF5E14] text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Procured Only
            </button>
            <button
              onClick={() => {
                setStrategyFilter("prebuy");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                strategyFilter === "prebuy" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Pre-Buy
            </button>
            <button
              onClick={() => {
                setStrategyFilter("soft");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                strategyFilter === "soft" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Supplier Int.
            </button>
          </div>

          {/* CSV Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition-colors shadow-sm"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">
                <button
                  onClick={() => handleSort("destination")}
                  className="flex items-center gap-1 hover:text-white"
                >
                  Destination & Item
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4">Strategy & Window</th>
              <th className="py-3 px-4 text-center">
                <button
                  onClick={() => handleSort("recommended_quantity")}
                  className="flex items-center gap-1 mx-auto hover:text-white"
                >
                  Rec. Qty / Max
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">
                <button
                  onClick={() => handleSort("procurement_cost_per_unit")}
                  className="flex items-center gap-1 ml-auto hover:text-white"
                >
                  Cost vs Dyn. Price
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">
                <button
                  onClick={() => handleSort("expected_profit")}
                  className="flex items-center gap-1 ml-auto hover:text-white"
                >
                  Exp. Profit (Margin)
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4">AI Reasoning & Signals</th>
              <th className="py-3 px-3 text-center">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No inventory matches found. Try adjusting the search or filter.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const isPreBuy = item.strategy.includes("Pre-Buy");
                const isSoft = item.strategy.includes("Supplier Integration");
                const isProcured = item.recommended_quantity > 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isProcured ? "bg-slate-900/30" : "opacity-60"
                    }`}
                  >
                    {/* Destination & Item Name */}
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            item.type === "Hotel Block"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          }`}
                        >
                          {item.type === "Hotel Block" ? (
                            <Building2 className="w-3.5 h-3.5" />
                          ) : (
                            <Plane className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white truncate max-w-[220px]" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="font-medium text-slate-300">{item.destination}</span>
                            <span>•</span>
                            <span className="text-slate-400">{item.travel_period}</span>
                            {item.event_name !== "Standard Travel Period" && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 truncate max-w-[140px]">
                                {item.event_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Strategy & Optimal Window */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {isPreBuy && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            Pre-Buy (Hard)
                          </span>
                        )}
                        {isSoft && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            Supplier Int. (Soft)
                          </span>
                        )}
                        {!isProcured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Pass / Monitor
                          </span>
                        )}
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[170px]" title={item.purchase_window}>
                            {item.purchase_window}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Rec. Qty / Max Units */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-block">
                        <div className="font-mono text-sm font-bold text-white">
                          {item.recommended_quantity}{" "}
                          <span className="text-slate-500 font-normal text-xs">/ {item.max_available_units}</span>
                        </div>
                        {item.max_available_units > 0 && (
                          <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 mx-auto">
                            <div
                              className={`h-full ${
                                isPreBuy ? "bg-emerald-500" : isSoft ? "bg-amber-500" : "bg-slate-600"
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (item.recommended_quantity / item.max_available_units) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cost vs Dyn Price */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono">
                        <div className="font-bold text-sky-400">
                          ${item.dynamic_selling_price}
                          <span className="text-[10px] text-sky-400/80 ml-1 font-normal">
                            {item.price_surge_pct >= 0 ? `+${item.price_surge_pct}%` : `${item.price_surge_pct}%`}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Cost: ${item.procurement_cost_per_unit}
                        </div>
                      </div>
                    </td>

                    {/* Exp Profit & Margin */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono">
                        <div className="font-bold text-emerald-400 text-sm">
                          ${item.expected_profit.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.profit_margin_pct.toFixed(1)}% margin
                        </div>
                      </div>
                    </td>

                    {/* AI Reasoning */}
                    <td className="py-3.5 px-4 max-w-[320px]">
                      <p className="text-xs text-slate-300 leading-snug line-clamp-2" title={item.reasoning}>
                        {item.reasoning}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <span>True Demand: <strong className="text-slate-300 font-mono">{item.unconstrained_demand}</strong></span>
                        <span>•</span>
                        <span>Vol: <strong className="text-slate-300 font-mono">{(item.demand_volatility * 100).toFixed(0)}%</strong></span>
                        <span>•</span>
                        <span>Cancel: <strong className="text-slate-300 font-mono">{(item.cancellation_rate * 100).toFixed(0)}%</strong></span>
                      </div>
                    </td>

                    {/* Details Action */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onSelectItem(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="View signals breakdown"
                      >
                        <Info className="w-4 h-4 text-sky-400" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing {(page - 1) * pageSize + 1} to{" "}
          {Math.min(page * pageSize, sortedItems.length)} of {sortedItems.length} entries
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            Previous
          </button>
          <span className="px-2 font-mono text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
