import React from 'react';
import { Play, RotateCcw, ZoomIn, ZoomOut, Calculator } from "lucide-react";

const HeaderControls = ({
  units,
  setUnits,
  years,
  setYears,
  startYear,
  setStartYear,
  runSimulation,
  treeData,
  resetSimulation,
  setShowCostEstimation,
  handleZoomIn,
  handleZoomOut,
  handleResetView,
  zoom
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm shadow-lg p-6 border-b border-gray-200 flex-shrink-0">
      <div className="max-w-8xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-4">
            <span className="text-4xl">🐃</span>
            Buffalo Family Tree Simulator
          </h1>
          {treeData && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCostEstimation(true)}
                className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-xl text-lg"
              >
                <Calculator size={20} />
                Price Estimation
              </button>
              <button
                onClick={resetSimulation}
                className="flex items-center gap-3 px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-lg font-semibold"
              >
                <RotateCcw size={20} />
                Reset
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div>
            <label className="text-base font-semibold text-gray-700 mb-3 block">
              Starting Units
            </label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg h-14"
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-base font-semibold text-gray-700 mb-3 block">
              Simulation Years
            </label>
            <input
              type="number"
              min="1"
              max="50"
              className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg h-14"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-base font-semibold text-gray-700 mb-3 block">
              Start Year
            </label>
            <input
              type="number"
              min="2024"
              max="2100"
              className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg h-14"
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={runSimulation}
              className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-xl text-lg h-14"
            >
              <Play size={24} />
              Run Simulation
            </button>
          </div>
          {treeData && (
            <div className="flex items-end gap-4">
              <button
                onClick={handleZoomOut}
                className="px-5 py-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center"
                title="Zoom Out"
              >
                <ZoomOut size={24} />
              </button>
              <button
                onClick={handleResetView}
                className="px-5 py-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-base font-semibold min-w-[80px] h-14 flex items-center justify-center"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="px-5 py-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center"
                title="Zoom In"
              >
                <ZoomIn size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderControls;