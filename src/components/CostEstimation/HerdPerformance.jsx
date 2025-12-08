
import React from 'react';
import NonProducingBuffaloGraph from '../BuffaloFamilyTree/GraphComponents/NonProducingBuffaloGraph';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

const HerdPerformance = ({ yearlyData, activeGraph, setActiveGraph }) => {
  // Transform yearlyData for normal chart format
  const chartData = yearlyData?.map(year => ({
    year: year.year,
    totalBuffaloes: year.totalBuffaloes,
    producingBuffaloes: year.producingBuffaloes,
    nonProducingBuffaloes: year.nonProducingBuffaloes
  })) || [];

  // Custom tooltip for line chart
  const LineChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = chartData.find(d => d.year === label);
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 mb-2">Year: {label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-bold text-gray-800">{entry.value}</span>
            </div>
          ))}
          {data && (
            <>
              <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                <p className="text-sm text-gray-600">
                  Producing: {data.producingBuffaloes} buffaloes
                </p>
                <p className="text-sm text-gray-600">
                  Non-Producing: {data.nonProducingBuffaloes} buffaloes
                </p>
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mx-20">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 shadow-2xl border border-gray-200">
        {/* Enhanced Toggle Navigation */}
        <div className="flex flex-col items-center mb-6">
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
                {activeGraph === "buffaloes" && (
                  <div className="absolute -bottom-1 w-10 h-1 bg-white rounded-full shadow-md" />
                )}
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
                {activeGraph === "nonproducing" && (
                  <div className="absolute -bottom-1 w-10 h-1 bg-white rounded-full shadow-md" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div className="mx-30 my-1">
          {activeGraph === "buffaloes" && (
            <div className="w-full h-[400px] p-4">
              <ResponsiveContainer width="100%" height="90%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    stroke="#4b5563"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis
                    stroke="#4b5563"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip content={<LineChartTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalBuffaloes"
                    name="Total Buffaloes"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
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