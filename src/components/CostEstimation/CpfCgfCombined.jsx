import React, { useState } from 'react';

const CpfCgfCombined = ({
    treeData,
    buffaloDetails,
    formatCurrency,
    calculateAgeInMonths,
    monthNames,
    startYear,
    endYear,
    endMonth
}) => {
    const [selectedYear, setSelectedYear] = useState(startYear);

    // --- Helper Logic ---

    // 1. CGF Logic (Caring Cost)
    const calculateCgfForMonth = (year, month) => {
        let totalCost = 0;
        const currentAbsoluteMonth = year * 12 + month;
        const absoluteStartMonth = startYear * 12 + (treeData.startMonth || 0);

        // Filter children (Gen > 0)
        Object.values(buffaloDetails).forEach(buffalo => {
            if (buffalo.generation > 0) {
                const buffaloAbsoluteBirth = buffalo.birthYear * 12 + (buffalo.birthMonth || 0);

                if (buffaloAbsoluteBirth <= currentAbsoluteMonth) {
                    const ageInMonths = (currentAbsoluteMonth - buffaloAbsoluteBirth) + 1;

                    let monthlyCost = 0;
                    if (ageInMonths > 12 && ageInMonths <= 18) monthlyCost = 1000;
                    else if (ageInMonths > 18 && ageInMonths <= 24) monthlyCost = 1400;
                    else if (ageInMonths > 24 && ageInMonths <= 30) monthlyCost = 1800;
                    else if (ageInMonths > 30 && ageInMonths <= 36) monthlyCost = 2500;

                    totalCost += monthlyCost;
                }
            }
        });
        return totalCost;
    };

    // 2. CPF Logic
    const isCpfApplicableForMonth = (buffalo, year, month) => {
        // Global Limit Check
        const absoluteStart = startYear * 12 + (treeData.startMonth || 0);
        const absoluteEnd = absoluteStart + (treeData.years * 12) - 1;
        const currentAbsolute = year * 12 + month;

        if (currentAbsolute < absoluteStart || currentAbsolute > absoluteEnd) return false;

        // Gen 0
        if (buffalo.generation === 0) {
            const isFirstInUnit = (buffalo.id.charCodeAt(0) - 65) % 2 === 0; // A, C, E...

            // Presence Check
            const buffaloAbsoluteAcq = buffalo.absoluteAcquisitionMonth !== undefined
                ? buffalo.absoluteAcquisitionMonth
                : (startYear * 12 + (buffalo.acquisitionMonth || 0)); // Fallback approximation

            if (currentAbsolute < buffaloAbsoluteAcq) return false;

            if (isFirstInUnit) {
                return true; // Type A pays from start
            } else {
                // Type B: Free Period Check (Months 6-17 relative to simulation start)
                // Logic: B is acquired 6 months after simulation start.
                // It gets 1 year free.
                // So free from Month 6 to Month 17 (inclusive of 6, exclusive of 18? or inclusive 17)
                // Existing logic: monthsSinceStart >= 6 && monthsSinceStart < 18
                const monthsSinceStart = currentAbsolute - absoluteStart;
                const isFreePeriod = monthsSinceStart >= 6 && monthsSinceStart < 18;
                return !isFreePeriod;
            }
        } else {
            // Offspring: Pay >= 24 months
            const ageInMonths = calculateAgeInMonths(buffalo, year, month);
            return ageInMonths >= 24;
        }
    };

    const calculateCpfForMonth = (year, month) => {
        const CPF_PER_MONTH = 13000 / 12;
        let totalCost = 0;

        Object.values(buffaloDetails).forEach(buffalo => {
            if (isCpfApplicableForMonth(buffalo, year, month)) {
                totalCost += CPF_PER_MONTH;
            }
        });

        return totalCost;
    };

    // --- Generate Table Data ---
    const tableData = [];
    let yearlyCgf = 0;
    let yearlyCpf = 0;
    let yearlyTotal = 0;

    // Determine valid months for selected year
    const startM = (selectedYear === startYear) ? (treeData.startMonth || 0) : 0;
    let endM = 11;
    if (selectedYear === endYear && endMonth !== undefined) {
        endM = endMonth;
    }

    for (let m = 0; m < 12; m++) {
        const isValid = m >= startM && m <= endM;
        const cgf = isValid ? calculateCgfForMonth(selectedYear, m) : 0;
        const cpf = isValid ? calculateCpfForMonth(selectedYear, m) : 0;
        const total = cgf + cpf;

        yearlyCgf += cgf;
        yearlyCpf += cpf;
        yearlyTotal += total;

        tableData.push({
            monthName: monthNames[m],
            isValid,
            cgf,
            cpf,
            total
        });
    }

    // --- Cumulative Calculations ---
    let cumulativeCgf = 0;
    let cumulativeCpf = 0;

    for (let y = startYear; y <= selectedYear; y++) {
        // Determine valid months for year y
        const sM = (y === startYear) ? (treeData.startMonth || 0) : 0;
        let eM = 11;
        if (y === endYear && endMonth !== undefined) {
            eM = endMonth;
        }

        for (let m = 0; m < 12; m++) {
            if (m >= sM && m <= eM) {
                cumulativeCgf += calculateCgfForMonth(y, m);
                cumulativeCpf += calculateCpfForMonth(y, m);
            }
        }
    }
    const cumulativeTotal = cumulativeCgf + cumulativeCpf;

    return (
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 shadow-xl border border-gray-200 mb-16 mx-4 lg:mx-20">
            <div className="bg-white rounded-2xl p-6 border border-gray-300 shadow-sm mb-8">

                {/* Controls & Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Select Year:</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="py-1 px-3 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {Array.from({ length: (endYear && endYear >= startYear) ? (endYear - startYear + 1) : 10 }, (_, i) => (
                                <option key={i} value={startYear + i}>
                                    {startYear + i} (Year {i + 1})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="text-xl font-bold text-gray-800">CPF + CGF Analysis</div>
                    <div className="flex gap-4 text-sm font-semibold">
                        <div className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">
                            Total: {formatCurrency(yearlyTotal)}
                        </div>
                    </div>
                </div>



                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-300">
                                <th className="py-4 px-4 text-center font-bold text-slate-800 text-base border-r border-slate-300 w-1/4">Month</th>
                                <th className="py-4 px-4 text-center font-bold text-amber-700 text-base border-r border-slate-300 w-1/4">CPF Cost</th>
                                <th className="py-4 px-4 text-center font-bold text-rose-700 text-base border-r border-slate-300 w-1/4">CGF Cost</th>
                                <th className="py-4 px-4 text-center font-bold text-slate-900 text-base w-1/4">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, idx) => (
                                <tr key={idx} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                    <td className="py-4 px-4 text-center font-semibold text-slate-900 text-base border-r border-slate-300 border-b border-slate-200">
                                        {row.monthName}
                                    </td>
                                    <td className="py-4 px-4 text-center font-medium text-amber-700 text-base border-r border-slate-300 border-b border-slate-200">
                                        {row.isValid ? formatCurrency(row.cpf) : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-center font-medium text-rose-700 text-base border-r border-slate-300 border-b border-slate-200">
                                        {row.isValid ? formatCurrency(row.cgf) : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-center font-bold text-slate-900 text-base border-b border-slate-200">
                                        {row.isValid ? formatCurrency(row.total) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-700 text-white">
                                <td className="py-4 px-4 text-center font-bold text-base border-r border-slate-600">Yearly Total</td>
                                <td className="py-4 px-4 text-center font-bold text-amber-400 text-base border-r border-slate-600">{formatCurrency(yearlyCpf)}</td>
                                <td className="py-4 px-4 text-center font-bold text-rose-400 text-base border-r border-slate-600">{formatCurrency(yearlyCgf)}</td>
                                <td className="py-4 px-4 text-center font-bold text-white text-base">{formatCurrency(yearlyTotal)}</td>
                            </tr>
                            <tr className="bg-slate-800 text-white">
                                <td className="py-4 px-4 text-center font-bold text-base border-r border-slate-600">Cumulative Total (Until {selectedYear})</td>
                                <td className="py-4 px-4 text-center font-bold text-amber-500 text-base border-r border-slate-600">{formatCurrency(cumulativeCpf)}</td>
                                <td className="py-4 px-4 text-center font-bold text-rose-500 text-base border-r border-slate-600">{formatCurrency(cumulativeCgf)}</td>
                                <td className="py-4 px-4 text-center font-bold text-white text-base">{formatCurrency(cumulativeTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>


            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 shadow-sm">
                    <div className="text-3xl font-bold text-amber-700 mb-2">{formatCurrency(cumulativeCpf)}</div>
                    <div className="text-lg font-semibold text-amber-800">Cumulative CPF Cost</div>
                    <div className="text-sm text-amber-600 mt-1">Until {selectedYear}</div>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 border border-rose-200 shadow-sm">
                    <div className="text-3xl font-bold text-rose-700 mb-2">{formatCurrency(cumulativeCgf)}</div>
                    <div className="text-lg font-semibold text-rose-800">Cumulative CGF Cost</div>
                    <div className="text-sm text-rose-600 mt-1">Until {selectedYear}</div>
                </div>
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-6 border border-slate-300 shadow-sm">
                    <div className="text-3xl font-bold text-slate-800 mb-2">{formatCurrency(cumulativeTotal)}</div>
                    <div className="text-lg font-semibold text-slate-900">Cumulative Combined Total</div>
                    <div className="text-sm text-slate-600 mt-1">Until {selectedYear}</div>
                </div>
            </div>
        </div>
    );
};

export default CpfCgfCombined;
