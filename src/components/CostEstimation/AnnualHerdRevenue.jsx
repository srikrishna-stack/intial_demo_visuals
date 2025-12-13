import React from 'react';

const AnnualHerdRevenue = ({
  cumulativeYearlyData,
  assetMarketValue,
  formatCurrency,
  formatNumber,
  treeData,
  startYear,
  endYear,
  yearRange
}) => {
  // Since cpfToggle is now always "withCPF", we can remove the toggle state
  const cpfToggle = "withCPF";

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-16 mx-20">

      {/* Header Section */}
      <div className="mt-6 flex justify-center">
        <div className="p-4 max-w-lg w-full ">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              Annual Herd Revenue Analysis(with CPF)
            </h2>
           
          </div>
        </div>
      </div>

      <div className="overflow-x-auto p-3">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <th className="pl-17 py-5 text-center font-semibold text-slate-700 uppercase tracking-wider">
                <div className="text-lg font-semibold">Year</div>
                <div className="text-sm font-normal text-slate-500 mt-1">Timeline</div>
              </th>
              <th className="px-6 py-5 text-center font-semibold text-slate-700 uppercase tracking-wider">
                <div className="text-lg font-semibold">Total</div>
                <div className="text-sm font-normal text-slate-500 mt-1">Buffaloes</div>
              </th>
              <th className="px-6 py-5 text-center font-semibold text-slate-700 uppercase tracking-wider">
                <div className="text-lg font-semibold">Annual Revenue</div>
                <div className="text-sm font-normal text-slate-500 mt-1">
                  With CPF Deduction
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cumulativeYearlyData.map((data, index) => {
              const annualRevenue = data.revenueWithCPF;
              const growthRate = index > 0
                ? ((annualRevenue - cumulativeYearlyData[index - 1].revenueWithCPF) /
                  cumulativeYearlyData[index - 1].revenueWithCPF * 100).toFixed(1)
                : 0;

              return (
                <tr key={data.year} className="hover:bg-slate-50 transition-colors duration-150 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4 flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="text-left">
                        <div className="text-base font-semibold text-slate-900">{data.year}</div>
                        <div className="text-xs text-slate-500">Year {index + 1}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-lg font-bold text-indigo-700">
                      {formatNumber(data.totalBuffaloes)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">total buffaloes</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-lg font-bold text-emerald-700">
                      {formatCurrency(annualRevenue)}
                    </div>
                    <div className="text-xs font-medium text-amber-600 mt-0.5">
                      CPF: -{formatCurrency(data.cpfCost)}
                    </div>
                    {growthRate > 0 && (
                      <div className="text-xs font-medium text-emerald-600 mt-0.5 flex items-center justify-center gap-1">
                        <span className="text-sm">↑</span>
                        {growthRate}% growth
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
              <td className="px-6 py-5 text-center">
                <div className="text-lg font-semibold">Grand Total</div>
                <div className="text-sm opacity-90 mt-1">{treeData.years} Years ({yearRange})</div>
              </td>
              <td className="px-6 py-5 text-center">
                <div className="text-lg font-semibold">
                  {formatNumber(cumulativeYearlyData[cumulativeYearlyData.length - 1]?.totalBuffaloes || 0)}
                </div>
                <div className="text-sm opacity-90 mt-1">final herd size</div>
              </td>
              <td className="px-6 py-5 text-center">
                <div className="text-lg font-semibold">
                  {formatCurrency(cumulativeYearlyData.reduce((sum, data) => sum + data.revenueWithCPF, 0))}
                </div>
                <div className="text-sm opacity-90 mt-1">total net revenue</div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AnnualHerdRevenue;