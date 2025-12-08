import React from 'react';

const AnnualHerdRevenue = ({
  cumulativeYearlyData,
  assetMarketValue,
  cpfToggle,
  setCpfToggle,
  formatCurrency,
  formatNumber,
  treeData,
  startYear,
  endYear,
  yearRange
}) => {
  // Asset value calculation removed as per request

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-16">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-10 text-white">
        <div className="h-10"></div>
        <h2 className="text-4xl font-bold mb-4 flex items-center gap-4">
          <span className="text-5xl">💰</span>
          Annual Herd Revenue Breakdown ({yearRange})
        </h2>
        <p className="text-blue-100 text-xl">Detailed year-by-year financial analysis based on actual herd growth with staggered cycles</p>

        {/* CPF Toggle */}
        <div className="mt-6 flex justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="text-lg font-semibold mb-2 text-center">Select CPF Mode:</div>
            <div className="flex gap-4">
              <button
                onClick={() => setCpfToggle("withCPF")}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${cpfToggle === "withCPF" ? 'bg-green-500 text-white' : 'bg-white/30 text-white hover:bg-white/40'}`}
              >
                With CPF
              </button>
              <button
                onClick={() => setCpfToggle("withoutCPF")}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${cpfToggle === "withoutCPF" ? 'bg-blue-500 text-white' : 'bg-white/30 text-white hover:bg-white/40'}`}
              >
                Without CPF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto p-2">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
              <th className="px-10 py-8 text-left text-lg font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <div className="text-xl">Year</div>
                <div className="text-base font-normal text-gray-500">Timeline</div>
              </th>
              <th className="px-10 py-8 text-left text-lg font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <div className="text-xl">Total</div>
                <div className="text-base font-normal text-gray-500">Buffaloes</div>
              </th>
              <th className="px-10 py-8 text-left text-lg font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <div className="text-xl">Annual Revenue</div>
                <div className="text-base font-normal text-gray-500">
                  {cpfToggle === "withCPF" ? "With CPF Deduction" : "Without CPF Deduction"}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cumulativeYearlyData.map((data, index) => {
              const annualRevenue = cpfToggle === "withCPF" ? data.revenueWithCPF : data.revenueWithoutCPF;


              const growthRate = index > 0
                ? ((annualRevenue - cumulativeYearlyData[index - 1][cpfToggle === "withCPF" ? "revenueWithCPF" : "revenueWithoutCPF"]) /
                  cumulativeYearlyData[index - 1][cpfToggle === "withCPF" ? "revenueWithCPF" : "revenueWithoutCPF"] * 100).toFixed(1)
                : 0;

              return (
                <tr key={data.year} className="hover:bg-blue-50 transition-all duration-200 group">
                  <td className="px-10 py-8 whitespace-nowrap">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{data.year}</div>
                        <div className="text-base text-gray-500">Year {index + 1}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 whitespace-nowrap">
                    <div className="text-3xl font-bold text-purple-600">
                      {formatNumber(data.totalBuffaloes)}
                    </div>
                    <div className="text-base text-gray-500 mt-2">total buffaloes</div>
                  </td>
                  <td className="px-10 py-8 whitespace-nowrap">
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(annualRevenue)}
                    </div>
                    {cpfToggle === "withCPF" && (
                      <div className="text-base text-orange-600 font-semibold mt-2">
                        CPF Cost: -{formatCurrency(data.cpfCost)}
                      </div>
                    )}
                    {growthRate > 0 && (
                      <div className="text-base text-green-500 font-semibold mt-2 flex items-center gap-2">
                        <span className="text-xl">↑</span>
                        {growthRate}% growth
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <div className="h-5"></div>
          <tfoot>
            <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <td className="px-10 py-8">
                <div className="text-2xl font-bold">Grand Total</div>
                <div className="text-base opacity-80">{treeData.years} Years ({yearRange})</div>
              </td>
              <td className="px-10 py-8">
                <div className="text-2xl font-bold">
                  {formatNumber(cumulativeYearlyData[cumulativeYearlyData.length - 1]?.totalBuffaloes || 0)}
                </div>
                <div className="text-base opacity-80">final herd size</div>
              </td>
              <td className="px-10 py-8">
                <div className="text-2xl font-bold">
                  {formatCurrency(cpfToggle === "withCPF"
                    ? cumulativeYearlyData.reduce((sum, data) => sum + data.revenueWithCPF, 0)
                    : cumulativeYearlyData.reduce((sum, data) => sum + data.revenueWithoutCPF, 0)
                  )}
                </div>
                <div className="text-base opacity-80">total {cpfToggle === "withCPF" ? "net" : "gross"} revenue</div>
              </td>
            </tr>
            <div className="h-10"></div>
          </tfoot>
        </table>
      </div>

      {/* Explanation Section */}
      <div className="p-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-blue-200">
            <div className="text-lg font-bold text-blue-700 mb-2">Annual Revenue</div>
            <div className="text-sm text-gray-600">
              {cpfToggle === "withCPF"
                ? "Net revenue from milk sales after deducting CPF costs (₹13,000 per buffalo aged 3+ years)"
                : "Gross revenue from milk sales before CPF deductions"
              }
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-indigo-200">
            <div className="text-sm text-gray-600">
              Total Annual Revenue represents the cash flow generated from milk sales in that specific year.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualHerdRevenue;