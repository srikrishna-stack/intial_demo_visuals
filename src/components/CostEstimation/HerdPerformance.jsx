
import React from 'react';
import NonProducingBuffaloGraph from '../BuffaloFamilyTree/GraphComponents/NonProducingBuffaloGraph';

import { TrendingUp, BarChart3 } from 'lucide-react';

const HerdPerformance = ({ yearlyData, activeGraph, setActiveGraph }) => {
  // Transform yearlyData for reference, though we use yearlyData directly
  const chartData = yearlyData || [];

  return (
    <div className="mx-4 lg:mx-10">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 shadow-xl border border-gray-200">
        {/* Enhanced Toggle Navigation */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-1.5 rounded-xl shadow-inner border border-gray-200">
            {/* Background Slider */}
            <div
              className={`absolute top-1.5 bottom-1.5 rounded-lg transition-all duration-300 ease-out shadow-sm
                ${activeGraph === "buffaloes"
                  ? 'left-1.5 w-[calc(50%-0.75rem)] bg-gradient-to-r from-indigo-500 to-purple-600'
                  : 'left-[calc(50%+0.25rem)] w-[calc(50%-0.75rem)] bg-gradient-to-r from-amber-500 to-orange-600'
                }`}
            />

            {/* Toggle Buttons */}
            <div className="relative flex gap-1">
              <button
                onClick={() => setActiveGraph("buffaloes")}
                className={`
                  relative flex flex-col items-center justify-center px-6 py-3 rounded-lg 
                  transition-all duration-200 transform hover:scale-[1.02] min-w-[140px]
                  ${activeGraph === "buffaloes"
                    ? 'text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                  }
                `}
              >
                <span className={`font-semibold transition-all duration-200 ${activeGraph === "buffaloes" ? 'scale-105 text-base' : 'scale-100 text-sm'}`}>
                  Herd Growth
                </span>
              </button>

              <button
                onClick={() => setActiveGraph("nonproducing")}
                className={`
                  relative flex flex-col items-center justify-center px-6 py-3 rounded-lg 
                  transition-all duration-200 transform hover:scale-[1.02] min-w-[140px]
                  ${activeGraph === "nonproducing"
                    ? 'text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                  }
                `}
              >
                <span className={`font-semibold transition-all duration-200 ${activeGraph === "nonproducing" ? 'scale-105 text-base' : 'scale-100 text-sm'}`}>
                  Production
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div className="min-h-[450px] flex items-center justify-center">
          {activeGraph === "buffaloes" && (
            <div className="w-full overflow-x-auto pb-8 pt-4 custom-scrollbar">
              <div className="flex items-start justify-start px-8 min-w-max mx-auto">
                {chartData.map((yearData, index) => {
                  const isLast = index === chartData.length - 1;
                  const colors = [
                    { border: 'border-pink-500', text: 'text-pink-600', ring: 'ring-pink-100', bg: 'bg-white' },
                    { border: 'border-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-100', bg: 'bg-white' },
                    { border: 'border-teal-500', text: 'text-teal-600', ring: 'ring-teal-100', bg: 'bg-white' },
                    { border: 'border-blue-500', text: 'text-blue-600', ring: 'ring-blue-100', bg: 'bg-white' },
                    { border: 'border-purple-500', text: 'text-purple-600', ring: 'ring-purple-100', bg: 'bg-white' },
                  ];
                  const color = colors[index % colors.length];

                  return (
                    <div key={yearData.year} className="flex flex-col items-center min-w-[140px] relative group">
                      {/* Top: Circle and Arrow Line */}
                      <div className="flex items-center w-full justify-center relative h-16">
                        {/* Connector Line (Behind) */}
                        <div className={`absolute top-1/2 left-1/2 w-full h-[3px] bg-gray-200 -z-0 ${isLast ? 'hidden' : ''}`}>
                          {/* Arrow Head at the end of the segment */}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-300">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        </div>

                        {/* Circle */}
                        <div className={`w-14 h-14 rounded-full border-4 ${color.border} ${color.bg} flex items-center justify-center z-10 shadow-md group-hover:scale-110 transition-transform duration-300 ${color.ring} ring-4 ring-offset-2 ring-offset-white`}>
                          <span className="font-bold text-gray-700 text-sm">{yearData.year}</span>
                        </div>
                      </div>

                      {/* Vertical Connector */}
                      <div className="h-8 w-[2px] bg-gray-300 my-1 border-l-2 border-dashed border-gray-300 opacity-50"></div>

                      {/* Detail Box */}
                      <div className={`
                         p-4 rounded-2xl w-36 text-center shadow-sm hover:shadow-lg transition-all duration-300 border bg-white
                         ${color.border} relative top-0 group-hover:-top-2
                       `}>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Herd</div>
                        <div className={`text-3xl font-bold ${color.text} mb-3`}>{yearData.totalBuffaloes}</div>

                        <div className="border-t border-gray-100 pt-3 space-y-2">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-1">
                              <BarChart3 size={14} />
                            </div>
                            <span className="text-xs text-gray-500">Producing</span>
                            <span className="font-bold text-gray-700">{yearData.producingBuffaloes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeGraph === "nonproducing" && (
            <div className="w-full">
              <NonProducingBuffaloGraph yearlyData={yearlyData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HerdPerformance;