import React from 'react';

const BreakEvenTimeline = ({
  treeData,
  breakEvenAnalysis,
  cpfToggle,
  setCpfToggle,
  monthNames,
  formatCurrency,
  yearRange
}) => {
  // Calculate months to break-even
  const calculateMonthsToBreakEven = (breakEvenDate) => {
    if (!breakEvenDate) return null;

    const startDate = new Date(treeData.startYear, treeData.startMonth, treeData.startDay || 1);
    const yearsDiff = breakEvenDate.getFullYear() - startDate.getFullYear();
    const monthsDiff = breakEvenDate.getMonth() - startDate.getMonth();

    return yearsDiff * 12 + monthsDiff;
  };

  const monthsToBreakEvenWithoutCPF = calculateMonthsToBreakEven(breakEvenAnalysis.exactBreakEvenDateWithoutCPF);
  const monthsToBreakEvenWithCPF = calculateMonthsToBreakEven(breakEvenAnalysis.exactBreakEvenDateWithCPF);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-10 shadow-2xl border border-green-200 mb-16">
      <h2 className="text-4xl font-bold text-green-800 mb-10 text-center flex items-center justify-center gap-4">
        <span className="text-5xl">🎯</span>
        Break-Even Timeline Analysis
      </h2>

      {/* CPF Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-2xl p-4 border border-purple-300">
          <div className="text-lg font-semibold text-purple-700 mb-2 text-center">Select CPF Mode:</div>
          <div className="flex gap-4">
            <button
              onClick={() => setCpfToggle("withCPF")}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${cpfToggle === "withCPF" ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              With CPF
            </button>
            <button
              onClick={() => setCpfToggle("withoutCPF")}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${cpfToggle === "withoutCPF" ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Without CPF
            </button>
          </div>
        </div>
      </div>

      {/* Initial Investment Summary */}
      <div className="bg-white rounded-2xl p-8 border border-green-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-2">Start Date</div>
            <div className="text-3xl font-bold text-green-600">
              {monthNames[treeData.startMonth]} {treeData.startDay || 1}, {treeData.startYear}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-2">Initial Investment</div>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(breakEvenAnalysis.initialInvestment)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-2">Units</div>
            <div className="text-3xl font-bold text-blue-600">{treeData.units}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 font-semibold mb-1">Projection Period</div>
            <div className="text-3xl font-bold text-purple-600">{yearRange}</div>
          </div>
        </div>
      </div>

      {/* CPF Offer Explanation */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-6 text-white text-center shadow-2xl mb-8">
        <div className="text-xl font-bold mb-2">💰 Special CPF Offer</div>
        <div className="text-lg opacity-90">
          Each unit (2 mother buffaloes) comes with ONE CPF coverage (₹13,000) that covers both buffaloes
        </div>
        <div className="text-sm opacity-80 mt-2">
          Regular: ₹26,000 (2 × ₹13,000) | Our offer: ₹13,000 (Save 50%!)
        </div>
      </div>

      {/* Break-Even Achievement - Show Based on Toggle */}
      {cpfToggle === "withCPF" ? (
        // With CPF Break-Even
        breakEvenAnalysis.exactBreakEvenDateWithCPF && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-10 text-white text-center shadow-2xl mb-8">
            <div className="text-5xl mb-6">🎉</div>
            <div className="text-4xl font-bold mb-4">Your Investment is Now Risk-Free!</div>
            <div className="text-2xl font-semibold mb-6">
              Break-Even WITH CPF Achieved on {breakEvenAnalysis.exactBreakEvenDateWithCPF.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm mb-6">
              <div className="text-3xl font-bold mb-2">
                In Just {monthsToBreakEvenWithCPF} Months
              </div>
              <div className="text-xl opacity-90">
                ({Math.floor(monthsToBreakEvenWithCPF / 12)} years and {monthsToBreakEvenWithCPF % 12} months)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-lg font-semibold mb-2">Investment Cycle</div>
                <div className="text-2xl font-bold">
                  Year {breakEvenAnalysis.exactBreakEvenDateWithCPF.getFullYear() - treeData.startYear + 1}
                </div>
                <div className="text-sm opacity-90">Month {breakEvenAnalysis.breakEvenMonthWithCPF + 1}</div>
              </div>

              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-lg font-semibold mb-2">Net Cumulative Revenue</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
                </div>
                <div className="text-sm opacity-90">Total net milk sales to date</div>
              </div>

              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-lg font-semibold mb-2">Initial Investment</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(breakEvenAnalysis.initialInvestment)}
                </div>
                <div className="text-sm opacity-90">Fully recovered!</div>
              </div>
            </div>

            <div className="text-lg opacity-90 bg-black/20 rounded-xl p-4">
              🎯 <span className="font-semibold">What this means:</span> From this date forward, all future revenue is pure profit.
              Your initial investment of {formatCurrency(breakEvenAnalysis.initialInvestment)} has been completely recovered
              through milk sales after CPF deductions. The buffalo herd you own now represents 100% net asset value.
            </div>
          </div>
        )
      ) : (
        // Without CPF Break-Even
        breakEvenAnalysis.exactBreakEvenDateWithoutCPF && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-10 text-white text-center shadow-2xl mb-8">
            <div className="text-5xl mb-6">📊</div>
            <div className="text-4xl font-bold mb-4">Break-Even WITHOUT CPF</div>
            <div className="text-2xl font-semibold mb-6">
              Achieved on {breakEvenAnalysis.exactBreakEvenDateWithoutCPF.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm mb-6">
              <div className="text-3xl font-bold mb-2">
                In Just {monthsToBreakEvenWithoutCPF} Months
              </div>
              <div className="text-xl opacity-90">
                ({Math.floor(monthsToBreakEvenWithoutCPF / 12)} years and {monthsToBreakEvenWithoutCPF % 12} months)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-lg font-semibold mb-2">Investment Cycle</div>
                <div className="text-2xl font-bold">
                  Year {breakEvenAnalysis.exactBreakEvenDateWithoutCPF.getFullYear() - treeData.startYear + 1}
                </div>
                <div className="text-sm opacity-90">Month {breakEvenAnalysis.breakEvenMonthWithoutCPF + 1}</div>
              </div>

              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-lg font-semibold mb-2">Gross Cumulative Revenue</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithoutCPF)}
                </div>
                <div className="text-sm opacity-90">Total milk sales before CPF</div>
              </div>

              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-lg font-semibold mb-2">Initial Investment</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(breakEvenAnalysis.initialInvestment)}
                </div>
                <div className="text-sm opacity-90">Fully recovered!</div>
              </div>
            </div>

            <div className="text-lg opacity-90 bg-black/20 rounded-xl p-4">
              🎯 <span className="font-semibold">What this means:</span> From this date forward, all future revenue exceeds your initial investment.
              Your initial investment of {formatCurrency(breakEvenAnalysis.initialInvestment)} has been completely recovered
              through milk sales alone (before CPF deductions).
            </div>
          </div>
        )
      )}

      {/* Break-Even Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl p-8 border border-blue-200">
          <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center">Break-Even Timeline</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Start Date:</span>
              <span className="text-xl font-bold text-blue-600">
                {monthNames[treeData.startMonth]} {treeData.startDay || 1}, {treeData.startYear}
              </span>
            </div>
            {cpfToggle === "withCPF" ? (
              breakEvenAnalysis.exactBreakEvenDateWithCPF && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Break-Even Date (With CPF):</span>
                    <span className="text-xl font-bold text-green-600">
                      {breakEvenAnalysis.exactBreakEvenDateWithCPF.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Time to Break-Even:</span>
                    <span className="text-xl font-bold text-purple-600">
                      {monthsToBreakEvenWithCPF} months ({Math.floor(monthsToBreakEvenWithCPF / 12)} years {monthsToBreakEvenWithCPF % 12} months)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Net Cumulative Revenue at Break-Even:</span>
                    <span className="text-xl font-bold text-red-600">
                      {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
                    </span>
                  </div>
                </>
              )
            ) : (
              breakEvenAnalysis.exactBreakEvenDateWithoutCPF && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Break-Even Date (Without CPF):</span>
                    <span className="text-xl font-bold text-green-600">
                      {breakEvenAnalysis.exactBreakEvenDateWithoutCPF.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Time to Break-Even:</span>
                    <span className="text-xl font-bold text-purple-600">
                      {monthsToBreakEvenWithoutCPF} months ({Math.floor(monthsToBreakEvenWithoutCPF / 12)} years {monthsToBreakEvenWithoutCPF % 12} months)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Gross Cumulative Revenue at Break-Even:</span>
                    <span className="text-xl font-bold text-red-600">
                      {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithoutCPF)}
                    </span>
                  </div>
                </>
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-purple-200">
          <h3 className="text-2xl font-bold text-purple-700 mb-6 text-center">Investment Recovery Progress</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Initial Investment:</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(breakEvenAnalysis.initialInvestment)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-red-500 h-4 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            {cpfToggle === "withCPF" ? (
              breakEvenAnalysis.exactBreakEvenDateWithCPF && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">Recovered at Break-Even (Net):</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(breakEvenAnalysis.initialInvestment)} (100%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              )
            ) : (
              breakEvenAnalysis.exactBreakEvenDateWithoutCPF && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">Recovered at Break-Even (Gross):</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(breakEvenAnalysis.initialInvestment)} (100%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-blue-500 h-4 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              )
            )}
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Final Cumulative Revenue:</span>
                <span className="font-bold text-purple-600">
                  {formatCurrency(cpfToggle === "withCPF" ? breakEvenAnalysis.finalCumulativeRevenueWithCPF : breakEvenAnalysis.finalCumulativeRevenueWithoutCPF)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-purple-500 h-4 rounded-full"
                  style={{
                    width: `${Math.min(100, ((cpfToggle === "withCPF" ? breakEvenAnalysis.finalCumulativeRevenueWithCPF : breakEvenAnalysis.finalCumulativeRevenueWithoutCPF) / breakEvenAnalysis.initialInvestment) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Break-Even Timeline Table (Matching Screenshot) */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          Break-Even Timeline ({yearRange}) - {cpfToggle === "withCPF" ? "With CPF" : "Without CPF"}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-green-50 z-10 sticky top-0">
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b shadow-sm">Year</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b shadow-sm">
                  {cpfToggle === "withCPF" ? "Annual Revenue (Net)" : "Annual Revenue (Gross)"}
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b shadow-sm">
                  {cpfToggle === "withCPF" ? "Cumulative (Net)" : "Cumulative (Gross)"}
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b shadow-sm">
                  Asset Market Value
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b shadow-sm">
                  Total Value (Rev + Asset)
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b shadow-sm">Investment Recovery</th>
              </tr>
            </thead>
            <tbody>
              {breakEvenAnalysis.breakEvenData.map((data, index) => {
                const annualRevenue = cpfToggle === "withCPF" ? data.annualRevenueWithCPF : data.annualRevenueWithoutCPF;
                const cumulativeRevenue = cpfToggle === "withCPF" ? data.cumulativeRevenueWithCPF : data.cumulativeRevenueWithoutCPF;
                const recoveryPercentage = cpfToggle === "withCPF" ? data.recoveryPercentageWithCPF : data.recoveryPercentageWithoutCPF;
                const status = cpfToggle === "withCPF" ? data.statusWithCPF : data.statusWithoutCPF;

                // Format year display
                const yearDisplay = data.year === treeData.startYear
                  ? `${data.year}\nYear 1`
                  : `${data.year}\nYear ${index + 1}`;

                // Determine if this is the break-even year row for highlighting
                const isBreakEvenRow = cpfToggle === "withCPF" ? data.isBreakEvenWithCPF : data.isBreakEvenWithoutCPF;
                const rowClass = isBreakEvenRow
                  ? "bg-green-50 border-2 border-green-400 relative"
                  : "hover:bg-green-50 transition-colors";

                return (
                  <tr key={data.year} className={rowClass}>
                    <td className="px-6 py-4 border-b">
                      <div className="font-semibold text-gray-900 whitespace-pre-line">
                        {yearDisplay}
                        {isBreakEvenRow && (
                          <span className="block mt-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full w-fit">
                            ★ Break Even
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b font-semibold text-green-600">
                      {formatCurrency(annualRevenue)}
                      {cpfToggle === "withCPF" && (
                        <div className="text-xs text-gray-500">
                          CPF: -{formatCurrency(data.cpfCost)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 border-b font-semibold text-blue-600">
                      {formatCurrency(cumulativeRevenue)}
                    </td>
                    <td className="px-6 py-4 border-b font-semibold text-purple-600">
                      {formatCurrency(data.assetValue)}
                    </td>
                    <td className="px-6 py-4 border-b font-bold text-emerald-600">
                      {formatCurrency(cpfToggle === "withCPF" ? data.totalValueWithCPF : data.totalValueWithoutCPF)}
                    </td>
                    <td className="px-6 py-4 border-b">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-full bg-gray-200 rounded-sm h-4">
                          <div
                            className={`h-4 rounded-full ${recoveryPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(recoveryPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-sm font-semibold text-gray-600 min-w-[60px]">
                          {recoveryPercentage.toFixed(1)}%
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block
                        ${status.includes('Break-Even') ? 'bg-green-100 text-green-800' :
                          status.includes('75%') ? 'bg-yellow-100 text-yellow-800' :
                            status.includes('50%') ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-600'}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals Footer Row */}
            <tfoot className="bg-gray-100 font-bold text-gray-800">
              <tr>
                <td className="px-6 py-4 border-t-2 border-gray-300 text-lg">TOTALS</td>
                <td className="px-6 py-4 border-t-2 border-gray-300 text-green-700 text-lg">
                  {formatCurrency(
                    breakEvenAnalysis.breakEvenData.reduce((sum, data) =>
                      sum + (cpfToggle === "withCPF" ? data.annualRevenueWithCPF : data.annualRevenueWithoutCPF), 0
                    )
                  )}
                  {cpfToggle === "withCPF" && (
                    <div className="text-xs text-gray-500 font-normal">
                      Total CPF Paid: {formatCurrency(breakEvenAnalysis.breakEvenData.reduce((sum, data) => sum + data.cpfCost, 0))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 border-t-2 border-gray-300 text-blue-700 text-lg">
                  {formatCurrency(cpfToggle === "withCPF" ? breakEvenAnalysis.finalCumulativeRevenueWithCPF : breakEvenAnalysis.finalCumulativeRevenueWithoutCPF)}
                </td>
                <td className="px-6 py-4 border-t-2 border-gray-300 text-purple-700 text-lg">
                  {/* Final Asset Value (from last year) */}
                  {formatCurrency(breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1]?.assetValue || 0)}
                </td>
                <td className="px-6 py-4 border-t-2 border-gray-300 text-emerald-700 text-xl">
                  {/* Final Total Value */}
                  {formatCurrency(
                    (cpfToggle === "withCPF" ? breakEvenAnalysis.finalCumulativeRevenueWithCPF : breakEvenAnalysis.finalCumulativeRevenueWithoutCPF) +
                    (breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1]?.assetValue || 0)
                  )}
                </td>
                <td className="px-6 py-4 border-t-2 border-gray-300 text-gray-600">
                  <div className="text-xs uppercase tracking-wider">Final Outcome</div>
                  <div className="text-lg text-emerald-600">
                    {((
                      ((cpfToggle === "withCPF" ? breakEvenAnalysis.finalCumulativeRevenueWithCPF : breakEvenAnalysis.finalCumulativeRevenueWithoutCPF) +
                        (breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1]?.assetValue || 0)) /
                      breakEvenAnalysis.initialInvestment
                    ) * 100).toFixed(1)}% ROI
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BreakEvenTimeline;