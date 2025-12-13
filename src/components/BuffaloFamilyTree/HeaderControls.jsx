import React from 'react';
import { Play, RotateCcw } from "lucide-react";
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
  resetSimulation
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
    <div className="bg-white/90 backdrop-blur-sm shadow-lg p-6 xl:p-4 border-b border-gray-200 flex-shrink-0">
      <div className="max-w-8xl mx-auto">
        {/* Header with centered title */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-4">
          <h1 className="text-3xl font-bold text-gray-800 text-center md:text-left mb-4 md:mb-0 md:text-2xl lg:text-3xl">
            Buffalo Family Tree Simulator
          </h1>

          {treeData && (
            <div className="flex items-center gap-3">
              <button
                onClick={resetSimulation}
                className="flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium text-base"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Controls grid */}
        <div className="flex md:grid-cols-2 lg:grid-cols-7 gap-5">
          {/* Starting Units */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Starting Units
            </label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-32 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              value={units || ''}
              onChange={(e) => handleNumberChange(e.target.value, setUnits)}
              placeholder="1-10"
            />
          </div>

          {/* Simulation Years */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Simulation Years
            </label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-32 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              value={years || ''}
              onChange={(e) => handleNumberChange(e.target.value, setYears)}
              placeholder="1-50"
            />
          </div>

          {/* Start Year */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Start Year
            </label>
            <input
              type="number"
              min="2025"
              max="2050"
              className="w-32 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              value={startYear || ''}
              onChange={(e) => handleNumberChange(e.target.value, setStartYear)}
              placeholder="2025-2100"
            />
          </div>

          {/* Start Month */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Start Month
            </label>
            <select
              className="w-40 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              value={startMonth}
              onChange={(e) => setStartMonth(Number(e.target.value))}
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Start Day */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Start Day
            </label>
            <select
              className="w-32 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              value={startDay}
              onChange={(e) => setStartDay(Number(e.target.value))}
            >
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Run Simulation Button */}
          <div className="flex items-end lg:col-span-2">
            <button
              onClick={runSimulation}
              className="w-48 md:w-48 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md text-base min-h-[48px]"
            >
              <Play size={20} />
              Run
            </button>
          </div>

          {/* New Summary Metrics Section - Only visible when treeData exists */}
          {treeData && treeData.summaryStats && (
            <div className="flex items-center gap-6 lg:col-span-full xl:col-span-3 xl:ml-8 mt-4 xl:mt-8 border-t xl:border-t-0 xl:border-l border-gray-200 pt-4 xl:pt-0 xl:pl-8">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Buffaloes</span>
                <span className="text-xl font-bold text-gray-800">{treeData.summaryStats.totalBuffaloes}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cumulative Net</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(treeData.summaryStats.totalNetRevenue)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Asset Value</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(treeData.summaryStats.totalAssetValue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderControls;