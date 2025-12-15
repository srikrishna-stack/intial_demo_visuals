import React, { useState } from 'react';

const MonthlyRevenueBreak = ({
  treeData,
  buffaloDetails,
  monthlyRevenue,
  calculateAgeInMonths,
  calculateCumulativeRevenueUntilYear,
  calculateTotalCumulativeRevenueUntilYear,
  monthNames,
  formatCurrency
}) => {
  const [selectedYear, setSelectedYear] = useState(treeData.startYear);
  const [selectedUnit, setSelectedUnit] = useState(1);

  // Get buffaloes for selected unit and filter only income-producing ones
  const unitBuffaloes = Object.values(buffaloDetails)
    .filter(buffalo => buffalo.unit === selectedUnit)
    .filter(buffalo => {
      // Show buffalo if it produces any revenue this year OR is old enough to potentially produce
      // Or if it's M1/M2 which are main units
      if (buffalo.generation === 0) return true;

      if (selectedYear < buffalo.birthYear + 3) {
        return false;
      }

      const hasRevenue = monthNames.some((_, monthIndex) => {
        return (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0) > 0;
      });

      return hasRevenue;
    });

  // Helper to check precise CPF applicability
  const isCpfApplicableForMonth = (buffalo, year, month) => {
    if (buffalo.id === 'A') {
      return true;
    } else if (buffalo.id === 'B') {
      // Check if buffalo is present (acquired/born)
      // For Gen 0 (Mothers), they are acquired in startYear.
      // B is acquired in Month 6 of startYear.
      let isPresent = false;
      if (buffalo.generation === 0) {
        const startYear = treeData.startYear;
        isPresent = year > startYear || (year === startYear && month >= buffalo.acquisitionMonth);
      } else {
        isPresent = year > buffalo.birthYear || (year === buffalo.birthYear && month >= (buffalo.birthMonth || 0));
      }

      if (isPresent) {
        const startYear = treeData.startYear;
        // Free Period: July of Start Year to June of Start Year + 1
        // Free Indices: (StartYear, 6..11) and (StartYear+1, 0..5)
        const isFreePeriod = (year === startYear && month >= 6) || (year === startYear + 1 && month <= 5);
        if (!isFreePeriod) {
          return true;
        }
      }
    } else if (buffalo.generation >= 1) {
      // Child CPF: Age >= 36 months
      const ageInMonths = calculateAgeInMonths(buffalo, year, month);
      if (ageInMonths >= 36) {
        return true;
      }
    }
    return false;
  };

  // Calculate CPF cost for milk-producing buffaloes precisely per month
  const calculateCPFCost = () => {
    let monthlyCosts = new Array(12).fill(0);
    const buffaloCPFDetails = [];
    const CPF_PER_MONTH = 13000 / 12;
    // We check ALL buffaloes in unit, not just the filtered "unitBuffaloes" (which overlaps mostly but just to be safe)
    // Actually typically we want to show CPF details for buffaloes visibly contributing or costing money.
    // Let's iterate all buffaloes in the unit to catch any hidden costs? 
    // Usually only mature buffaloes have costs.
    const allUnitBuffaloes = Object.values(buffaloDetails).filter(b => b.unit === selectedUnit);

    let milkProducingBuffaloesWithCPF = 0; // Count of unique buffaloes paying CPF this year

    allUnitBuffaloes.forEach(buffalo => {
      let monthsWithCPF = 0;

      for (let month = 0; month < 12; month++) {
        if (isCpfApplicableForMonth(buffalo, selectedYear, month)) {
          monthlyCosts[month] += CPF_PER_MONTH;
          monthsWithCPF++;
        }
      }

      if (monthsWithCPF > 0) milkProducingBuffaloesWithCPF++;

      let reason = "No CPF";
      if (monthsWithCPF === 12) reason = "Full Year";
      else if (monthsWithCPF > 0) reason = `Partial (${monthsWithCPF} months)`;
      else if (buffalo.id === 'B' && selectedYear <= treeData.startYear + 1) reason = "Free Period";
      else if (buffalo.generation > 0) reason = "Age < 3 years";

      // Only add to details if relevant (generating income or has CPF)
      const inDisplayList = unitBuffaloes.find(b => b.id === buffalo.id);
      if (monthsWithCPF > 0 || inDisplayList || buffalo.generation === 0) {
        buffaloCPFDetails.push({
          id: buffalo.id,
          hasCPF: monthsWithCPF > 0,
          reason: reason,
          monthsWithCPF
        });
      }
    });

    const annualCPFCost = monthlyCosts.reduce((a, b) => a + b, 0);

    return {
      monthlyCosts, // Array of 12 numbers
      annualCPFCost: Math.round(annualCPFCost),
      buffaloCPFDetails,
      milkProducingBuffaloesWithCPF
    };
  };

  const cpfCost = calculateCPFCost();

  // Calculate cumulative revenue until selected year
  const cumulativeRevenueUntilYear = calculateCumulativeRevenueUntilYear(selectedUnit, selectedYear);
  const totalCumulativeUntilYear = calculateTotalCumulativeRevenueUntilYear(selectedUnit, selectedYear);

  // Calculate CPF cumulative cost until selected year precisely
  const calculateCumulativeCPFCost = () => {
    let totalCPF = 0;
    const CPF_PER_MONTH = 13000 / 12;

    for (let year = treeData.startYear; year <= selectedYear; year++) {
      const allUnitBuffaloes = Object.values(buffaloDetails).filter(b => b.unit === selectedUnit);
      allUnitBuffaloes.forEach(buffalo => {
        for (let month = 0; month < 12; month++) {
          if (isCpfApplicableForMonth(buffalo, year, month)) {
            totalCPF += CPF_PER_MONTH;
          }
        }
      });
    }

    return Math.round(totalCPF);
  };

  const cumulativeCPFCost = calculateCumulativeCPFCost();
  const cumulativeNetRevenue = totalCumulativeUntilYear - cumulativeCPFCost;

  // Helper to calculate dynamic date range string
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const startDay = treeData.startDay || 1;
  const startMonthName = monthNames[treeData.startMonth || 0];
  const startDateString = `${getOrdinal(startDay)} ${startMonthName} ${treeData.startYear}`;
  const endDateString = `31st December ${selectedYear}`;
  const dateRangeString = `${startDateString} - ${endDateString}`;

  // Download Excel functionad
  const downloadExcel = () => {
    let csvContent = "Monthly Revenue Breakdown - Unit " + selectedUnit + " - " + selectedYear + "\n\n";

    csvContent += "Month,";
    unitBuffaloes.forEach(buffalo => {
      csvContent += buffalo.id + ",";
    });
    csvContent += "Unit Total,CPF Cost,Net Revenue,Cumulative Revenue Until " + selectedYear + "\n";

    monthNames.forEach((month, monthIndex) => {
      const unitTotal = unitBuffaloes.reduce((sum, buffalo) => {
        return sum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
      }, 0);

      const monthlyCPF = cpfCost.monthlyCosts[monthIndex];
      const netRevenue = unitTotal - monthlyCPF;

      csvContent += month + ",";
      unitBuffaloes.forEach(buffalo => {
        const revenue = monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0;
        csvContent += revenue + ",";
      });
      csvContent += unitTotal + "," + Math.round(monthlyCPF) + "," + Math.round(netRevenue) + "," + totalCumulativeUntilYear + "\n";
    });

    // Yearly totals
    const yearlyUnitTotal = unitBuffaloes.reduce((sum, buffalo) => {
      return sum + monthNames.reduce((monthSum, _, monthIndex) => {
        return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
      }, 0);
    }, 0);

    const yearlyNetRevenue = yearlyUnitTotal - cpfCost.annualCPFCost;

    csvContent += "\nYearly Total,";
    unitBuffaloes.forEach(buffalo => {
      const yearlyTotal = monthNames.reduce((sum, _, monthIndex) => {
        return sum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
      }, 0);
      csvContent += yearlyTotal + ",";
    });
    csvContent += yearlyUnitTotal + "," + cpfCost.annualCPFCost + "," + yearlyNetRevenue + "," + totalCumulativeUntilYear + "\n";

    // Add CPF details section
    csvContent += "\n\nCPF Details,\n";
    csvContent += "Buffalo ID,Has CPF,Months,Reason\n";
    cpfCost.buffaloCPFDetails.forEach(detail => {
      csvContent += detail.id + "," + (detail.hasCPF ? "Yes" : "No") + "," + detail.monthsWithCPF + "," + detail.reason + "\n";
    });

    // Add cumulative data
    csvContent += "\n\nCumulative Data,\n";
    csvContent += "Description,Amount\n";
    csvContent += "Cumulative Revenue Until " + selectedYear + "," + totalCumulativeUntilYear + "\n";
    csvContent += "Cumulative CPF Cost," + cumulativeCPFCost + "\n";
    csvContent += "Cumulative Net Revenue," + cumulativeNetRevenue + "\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Unit-${selectedUnit}-Revenue-${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="  px-10 py-2 mb-16 xl:mx-20">
      {/* Monthly Revenue Table */}
      {unitBuffaloes.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">

          {/* Header Controls Row */}
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6">

            {/* Left: Unit Selector */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-400 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                    1 Unit
                  </label>

                </div>
              </div>
            </div>

            {/* Center: Title & Year Selector */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-2xl font-bold text-slate-900">
                  Monthly Revenue Breakdown -
                </h3>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="text-2xl font-bold text-slate-900 bg-transparent border-b-2 border-slate-300 focus:border-blue-500 focus:outline-none cursor-pointer py-1"
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={treeData.startYear + i}>
                      {treeData.startYear + i}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-slate-600 font-medium text-sm">
                Unit {selectedUnit} • {unitBuffaloes.length} Buffalo{unitBuffaloes.length !== 1 ? 'es' : ''}
              </p>
              <div className="text-xs text-amber-600 mt-1">
                B CPF: {selectedYear === treeData.startYear ? `Free (July-Dec ${selectedYear})` :
                  selectedYear === treeData.startYear + 1 ? `Half year CPF (July-Dec ${selectedYear})` :
                    selectedYear > treeData.startYear + 1 ? 'Full CPF (₹13,000)' : 'No CPF'}
              </div>
            </div>

            {/* Right: Summary & Download */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Small Summary Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-2 shadow-sm text-right">
                <div className="text-xs font-medium text-slate-600">
                  Total Revenue ({dateRangeString})
                </div>
                <div className="text-sm font-bold text-blue-700">
                  {formatCurrency(totalCumulativeUntilYear)}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">
                  Net: <span className="font-semibold text-emerald-600">{formatCurrency(cumulativeNetRevenue)}</span>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={downloadExcel}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-2 rounded-lg shadow hover:shadow-md hover:scale-105 transition-all text-sm flex items-center gap-2"
                title="Download Excel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span className="hidden sm:inline font-semibold">Download Excel</span>
              </button>
            </div>

          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-300">
                  <th className="py-4 px-4 text-center font-bold text-slate-800 text-base border-r border-slate-300">
                    Month
                  </th>
                  {unitBuffaloes.map((buffalo, index) => (
                    <th
                      key={buffalo.id}
                      className="py-3 px-3 text-center font-medium text-slate-800 border-r border-slate-300"
                      style={{
                        borderRight: index === unitBuffaloes.length - 1 ? '2px solid #cbd5e1' : '1px solid #e2e8f0'
                      }}
                    >
                      <div className="font-bold text-slate-900 text-base">{buffalo.id}</div>
                      <div className="text-sm font-normal text-slate-500 mt-1">
                        {buffalo.generation === 0 ? 'Mother' :
                          buffalo.generation === 1 ? 'Child' : 'Grandchild'}
                      </div>
                    </th>
                  ))}
                  <th className="py-4 px-4 text-center font-bold text-white text-base border-r border-slate-300 bg-slate-700">
                    Unit Total
                  </th>
                  <th className="py-4 px-4 text-center font-bold text-white text-base border-r border-slate-300 bg-amber-600">
                    CPF Cost
                  </th>
                  <th className="py-4 px-4 text-center font-bold text-white text-base bg-emerald-600">
                    Net Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthNames.map((month, monthIndex) => {
                  const unitTotal = unitBuffaloes.reduce((sum, buffalo) => {
                    return sum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                  }, 0);

                  const monthlyCpfValue = cpfCost.monthlyCosts[monthIndex];
                  const netRevenue = unitTotal - monthlyCpfValue;

                  return (
                    <>
                      {/* Month Row */}
                      <tr key={monthIndex} className={`hover:bg-slate-50 transition-colors ${monthIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="py-4 px-4 text-center font-semibold text-slate-900 text-base border-r border-slate-300 border-b border-slate-200 bg-slate-100">
                          {month}
                        </td>
                        {unitBuffaloes.map((buffalo, buffaloIndex) => {
                          const revenue = monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0;
                          const revenueType = revenue === 9000 ? 'high' : revenue === 6000 ? 'medium' : 'low';
                          const bgColors = {
                            high: 'bg-emerald-50 hover:bg-emerald-100',
                            medium: 'bg-blue-50 hover:bg-blue-100',
                            low: 'bg-slate-50 hover:bg-slate-100'
                          };
                          const textColors = {
                            high: 'text-emerald-700',
                            medium: 'text-blue-700',
                            low: 'text-slate-500'
                          };

                          return (
                            <td
                              key={buffalo.id}
                              className={`py-4 px-3 text-center transition-all duration-200 border-b border-slate-200 ${bgColors[revenueType]}`}
                              style={{
                                borderRight: buffaloIndex === unitBuffaloes.length - 1 ? '2px solid #cbd5e1' : '1px solid #e2e8f0'
                              }}
                            >
                              <div className={`font-semibold text-base ${textColors[revenueType]}`}>
                                {formatCurrency(revenue)}
                              </div>
                              {revenue > 0 && (
                                <div className="text-sm text-slate-500 mt-1">
                                  {revenueType.charAt(0).toUpperCase() + revenueType.slice(1)}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-4 px-4 text-center font-semibold text-slate-900 text-base border-r border-slate-300 border-b border-slate-200 bg-slate-100">
                          {formatCurrency(unitTotal)}
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-amber-700 text-base border-r border-slate-300 border-b border-slate-200 bg-amber-50">
                          {formatCurrency(monthlyCpfValue)}
                        </td>
                        <td className={`py-4 px-4 text-center font-semibold text-base border-b border-slate-200 ${netRevenue >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                          }`}>
                          {formatCurrency(netRevenue)}
                        </td>
                      </tr>

                      {/* Separator line after every 3 months for better readability */}
                      {(monthIndex === 2 || monthIndex === 5 || monthIndex === 8) && (
                        <tr>
                          <td colSpan={unitBuffaloes.length + 4} className="h-px bg-slate-300"></td>
                        </tr>
                      )}
                    </>
                  );
                })}

                {/* Yearly Total Row */}
                <tr className="bg-gradient-to-r from-slate-400 to-slate-500 text-white">
                  <td className="py-5 px-4 text-center font-bold text-base border-r border-slate-700">
                    Yearly Total
                  </td>
                  {unitBuffaloes.map((buffalo, buffaloIndex) => {
                    const yearlyTotal = monthNames.reduce((sum, _, monthIndex) => {
                      return sum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                    }, 0);
                    return (
                      <td
                        key={buffalo.id}
                        className="py-4 px-3 text-center font-semibold text-base "
                        style={{ borderRight: buffaloIndex === unitBuffaloes.length - 1 ? '2px solid #475569' : '1px solid #64748b' }}
                      >
                        {formatCurrency(yearlyTotal)}
                      </td>
                    );
                  })}
                  <td className="py-5 px-4 text-center font-bold text-base  bg-slate-950">
                    {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                      return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                        return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                      }, 0);
                    }, 0))}
                  </td>
                  <td className="py-5 px-4 text-center font-bold text-base  bg-amber-950">
                    {formatCurrency(cpfCost.annualCPFCost)}
                  </td>
                  <td className="py-5 px-4 text-center font-bold text-base bg-emerald-900">
                    {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                      return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                        return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                      }, 0);
                    }, 0) - cpfCost.annualCPFCost)}
                  </td>
                </tr>

                {/* Cumulative Revenue Row */}
                <tr className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
                  <td className="py-5 px-4 text-center font-bold text-base border-r border-blue-800">
                    Cumulative Until {selectedYear}
                  </td>
                  {unitBuffaloes.map((buffalo, buffaloIndex) => {
                    return (
                      <td
                        key={buffalo.id}
                        className="py-4 px-3 text-center font-semibold text-base border-r border-blue-800"
                        style={{ borderRight: buffaloIndex === unitBuffaloes.length - 1 ? '2px solid #1e40af' : '1px solid #3b82f6' }}
                      >
                        {formatCurrency(cumulativeRevenueUntilYear[buffalo.id] || 0)}
                      </td>
                    );
                  })}
                  <td className="py-5 px-4 text-center font-bold text-base border-r border-blue-800 bg-slate-900">
                    {formatCurrency(totalCumulativeUntilYear)}
                  </td>
                  <td className="py-5 px-4 text-center font-bold text-base border-r border-blue-800 bg-amber-800">
                    {formatCurrency(cumulativeCPFCost)}
                  </td>
                  <td className="py-5 px-4 text-center font-bold text-base bg-emerald-800">
                    {formatCurrency(cumulativeNetRevenue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                  return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                    return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                  }, 0);
                }, 0))}
              </div>
              <div className="text-lg font-semibold text-slate-700">Annual Revenue</div>
              <div className="text-sm text-slate-500 mt-1">{selectedYear}</div>

            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 shadow-sm">
              <div className="text-3xl font-bold text-amber-700 mb-2">
                {formatCurrency(cpfCost.annualCPFCost)}
              </div>
              <div className="text-lg font-semibold text-amber-800">Annual CPF Cost</div>
              <div className="text-sm text-amber-600 mt-1">
                {cpfCost.milkProducingBuffaloesWithCPF} buffaloes with CPF
              </div>

            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 shadow-sm">
              <div className="text-3xl font-bold text-emerald-700 mb-2">
                {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                  return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                    return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                  }, 0);
                }, 0) - cpfCost.annualCPFCost)}
              </div>
              <div className="text-lg font-semibold text-emerald-800">Net Annual Revenue</div>
              <div className="text-sm text-emerald-600 mt-1">{selectedYear}</div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200 shadow-sm">
              <div className="text-3xl font-bold text-indigo-700 mb-2">
                {formatCurrency(cumulativeNetRevenue)}
              </div>
              <div className="text-lg font-semibold text-indigo-800">Cumulative Net</div>
              <div className="text-sm text-indigo-600 mt-1">Until {selectedYear}</div>
            </div>
          </div>

          {/* CPF Details Section */}
          {/* <div className="mt-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <h4 className="text-lg font-bold text-slate-800 mb-4">CPF Details for Unit {selectedUnit} - {selectedYear}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cpfCost.buffaloCPFDetails.map((detail, index) => (
                <div key={index} className={`p-4 rounded-lg border ${detail.hasCPF ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800">{detail.id}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${detail.hasCPF ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {detail.hasCPF ? 'CPF Applied' : 'No CPF'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">{detail.reason}</div>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 border border-amber-200 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <span className="text-3xl">🐄</span>
          </div>
          <div className="text-2xl font-bold text-amber-900 mb-3">
            No Income Producing Buffaloes
          </div>
          <div className="text-lg text-amber-800 mb-2 flex items-center justify-center gap-2 flex-wrap">
            There are no income-producing buffaloes in Unit {selectedUnit} for
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-lg font-bold text-amber-900 bg-transparent border-b-2 border-amber-400 focus:border-amber-600 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={treeData.startYear + i}>
                  {treeData.startYear + i}
                </option>
              ))}
            </select>
            (or not old enough yet).
          </div>
          <div className="mt-6 pt-4 border-t border-amber-300">
            <div className="text-sm text-amber-600">
              Check other units or select a different year to view revenue data.
            </div>
          </div>
        </div>
      )}
      {/* Dynamic Calculation Note */}
      <div className="mt-8 text-center text-sm text-slate-500">
        Note: B gets one year free CPF from import date (July {treeData.startYear} to June {treeData.startYear + 1}).
        CPF calculation: ₹13,000 per buffalo per year (calculated monthly).
      </div>

    </div>
  );
};

export default MonthlyRevenueBreak;