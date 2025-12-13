import React from 'react';
import { Info } from 'lucide-react';

const BreakEvenTimeline = ({
  treeData,
  breakEvenAnalysis,
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

  const monthsToBreakEvenWithCPF = calculateMonthsToBreakEven(breakEvenAnalysis.exactBreakEvenDateWithCPF);

  // Helper for date formatting
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const lastYear = breakEvenAnalysis.breakEvenData.length > 0
    ? breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1].year
    : (treeData.startYear + treeData.years - 1);

  const formattedDateRange = `${getOrdinal(treeData.startDay || 1)} ${monthNames[treeData.startMonth || 0]} ${treeData.startYear} - 31st December ${lastYear}`;

  return (
    <div className=" rounded-3xl p-10 shadow-2xl border border-green-200 mb-16 mx-20">
      {/* Main Heading */}
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Break-Even Timeline Analysis
        </h2>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Initial Investment Summary Card */}
        <div>
          <div className="bg-gray-800 rounded-xl p-4 py-7 border border-gray-700 shadow-sm ">
            <div className="text-center mb-3">
              <div className="text-sm font-bold text-white uppercase tracking-wide mb-1">Investment Summary</div>
              <div className="text-xs text-gray-300">Projection Settings</div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center ">
              <div className="bg-gray-700 rounded-lg p-3 py-7 border border-gray-600 ">
                <div className="text-xs font-medium text-gray-300 mb-1">Start Date</div>
                <div className="text-sm font-bold text-emerald-300">
                  {monthNames[treeData.startMonth]} {treeData.startDay || 1}, {treeData.startYear}
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-3 py-7 border border-gray-600">
                <div className="text-xs font-medium text-gray-300 mb-1">Initial Investment</div>
                <div className="text-sm font-bold text-emerald-300">
                  {formatCurrency(breakEvenAnalysis.initialInvestment)}
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-3 py-7 border border-gray-600">
                <div className="text-xs font-medium text-gray-300 mb-1">Units</div>
                <div className="text-sm font-bold text-indigo-300">{treeData.units}</div>
              </div>

              <div className="bg-gray-700 rounded-lg p-3 py-7 border border-gray-600">
                <div className="text-xs font-medium text-gray-300 mb-1">Projection Period</div>
                <div className="text-sm font-bold text-violet-300">{yearRange}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Break-Even Achievement Card */}
        <div>
          {breakEvenAnalysis.exactBreakEvenDateWithCPF && (
            <div className="bg-gray-800 rounded-xl p-4 text-white shadow-sm h-full">
              <div className="text-center mb-3">
                <div className="text-sm font-bold mb-1">Your Investment</div>
                <div className="text-xs text-gray-300">
                  Break-Even WITH CPF Achieved on {breakEvenAnalysis.exactBreakEvenDateWithCPF.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">

                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-300 mb-1"> In Just {monthsToBreakEvenWithCPF} Months</div>
                  <div className="text-sm font-bold">
                    ({Math.floor(monthsToBreakEvenWithCPF / 12)} years and {monthsToBreakEvenWithCPF % 12} months)
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-300 mb-1">Investment Cycle</div>
                  <div className="text-sm font-bold">
                    Year {breakEvenAnalysis.exactBreakEvenDateWithCPF.getFullYear() - treeData.startYear + 1}
                  </div>
                  <div className="text-xs text-gray-300 mt-0.5">Month {breakEvenAnalysis.breakEvenMonthWithCPF + 1}</div>
                </div>

                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-300 mb-1">Net Cumulative Revenue</div>
                  <div className="text-sm font-bold">
                    {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
                  </div>
                  <div className="text-xs text-gray-300 mt-0.5">Total net milk sales to date</div>
                </div>

                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-300 mb-1">Initial Investment</div>
                  <div className="text-sm font-bold">
                    {formatCurrency(breakEvenAnalysis.initialInvestment)}
                  </div>
                  <div className="text-xs text-gray-300 mt-0.5">Fully recovered!</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Break-Even Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Break-Even Timeline Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Break-Even Timeline</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">Start Date:</span>
              <span className="text-sm font-semibold text-slate-800">
                {monthNames[treeData.startMonth]} {treeData.startDay || 1}, {treeData.startYear}
              </span>
            </div>
            {breakEvenAnalysis.exactBreakEvenDateWithCPF && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Break-Even Date:</span>
                  <span className="text-sm font-semibold text-emerald-700">
                    {breakEvenAnalysis.exactBreakEvenDateWithCPF.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Time to Break-Even:</span>
                  <span className="text-sm font-semibold text-indigo-700">
                    {monthsToBreakEvenWithCPF} months
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Net Cumulative Revenue:</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
                  </span>
                </div>

                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800 leading-relaxed">
                      <strong>What is Net Cumulative Revenue?</strong><br />
                      This is the total profit (Revenue minus CPF cost) accumulated over the entire period from <strong>{formattedDateRange.split(' - ')[0]}</strong> to <strong>{formattedDateRange.split(' - ')[1]}</strong>.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Investment Recovery Progress Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Investment Recovery Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-slate-500">Initial Investment</span>
                <span className="text-xs font-semibold text-slate-700">
                  {formatCurrency(breakEvenAnalysis.initialInvestment)}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-slate-400 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {breakEvenAnalysis.exactBreakEvenDateWithCPF && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-slate-500">Recovered at Break-Even</span>
                  <span className="text-xs font-semibold text-emerald-700">
                    {formatCurrency(breakEvenAnalysis.initialInvestment)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-slate-500">Final Cumulative Revenue</span>
                <span className="text-xs font-semibold text-violet-700">
                  {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-violet-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (breakEvenAnalysis.finalCumulativeRevenueWithCPF / breakEvenAnalysis.initialInvestment) * 100)}%`
                  }}
                ></div>
              </div>
              <div className="text-xs text-slate-500 mt-1 text-right">
                {((breakEvenAnalysis.finalCumulativeRevenueWithCPF / breakEvenAnalysis.initialInvestment) * 100).toFixed(1)}% of initial
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Break-Even Timeline Table */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className='text-center mb-6'>
          <h3 className="text-xl font-bold text-slate-800">
            Break-Even Timeline ({formattedDateRange}) - With CPF
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Year</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Annual Revenue (Net)
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Cumulative (Net)
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Asset Market Value
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Total Value (Rev + Asset)
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Investment Recovery
                </th>
              </tr>
            </thead>
            <tbody>
              {breakEvenAnalysis.breakEvenData.map((data, index) => {
                const annualRevenue = data.annualRevenueWithCPF;
                const cumulativeRevenue = data.cumulativeRevenueWithCPF;
                const recoveryPercentage = data.recoveryPercentageWithCPF;
                const status = data.statusWithCPF;

                // Format year display
                const yearDisplay = data.year === treeData.startYear
                  ? `${data.year}\nYear 1`
                  : `${data.year}\nYear ${index + 1}`;

                // Determine if this is the break-even year row for highlighting
                const isBreakEvenRow = data.isBreakEvenWithCPF;
                const rowClass = isBreakEvenRow
                  ? "bg-emerald-50 border-l-4 border-emerald-500"
                  : "hover:bg-slate-50 transition-colors";

                return (
                  <tr key={data.year} className={rowClass}>
                    <td className="px-4 py-3 border-b border-slate-100">
                      <div className="font-medium text-slate-900 whitespace-pre-line">
                        {yearDisplay}
                        {isBreakEvenRow && (
                          <span className="block mt-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">
                            ★ Break-Even Achieved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100">
                      <div className="font-medium text-emerald-700">
                        {formatCurrency(annualRevenue)}
                      </div>
                      <div className="text-xs text-amber-600 mt-0.5">
                        CPF: -{formatCurrency(data.cpfCost)}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 font-medium text-indigo-700">
                      {formatCurrency(cumulativeRevenue)}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 font-medium text-violet-700">
                      {formatCurrency(data.assetValue)}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 font-semibold text-emerald-800">
                      {formatCurrency(data.totalValueWithCPF)}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100">
                      <div className="mb-2">
                        <div className="text-xs font-medium text-slate-600 mb-1">
                          {recoveryPercentage.toFixed(1)}% recovered
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${recoveryPercentage >= 100 ? 'bg-emerald-500' : recoveryPercentage >= 75 ? 'bg-blue-500' : 'bg-indigo-400'}`}
                            style={{ width: `${Math.min(recoveryPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full inline-block
                  ${status.includes('Break-Even') ? 'bg-emerald-100 text-emerald-800' :
                          status.includes('75%') ? 'bg-blue-100 text-blue-800' :
                            status.includes('50%') ? 'bg-indigo-100 text-indigo-800' :
                              'bg-slate-100 text-slate-600'}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Compact Totals Footer */}
            <tfoot className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
              <tr>
                <td className="px-4 py-3 border-t border-slate-700 font-semibold text-sm">
                  FINAL TOTALS
                </td>
                <td className="px-4 py-3 border-t border-slate-700">
                  <div className="font-semibold text-emerald-300">
                    {formatCurrency(
                      breakEvenAnalysis.breakEvenData.reduce((sum, data) =>
                        sum + data.annualRevenueWithCPF, 0
                      )
                    )}
                  </div>
                  <div className="text-xs text-slate-300 opacity-90 mt-0.5">
                    Total CPF: {formatCurrency(breakEvenAnalysis.breakEvenData.reduce((sum, data) => sum + data.cpfCost, 0))}
                  </div>
                </td>
                <td className="px-4 py-3 border-t border-slate-700 font-semibold text-indigo-300">
                  {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
                </td>
                <td className="px-4 py-3 border-t border-slate-700 font-semibold text-violet-300">
                  {formatCurrency(breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1]?.assetValue || 0)}
                </td>
                <td className="px-4 py-3 border-t border-slate-700">
                  <div className="font-bold text-lg text-emerald-300">
                    {formatCurrency(
                      breakEvenAnalysis.finalCumulativeRevenueWithCPF +
                      (breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1]?.assetValue || 0)
                    )}
                  </div>
                  <div className="text-xs text-slate-300 opacity-90 mt-0.5">
                    Revenue + Assets
                  </div>
                </td>
                <td className="px-4 py-3 border-t border-slate-700">
                  <div className="text-xs uppercase tracking-wider opacity-90 mb-1">ROI</div>
                  <div className="text-base font-bold text-emerald-300">
                    {((breakEvenAnalysis.finalCumulativeRevenueWithCPF +
                      (breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1]?.assetValue || 0)) /
                      breakEvenAnalysis.initialInvestment * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-300 opacity-90 mt-0.5">
                    {formatCurrency(breakEvenAnalysis.initialInvestment)} initial
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