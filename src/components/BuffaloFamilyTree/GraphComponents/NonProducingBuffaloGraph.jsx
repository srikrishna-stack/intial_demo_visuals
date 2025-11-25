import React from 'react';
import { PieChart } from "lucide-react";
import { formatNumber } from '../CommonComponents';

const NonProducingBuffaloGraph = ({ yearlyData }) => {
  if (!yearlyData) return null;
  
  return (
    <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 w-full">
      <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center justify-center gap-4">
        <PieChart className="text-orange-500" size={32} />
        Non-Producing Buffalo Analysis
      </h3>
      <div className="space-y-6">
        {yearlyData.map((data, index) => {
          const totalBuffaloes = data.totalBuffaloes;
          const producingPercentage = (data.producingBuffaloes / totalBuffaloes) * 100;
          const nonProducingPercentage = (data.nonProducingBuffaloes / totalBuffaloes) * 100;
          
          return (
            <div key={data.year} className="p-6 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-bold text-gray-700">{data.year}</div>
                <div className="text-lg text-gray-500">
                  Total: {formatNumber(totalBuffaloes)} buffaloes
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-lg mb-2">
                    <span className="text-green-600 font-semibold">Producing: {formatNumber(data.producingBuffaloes)}</span>
                    <span className="text-green-600 font-bold">{producingPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-6 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${producingPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-lg mb-2">
                    <span className="text-orange-600 font-semibold">Non-Producing: {formatNumber(data.nonProducingBuffaloes)}</span>
                    <span className="text-orange-600 font-bold">{nonProducingPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-6 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${nonProducingPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NonProducingBuffaloGraph;