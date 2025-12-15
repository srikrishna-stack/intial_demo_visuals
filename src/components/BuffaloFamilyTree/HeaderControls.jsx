import React from 'react';
import { Play, RotateCcw, Calendar, Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatCurrency } from './CommonComponents';


const HeaderControls = ({
  units,
  setUnits,
  years,
  setYears,
  startYear,
  setStartYear,
  startMonth,
  setStartMonth,
  startDay,
  setStartDay,
  daysInMonth,
  runSimulation,
  treeData,
  resetSimulation,
  loading
}) => {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Generate days array based on days in month
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Handle number input changes to prevent showing 0 when empty
  const handleNumberChange = (value, setter) => {
    if (value === '' || isNaN(value)) {
      setter('');
    } else {
      const num = parseInt(value, 10);
      setter(num);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm shadow-lg p-2 border-b border-gray-200 flex-shrink-0 relative z-50">
      <div className="max-w-8xl mx-auto">
        {/* Controls grid */}
        <div className="flex flex-wrap items-end gap-2 lg:gap-4 justify-center lg:justify-start">
          {/* Starting Units */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Units
            </label>
            <input
              type="number"
              min="1"
              max="1"
              disabled
              className="w-24 border border-gray-300 p-1.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-100 cursor-not-allowed text-gray-500"
              value={units || 1}
              onChange={(e) => handleNumberChange(e.target.value, setUnits)}
              placeholder="1"
            />
          </div>

          {/* Start Date Picker */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1">
              Start Date
            </label>
            <div className="relative">
              <DatePicker
                selected={new Date(startYear, startMonth, startDay)}
                onChange={(date) => {
                  if (date) {
                    setStartYear(date.getFullYear());
                    setStartMonth(date.getMonth());
                    setStartDay(date.getDate());
                  }
                }}
                minDate={new Date(2026, 0, 1)}
                showYearPicker
                dateFormat="yyyy"
                className="w-40 border border-gray-300 p-2 pl-9 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer shadow-sm"
                placeholderText="Select date"
                onKeyDown={(e) => e.preventDefault()}
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Simulation Years */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Simulation Years
            </label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-24 border border-gray-300 p-1.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={years || ''}
              onChange={(e) => handleNumberChange(e.target.value, setYears)}
              placeholder="1-50"
            />
          </div>

          {/* Run Simulation Button */}
          <div className="flex pb-0.5">
            <button
              onClick={runSimulation}
              disabled={loading}
              className={`w-32 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-1.5 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md text-sm min-h-[34px] ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Submit"}
            </button>
          </div>

          {/* New Summary Metrics Section - Only visible when treeData exists */}
          {treeData && treeData.summaryStats && (
            <div className="flex items-center gap-4 ml-auto border-l border-gray-200 pl-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Total Buffaloes</span>
                <span className="text-sm font-bold text-gray-800">{treeData.summaryStats.totalBuffaloes}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Cumulative Net</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(treeData.summaryStats.totalNetRevenue)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Total Asset Value</span>
                <span className="text-sm font-bold text-blue-600">{formatCurrency(treeData.summaryStats.totalAssetValue)}</span>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderControls;