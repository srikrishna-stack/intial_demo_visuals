import React from 'react';

const RevenueBreakEven = ({
  treeData,
  initialInvestment,
  yearlyCPFCost,
  breakEvenAnalysis,
  cpfToggle,
  setCpfToggle,
  formatCurrency,
  revenueBreakEvenYearWithoutCPF,
  revenueBreakEvenMonthWithoutCPF,
  revenueBreakEvenYearWithCPF,
  revenueBreakEvenMonthWithCPF,
  revenueExactBreakEvenDateWithoutCPF,
  revenueExactBreakEvenDateWithCPF
}) => {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Calculate revenue-only break-even summary
  const calculateRevenueBreakEvenSummary = () => {
    const summary = {
      withoutCPF: {
        year: revenueBreakEvenYearWithoutCPF,
        month: revenueBreakEvenMonthWithoutCPF,
        date: revenueExactBreakEvenDateWithoutCPF,
        monthsToBreakEven: revenueBreakEvenYearWithoutCPF && revenueBreakEvenMonthWithoutCPF
          ? (revenueBreakEvenYearWithoutCPF - treeData.startYear) * 12 + (revenueBreakEvenMonthWithoutCPF + 1)
          : null,
        totalInvestment: initialInvestment.totalInvestment
      },
      withCPF: {
        year: revenueBreakEvenYearWithCPF,
        month: revenueBreakEvenMonthWithCPF,
        date: revenueExactBreakEvenDateWithCPF,
        monthsToBreakEven: revenueBreakEvenYearWithCPF && revenueBreakEvenMonthWithCPF
          ? (revenueBreakEvenYearWithCPF - treeData.startYear) * 12 + (revenueBreakEvenMonthWithCPF + 1)
          : null,
        totalInvestment: initialInvestment.totalInvestment
      }
    };

    return summary;
  };

  const revenueBreakEvenSummary = calculateRevenueBreakEvenSummary();

  // Helper for date formatting
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const startDay = treeData.startDay || 1;
  const startMonthName = monthNames[treeData.startMonth || 0];
  const startDateString = `${getOrdinal(startDay)} ${startMonthName} ${treeData.startYear}`;

  // Function to calculate investment recovery status based on cumulative revenue
  const calculateInvestmentRecoveryStatus = (cumulativeRevenue, totalInvestment, isRevenueBreakEven) => {
    const recoveryPercentage = (cumulativeRevenue / totalInvestment) * 100;

    let status = "";
    if (isRevenueBreakEven || recoveryPercentage >= 100) {
      status = "Break-Even Achieved ✓";
    } else if (recoveryPercentage >= 75) {
      status = "75% Investment Recovered";
    } else if (recoveryPercentage >= 50) {
      status = "50% Investment Recovered";
    } else if (recoveryPercentage >= 25) {
      status = "25% Investment Recovered";
    } else {
      status = "In Progress";
    }

    return {
      recoveryPercentage,
      status
    };
  };

  return (
    <div className=" p-5 rounded-2xl border border-purple-200 mb-16 xl:mx-20">
      {/* Break-Even Timeline */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-800 text-center m-0">
            Revenue Break-Even Analysis (With CPF)
          </h3>
          {revenueBreakEvenSummary.withCPF.date && (
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-lg px-3 py-2 shadow-sm flex flex-col justify-center ml-20">
              <div className="text-[15px] font-bold text-emerald-800 uppercase mb-0.5">Break-Even WITH CPF</div>
              <div className="text-sm font-bold text-emerald-900 leading-none mb-1">
                {startDateString} - {getOrdinal(revenueBreakEvenSummary.withCPF.date.getDate())} {monthNames[revenueBreakEvenSummary.withCPF.date.getMonth()]} {revenueBreakEvenSummary.withCPF.date.getFullYear()}
              </div>
              {/* <div className="text-sm font-semibold text-emerald-700 mb-0.5">
                Net: {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
              </div> */}
              <div className="text-lg text-emerald-600">
                {revenueBreakEvenSummary.withCPF.monthsToBreakEven} months <span className="opacity-75">({(revenueBreakEvenSummary.withCPF.monthsToBreakEven / 12).toFixed(1)} years)</span>
              </div>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Year</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">
                  Annual Revenue (Net)
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">
                  Cumulative (Net)
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Investment Recovery</th>
              </tr>
            </thead>
            <tbody>
              {breakEvenAnalysis.breakEvenData.map((data, index) => {
                const annualRevenue = data.annualRevenueWithCPF;
                const cumulativeRevenue = data.cumulativeRevenueWithCPF;
                const isRevenueBreakEven = data.isRevenueBreakEvenWithCPF;

                // Calculate investment recovery based on cumulative revenue vs total investment
                const { recoveryPercentage, status } = calculateInvestmentRecoveryStatus(
                  cumulativeRevenue,
                  initialInvestment.totalInvestment,
                  isRevenueBreakEven
                );

                return (
                  <tr key={data.year} className={`hover:bg-blue-50 transition-colors ${isRevenueBreakEven ? 'bg-green-50' : ''}`}>
                    <td className="px-6 py-4 border-b">
                      <div className="font-semibold text-gray-900">{data.year}</div>
                      <div className="text-sm text-gray-600">Year {index + 1}</div>
                      {isRevenueBreakEven && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          ⭐ Revenue Break-Even Achieved
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 border-b font-semibold text-green-600">
                      {formatCurrency(annualRevenue)}
                      <div className="text-xs text-gray-500">
                        CPF: -{formatCurrency(data.cpfCost)}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b font-semibold text-blue-600">
                      {formatCurrency(cumulativeRevenue)}
                    </td>
                    <td className="px-6 py-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className={`h-4 rounded-full ${recoveryPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(recoveryPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-sm font-semibold text-gray-600 min-w-[60px]">
                          {/* Show actual percentage even if it's above 100% */}
                          {recoveryPercentage.toFixed(1)}%
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold mt-2 inline-block
                        ${status.includes('Break-Even') ? 'bg-green-100 text-green-800' :
                          status.includes('75%') ? 'bg-yellow-100 text-yellow-800' :
                            status.includes('50%') ? 'bg-blue-100 text-blue-800' :
                              status.includes('25%') ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-600'}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Initial Investment & Break-Even Analysis - Professional Layout */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {/* Mother Buffaloes Cost */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-700 mb-2">
            {formatCurrency(initialInvestment.motherBuffaloCost)}
          </div>
          <div className="text-md font-semibold text-blue-800 mb-1">Mother Buffaloes</div>
          <div className="text-xs text-gray-600">
            {treeData.units} units × 2 mothers × ₹1.75 Lakhs
            <br />
            {initialInvestment.motherBuffaloes} mother buffaloes @ ₹1.75L each
            <br />
            Total: 2 × ₹1.75L = ₹3.5L per unit
          </div>
        </div>

        {/* CPF Cost */}
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-5 border border-emerald-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-700 mb-2">
            {formatCurrency(initialInvestment.cpfCost)}
          </div>
          <div className="text-md font-semibold text-emerald-800 mb-1">CPF Coverage</div>
          <div className="text-xs text-gray-600">
            {treeData.units} units × ₹13,000
            <br />
            One CPF covers both M1 and M2 per unit
            <br />
            M1 has CPF, M2 gets free coverage
          </div>
        </div>

        {/* Total Investment Card - Added in the middle */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-lg text-center transform hover:scale-[1.02] transition-transform duration-200">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-xs font-semibold opacity-90 mb-1">Total Initial Investment</div>
            <div className="text-2xl md:text-3xl font-bold mb-2">
              {formatCurrency(initialInvestment.totalInvestment)}
            </div>
            <div className="text-xs opacity-80">
              {initialInvestment.totalBuffaloesAtStart} buffaloes total
              <br />
              (2 mothers + 2 calves per unit)
              <br />
              + CPF coverage for each unit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueBreakEven;