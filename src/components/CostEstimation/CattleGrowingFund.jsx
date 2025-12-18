import React, { useState, useEffect } from 'react';

const CattleGrowingFund = ({
    treeData,
    buffaloDetails,
    yearlyCPFCost,
    monthlyRevenue,
    yearlyData,
    formatCurrency,
    startYear,
    endYear,
    endMonth
}) => {
    const [selectedYear, setSelectedYear] = useState(treeData.startYear);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Helper to calculate financials for a specific year
    const calculateFinancialsForYear = (year) => {
        const costBrackets = [
            { label: "0-12 months", start: 0, end: 12, cost: 0 },
            { label: "13-18 months", start: 13, end: 18, cost: 6000 },
            { label: "19-24 months", start: 19, end: 24, cost: 8400 },
            { label: "25-30 months", start: 25, end: 30, cost: 10800 },
            { label: "31-36 months", start: 31, end: 36, cost: 15000 },
            { label: " 37+ months", start: 37, end: 999, cost: 0 }
        ];

        const startOfSimulationYear = treeData.startYear;
        const startOfSimulationMonth = treeData.startMonth || 0;

        // Determine months to iterate in this year
        let startMonthInYear = 0;
        let endMonthInYear = 11;

        if (year === startOfSimulationYear) {
            startMonthInYear = startOfSimulationMonth;
        }
        if (year === endYear && endMonth !== undefined) {
            endMonthInYear = endMonth;
        }

        // Identify Children (Gen > 0) active in this year
        // Active = Born on or before endMonthInYear of this year
        const endOfSelectedYearInTotalMonths = year * 12 + endMonthInYear;
        const activeChildren = Object.values(buffaloDetails).filter(b => {
            const birthTotalMonths = b.birthYear * 12 + (b.birthMonth || 0);
            return b.generation > 0 && birthTotalMonths <= endOfSelectedYearInTotalMonths;
        }).sort((a, b) => a.id.localeCompare(b.id));


        // Data Structure: monthlyData[monthIndex] = { monthName, costs: { childId: cost }, totalMonthlyCost }
        const monthlyData = [];
        const childTotalCosts = {}; // { childId: totalYearlyCost }
        const childActiveBrackets = {}; // { childId: Set<string> }

        activeChildren.forEach(c => {
            childTotalCosts[c.id] = 0;
            childActiveBrackets[c.id] = new Set();
        });

        let totalYearlyCaringCost = 0;

        for (let month = 0; month < 12; month++) {
            const rowData = {
                monthName: monthNames[month],
                costs: {},
                totalMonthlyCost: 0,
                isValidMonth: month >= startMonthInYear && month <= endMonthInYear
            };

            if (rowData.isValidMonth) {
                const currentAbsoluteMonth = year * 12 + month;

                activeChildren.forEach(child => {
                    const buffaloAbsoluteBirth = child.birthYear * 12 + (child.birthMonth || 0);

                    if (buffaloAbsoluteBirth <= currentAbsoluteMonth) {
                        // Age Calculation: 1-based index (e.g. Born Jan, Current Jan = 1st month)
                        // currentAbsoluteMonth - buffaloAbsoluteBirth give 0 for same month.
                        // So we add 1 to get "1st month", "12th month" etc.
                        const ageInMonths = (currentAbsoluteMonth - buffaloAbsoluteBirth) + 1;

                        const bracketIndex = costBrackets.findIndex(b => ageInMonths >= b.start && ageInMonths <= b.end);

                        if (bracketIndex !== -1) {
                            const bracket = costBrackets[bracketIndex];

                            // Track active bracket
                            const shortLabel = bracket.label.replace(" months", "m").replace("months", "m");
                            childActiveBrackets[child.id].add(shortLabel);

                            // Monthly Rate Calculation
                            let duration = bracket.end - bracket.start + 1;
                            if (bracket.end === 999) duration = 12; // Arbitrary safe divisor

                            const monthlyRate = bracket.cost / duration;

                            rowData.costs[child.id] = monthlyRate;
                            rowData.totalMonthlyCost += monthlyRate;

                            childTotalCosts[child.id] = (childTotalCosts[child.id] || 0) + monthlyRate;
                            totalYearlyCaringCost += monthlyRate;
                        } else {
                            // Zero cost (e.g. in 0-12 bracket with 0 cost)
                            rowData.costs[child.id] = 0;

                            // Still track bracket if relevant? 
                            // Usually 0-12 is bracket index 0.
                            if (costBrackets[0].cost === 0 && ageInMonths <= 12) {
                                const shortLabel = costBrackets[0].label.replace(" months", "m").replace("months", "m");
                                childActiveBrackets[child.id].add(shortLabel);
                            }
                        }
                    } else {
                        // Not born yet
                        rowData.costs[child.id] = null; // Distinguish between 0 cost and not existing
                    }
                });
            } else {
                activeChildren.forEach(child => rowData.costs[child.id] = 0);
            }
            monthlyData.push(rowData);
        }

        return { monthlyData, activeChildren, childTotalCosts, totalYearlyCaringCost, childActiveBrackets };
    };

    const { monthlyData, activeChildren, childTotalCosts, totalYearlyCaringCost, childActiveBrackets } = calculateFinancialsForYear(selectedYear);

    // --- Cumulative & Annual Revenue Logic ---

    // 1. Annual Revenue per Child for Selected Year
    const totalAnnualRevenue = monthlyRevenue && monthlyRevenue[selectedYear]
        ? (Object.values(monthlyRevenue[selectedYear]).reduce((sum, m) => sum + (m.total || 0), 0) - (yearlyCPFCost[selectedYear] || 0))
        : 0;

    // 2. Cumulative Calculations (Start Year -> Selected Year)
    const childCumulativeCosts = {};
    // We don't really need childCumulativeRevenue map anymore if we just want total

    activeChildren.forEach(child => {
        childCumulativeCosts[child.id] = 0;
    });

    let totalCumulativeCaringCost = 0;
    let totalCumulativeRevenue = 0;

    for (let y = treeData.startYear; y <= selectedYear; y++) {
        // Cost
        const financials = calculateFinancialsForYear(y);
        Object.entries(financials.childTotalCosts).forEach(([id, cost]) => {
            if (childCumulativeCosts[id] !== undefined) {
                childCumulativeCosts[id] += cost;
            } else if (activeChildren.find(c => c.id === id)) {
                childCumulativeCosts[id] = cost;
            }
        });
        totalCumulativeCaringCost += financials.totalYearlyCaringCost;

        // Revenue (Sum all buffaloes for the year)
        if (monthlyRevenue && monthlyRevenue[y]) {
            const yearRev = Object.values(monthlyRevenue[y]).reduce((sum, m) => sum + (m.total || 0), 0);
            const yearCpf = yearlyCPFCost[y] || 0;
            totalCumulativeRevenue += (yearRev - yearCpf);
        }
    }


    // Calculate Totals for top cards need to rely on the same logic if we want to show totals
    // But matrix view is the priority now.

    const getTotalRevenue = () => {
        let r = 0;
        if (monthlyRevenue && monthlyRevenue[selectedYear]) {
            r = Object.values(monthlyRevenue[selectedYear]).reduce((sum, m) => sum + (m.total || 0), 0);
        } else {
            r = yearlyData ? (yearlyData.find(d => d.year === selectedYear)?.revenue || 0) : 0;
        }
        const deduction = yearlyCPFCost ? (yearlyCPFCost[selectedYear] || 0) : 0;
        return r - deduction;
    };

    const revenue = getTotalRevenue();
    const netValue = revenue - totalYearlyCaringCost;


    return (
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 shadow-xl border border-gray-200 mb-16 mx-4 lg:mx-20">
            <div className="bg-white rounded-2xl p-6 border border-gray-300 shadow-sm mb-8">

                {/* Header Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Select Year:</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="py-1 px-3 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {Array.from({ length: (endYear && endYear >= treeData.startYear) ? (endYear - treeData.startYear + 1) : 10 }, (_, i) => (
                                <option key={i} value={treeData.startYear + i}>
                                    {treeData.startYear + i} (Year {i + 1})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="text-xl font-bold text-gray-800">Cattle Growing Fund</div>
                    <div className="flex gap-4 text-sm font-semibold">
                        <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg">
                            Cost: {formatCurrency(totalYearlyCaringCost)}
                        </div>
                        <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg">
                            Net: {formatCurrency(netValue)}
                        </div>
                    </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-300">
                                <th className="py-4 px-4 text-center font-bold text-slate-800 text-base border-r border-slate-300 sticky left-0 bg-slate-100 z-10 w-32">
                                    Month
                                </th>
                                {activeChildren.map((child, index) => {
                                    // Format active brackets for display
                                    const brackets = Array.from(childActiveBrackets[child.id] || []).join(", ");

                                    return (
                                        <th
                                            key={child.id}
                                            className="py-3 px-3 text-center font-medium text-slate-800 border-r border-slate-300 min-w-[140px]"
                                            style={{
                                                borderRight: index === activeChildren.length - 1 ? '2px solid #cbd5e1' : '1px solid #e2e8f0'
                                            }}
                                        >
                                            <div className="font-bold text-slate-900 text-base">{child.name || child.id}</div>
                                            {brackets && (
                                                <div className="text-xs text-slate-500 mt-1 font-normal">
                                                    ({brackets})
                                                </div>
                                            )}
                                        </th>
                                    );
                                })}
                                <th className="py-4 px-4 text-center font-bold text-white text-base border-r border-slate-300 bg-slate-700 sticky right-0 z-10 min-w-[120px]">
                                    Total Monthly
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.map((row, idx) => (
                                <React.Fragment key={idx}>
                                    <tr className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                        <td className="py-4 px-4 text-center font-semibold text-slate-900 text-base border-r border-slate-300 border-b border-slate-200 bg-slate-100 sticky left-0">
                                            {row.monthName}
                                        </td>
                                        {activeChildren.map((child, childIndex) => (
                                            <td
                                                key={child.id}
                                                className={`py-4 px-3 text-center transition-all duration-200 border-b border-slate-200 ${row.costs[child.id] > 0 ? "bg-rose-50" : ""}`}
                                                style={{
                                                    borderRight: childIndex === activeChildren.length - 1 ? '2px solid #cbd5e1' : '1px solid #e2e8f0'
                                                }}
                                            >
                                                {row.isValidMonth && row.costs[child.id] !== null ? (
                                                    <span className={`font-semibold text-base ${row.costs[child.id] > 0 ? "text-rose-600" : "text-slate-400"}`}>
                                                        {formatCurrency(row.costs[child.id])}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="py-4 px-4 text-center font-semibold text-slate-900 text-base border-r border-slate-300 border-b border-slate-200 bg-slate-100 sticky right-0">
                                            {row.isValidMonth ? formatCurrency(row.totalMonthlyCost) : '-'}
                                        </td>
                                    </tr>
                                    {(idx + 1) % 3 === 0 && idx < 11 && (
                                        <tr key={`sep-${idx}`}>
                                            <td colSpan={activeChildren.length + 2} className="h-px bg-slate-300"></td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot>
                            {/* 1. Yearly Total Caring Cost */}
                            <tr className="bg-gradient-to-r from-slate-400 to-slate-500 text-white">
                                <td className="py-5 px-4 text-center font-bold text-base border-r border-slate-700 sticky left-0 bg-slate-500">
                                    Total Caring Cost
                                </td>
                                {activeChildren.map((child, index) => (
                                    <td
                                        key={child.id}
                                        className="py-4 px-3 text-center font-bold text-base bg-slate-500"
                                        style={{ borderRight: index === activeChildren.length - 1 ? '2px solid #475569' : '1px solid #64748b' }}
                                    >
                                        {formatCurrency(childTotalCosts[child.id] || 0)}
                                    </td>
                                ))}
                                <td className="py-5 px-4 text-center font-bold text-base bg-slate-950 sticky right-0">
                                    {formatCurrency(totalYearlyCaringCost)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Net Cost Summary Calculation */}
                <div className="mt-6 flex flex-col gap-4">
                    {/* Annual Summary */}
                    <div className="flex flex-col md:flex-row justify-end items-center gap-4 text-base">
                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-slate-600 font-bold">Total Caring Cost:</span>
                            <span className="text-rose-700 font-bold">{formatCurrency(totalYearlyCaringCost)}</span>

                            <span className="text-slate-400 px-1 font-bold">-</span>

                            <span className="text-slate-600 font-bold">Total Annual Revenue:</span>
                            <span className="text-emerald-700 font-bold">{formatCurrency(totalAnnualRevenue)}</span>

                            <span className="text-slate-400 px-1 font-bold">=</span>

                            <span className="text-slate-800 font-bold">Total Net Cost:</span>
                            <span className={`font-extrabold text-lg ${(totalYearlyCaringCost - totalAnnualRevenue) > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {formatCurrency(Math.abs(totalYearlyCaringCost - totalAnnualRevenue))}
                            </span>
                        </div>
                    </div>

                    {/* Cumulative Summary */}
                    <div className="flex flex-col md:flex-row justify-end items-center gap-4 text-base">
                        <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-xl border border-blue-200 shadow-sm">
                            <span className="text-slate-600 font-bold">Cumulative Caring Cost:</span>
                            <span className="text-rose-700 font-bold">{formatCurrency(totalCumulativeCaringCost)}</span>

                            <span className="text-slate-400 px-1 font-bold">-</span>

                            <span className="text-slate-600 font-bold">Cumulative Revenue:</span>
                            <span className="text-emerald-700 font-bold">{formatCurrency(totalCumulativeRevenue)}</span>

                            <span className="text-slate-400 px-1 font-bold">=</span>

                            <span className="text-slate-800 font-bold">Total Cumulative Net:</span>
                            <span className={`font-extrabold text-lg ${(totalCumulativeCaringCost - totalCumulativeRevenue) > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {formatCurrency(Math.abs(totalCumulativeCaringCost - totalCumulativeRevenue))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cost Bracket Legend Cards */}
                <div className="mt-8">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 px-2">Cost Breakdown by Age Group</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {[
                            { label: "0-12 months", cost: 0, avg: 0, color: "bg-slate-50 border-slate-200 text-slate-600" },
                            { label: "13-18 months", cost: 6000, avg: 1000, color: "bg-blue-50 border-blue-200 text-blue-700" },
                            { label: "19-24 months", cost: 8400, avg: 1400, color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
                            { label: "25-30 months", cost: 10800, avg: 1800, color: "bg-purple-50 border-purple-200 text-purple-700" },
                            { label: "31-36 months", cost: 15000, avg: 2500, color: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700" },
                            { label: "37+ months", cost: 0, avg: 0, color: "bg-emerald-50 border-emerald-200 text-emerald-700" }
                        ].map((bracket, i) => (
                            <div key={i} className={`p-4 rounded-xl border shadow-sm ${bracket.color} flex flex-col items-center justify-center text-center`}>
                                <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">{bracket.label}</div>
                                {bracket.cost > 0 ? (
                                    <>
                                        <div className="text-lg font-bold">{formatCurrency(bracket.cost)}</div>
                                        <div className="text-[10px] opacity-70">Avg {formatCurrency(bracket.avg)}/mo</div>
                                    </>
                                ) : (
                                    <div className="text-lg font-bold">Free</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-xs text-center text-gray-500">
                        * Costs are applied monthly based on the duration of the age bracket.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CattleGrowingFund;
