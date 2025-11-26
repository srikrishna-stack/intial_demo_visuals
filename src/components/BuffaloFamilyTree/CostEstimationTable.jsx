import React from 'react';
import { RevenueGraph, BuffaloGrowthGraph, NonProducingBuffaloGraph } from './GraphComponents';
import { formatCurrency, formatNumber } from './CommonComponents';

const CostEstimationTable = ({ 
  treeData, 
  activeGraph, 
  setActiveGraph, 
  setShowCostEstimation 
}) => {
  if (!treeData?.revenueData) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-2xl text-red-500 mb-4">Revenue data not available</div>
          <button
            onClick={() => setShowCostEstimation(false)}
            className="bg-red-500 text-white px-6 py-3 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { yearlyData, totalRevenue, totalUnits, totalMatureBuffaloYears } = treeData.revenueData;
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                     "July", "August", "September", "October", "November", "December"];

  // NEW: Investment and Asset Value Calculations
  const BUFFALO_PRICE = 175000; // ₹1.75 Lakhs per buffalo
  const CPF_PER_UNIT = 13000; // ₹13,000 CPF per unit (for 2 buffaloes)

  // Calculate initial investment
  const calculateInitialInvestment = () => {
    const buffaloCost = treeData.units * 2 * BUFFALO_PRICE;
    const cpfCost = treeData.units * CPF_PER_UNIT;
    return {
      buffaloCost,
      cpfCost,
      totalInvestment: buffaloCost + cpfCost
    };
  };

  const initialInvestment = calculateInitialInvestment();

  // NEW: Calculate Revenue Break-Even Analysis
  const calculateBreakEvenAnalysis = () => {
    let cumulativeRevenue = 0;
    const breakEvenData = [];
    let breakEvenYear = null;
    let breakEvenMonth = null;

    for (let i = 0; i < yearlyData.length; i++) {
      const yearData = yearlyData[i];
      cumulativeRevenue += yearData.revenue;
      
      const isBreakEven = cumulativeRevenue >= initialInvestment.totalInvestment && !breakEvenYear;
      
      if (isBreakEven) {
        breakEvenYear = yearData.year;
        // Estimate break-even month (simplified)
        const excess = cumulativeRevenue - initialInvestment.totalInvestment;
        const monthlyRevenue = yearData.revenue / 12;
        const monthsIntoYear = Math.floor(excess / monthlyRevenue);
        breakEvenMonth = monthsIntoYear;
      }

      breakEvenData.push({
        year: yearData.year,
        annualRevenue: yearData.revenue,
        cumulativeRevenue,
        isBreakEven,
        totalBuffaloes: yearData.totalBuffaloes,
        matureBuffaloes: yearData.matureBuffaloes
      });
    }

    return {
      breakEvenData,
      breakEvenYear,
      breakEvenMonth,
      initialInvestment: initialInvestment.totalInvestment,
      finalCumulativeRevenue: cumulativeRevenue
    };
  };

  const breakEvenAnalysis = calculateBreakEvenAnalysis();

  // NEW: Calculate Asset Market Value
  const calculateAssetMarketValue = () => {
    return yearlyData.map(yearData => ({
      year: yearData.year,
      totalBuffaloes: yearData.totalBuffaloes,
      assetValue: yearData.totalBuffaloes * BUFFALO_PRICE,
      //cpfValue: treeData.units * CPF_PER_UNIT, // CPF remains constant
      totalAssetValue: (yearData.totalBuffaloes * BUFFALO_PRICE) + (treeData.units * CPF_PER_UNIT)
    }));
  };

  const assetMarketValue = calculateAssetMarketValue();

  // Calculate herd statistics
  const herdStats = {
    startingBuffaloes: treeData.units * 2,
    finalBuffaloes: treeData.totalBuffaloes,
    growthMultiple: treeData.totalBuffaloes / (treeData.units * 2),
    averageMatureBuffaloes: totalMatureBuffaloYears / treeData.years,
    revenuePerBuffalo: totalRevenue / treeData.totalBuffaloes
  };

  // Function to convert number to words in Indian numbering system
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = Math.floor((num % 1000) / 100);
    const remainder = num % 100;
    
    let words = '';
    
    if (crore > 0) {
      words += numberToWords(crore) + ' Crore ';
    }
    
    if (lakh > 0) {
      words += numberToWords(lakh) + ' Lakh ';
    }
    
    if (thousand > 0) {
      words += numberToWords(thousand) + ' Thousand ';
    }
    
    if (hundred > 0) {
      words += ones[hundred] + ' Hundred ';
    }
    
    if (remainder > 0) {
      if (words !== '') words += 'and ';
      
      if (remainder < 10) {
        words += ones[remainder];
      } else if (remainder < 20) {
        words += teens[remainder - 10];
      } else {
        words += tens[Math.floor(remainder / 10)];
        if (remainder % 10 > 0) {
          words += ' ' + ones[remainder % 10];
        }
      }
    }
    
    return words.trim();
  };

  // Format price in words
  const formatPriceInWords = (amount) => {
    const integerPart = Math.floor(amount);
    const words = numberToWords(integerPart);
    return words + ' Rupees Only';
  };

  // NEW: Calculate monthly revenue based on staggered cycle
  const getMonthlyRevenueForBuffalo = (acquisitionMonth, currentMonth) => {
    const monthsSinceAcquisition = (2026 - 2026) * 12 + (currentMonth - acquisitionMonth);
    
    if (monthsSinceAcquisition < 2) {
      return 0; // Landing period
    }
    
    const productionMonth = monthsSinceAcquisition - 2;
    const cycleMonth = productionMonth % 12;
    
    if (cycleMonth < 5) {
      return 9000; // High revenue phase
    } else if (cycleMonth < 8) {
      return 6000; // Medium revenue phase
    } else {
      return 0; // Rest period
    }
  };

  // NEW: Calculate Year 1 detailed breakdown
  const calculateYear1Breakdown = () => {
    let buffalo1Revenue = 0;
    let buffalo2Revenue = 0;
    
    // Buffalo 1 (acquired January)
    for (let month = 0; month < 12; month++) {
      buffalo1Revenue += getMonthlyRevenueForBuffalo(0, month); // January acquisition
    }
    
    // Buffalo 2 (acquired July)
    for (let month = 0; month < 12; month++) {
      buffalo2Revenue += getMonthlyRevenueForBuffalo(6, month); // July acquisition
    }
    
    return {
      buffalo1: buffalo1Revenue,
      buffalo2: buffalo2Revenue,
      total: buffalo1Revenue + buffalo2Revenue
    };
  };

  const year1Breakdown = calculateYear1Breakdown();

  // NEW: Revenue Break-Even Analysis Component
  const RevenueBreakEvenAnalysis = () => (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-3xl p-10 shadow-2xl border border-purple-200 mb-16">
      <h2 className="text-4xl font-bold text-purple-800 mb-10 text-center flex items-center justify-center gap-4">
        <span className="text-5xl">💰</span>
        Revenue Break-Even Analysis
      </h2>

      {/* Initial Investment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-white rounded-2xl p-8 border border-blue-200 shadow-lg text-center">
          <div className="text-3xl font-bold text-blue-600 mb-4">
            {formatCurrency(initialInvestment.buffaloCost)}
          </div>
          <div className="text-lg font-semibold text-blue-700">Buffalo Cost</div>
          <div className="text-sm text-gray-600 mt-2">
            {treeData.units} units × 2 buffaloes × ₹1.75 Lakhs
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-green-200 shadow-lg text-center">
          <div className="text-3xl font-bold text-green-600 mb-4">
            {formatCurrency(initialInvestment.cpfCost)}
          </div>
          <div className="text-lg font-semibold text-green-700">CPF Cost</div>
          <div className="text-sm text-gray-600 mt-2">
            {treeData.units} units × ₹13,000
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg text-center">
          <div className="text-3xl font-bold mb-4">
            {formatCurrency(initialInvestment.totalInvestment)}
          </div>
          <div className="text-lg font-semibold opacity-90">Total Investment</div>
          <div className="text-sm opacity-80 mt-2">Initial Capital Outlay</div>
        </div>
      </div>

      {/* Break-Even Result */}
      {breakEvenAnalysis.breakEvenYear && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center shadow-2xl mb-8">
          <div className="text-4xl font-bold mb-4">🎉 Break-Even Achieved!</div>
          <div className="text-2xl font-semibold">
            Year {breakEvenAnalysis.breakEvenYear} ({breakEvenAnalysis.breakEvenMonth ? `Month ${breakEvenAnalysis.breakEvenMonth + 1}` : 'Full Year'})
          </div>
          <div className="text-lg opacity-90 mt-2">
            Cumulative Revenue: {formatCurrency(breakEvenAnalysis.finalCumulativeRevenue)}
          </div>
        </div>
      )}

      {/* Break-Even Timeline */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Break-Even Timeline</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Year</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Annual Revenue</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Cumulative Revenue</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {breakEvenAnalysis.breakEvenData.map((data, index) => (
                <tr key={data.year} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 border-b">
                    <div className="font-semibold text-gray-900">{data.year}</div>
                    <div className="text-sm text-gray-600">Year {index + 1}</div>
                  </td>
                  <td className="px-6 py-4 border-b font-semibold text-green-600">
                    {formatCurrency(data.annualRevenue)}
                  </td>
                  <td className="px-6 py-4 border-b font-semibold text-blue-600">
                    {formatCurrency(data.cumulativeRevenue)}
                  </td>
                  <td className="px-6 py-4 border-b">
                    {data.isBreakEven ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        ✓ Break-Even
                      </span>
                    ) : data.cumulativeRevenue >= initialInvestment.totalInvestment * 0.5 ? (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                        50% Recovered
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                        In Progress
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // NEW: Asset Market Value Component
  const AssetMarketValue = () => (
    <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-3xl p-10 shadow-2xl border border-orange-200 mb-16">
      <h2 className="text-4xl font-bold text-orange-800 mb-10 text-center flex items-center justify-center gap-4">
        <span className="text-5xl">🏦</span>
        Asset Market Value Analysis
      </h2>

      {/* Current vs Final Asset Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl p-8 border border-blue-200 shadow-lg text-center">
          <div className="text-3xl font-bold text-blue-600 mb-4">
            {formatCurrency(assetMarketValue[0]?.totalAssetValue || 0)}
          </div>
          <div className="text-lg font-semibold text-blue-700">Initial Asset Value</div>
          <div className="text-sm text-gray-600 mt-2">
            {assetMarketValue[0]?.totalBuffaloes || 0} buffaloes × ₹1.75 Lakhs 
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-lg text-center">
          <div className="text-3xl font-bold mb-4">
            {formatCurrency(assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)}
          </div>
          <div className="text-lg font-semibold opacity-90">Final Asset Value</div>
          <div className="text-sm opacity-80 mt-2">
            {assetMarketValue[assetMarketValue.length - 1]?.totalBuffaloes || 0} buffaloes × ₹1.75 Lakhs + CPF
          </div>
        </div>
      </div>

      {/* Asset Growth Multiple */}
      <div className="bg-white rounded-2xl p-6 border border-green-200 shadow-lg text-center mb-8">
        <div className="text-2xl font-bold text-green-600">
          Asset Growth: {((assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0) / (assetMarketValue[0]?.totalAssetValue || 1)).toFixed(1)}x
        </div>
        <div className="text-lg text-gray-600 mt-2">
          From {formatCurrency(assetMarketValue[0]?.totalAssetValue || 0)} to {formatCurrency(assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)}
        </div>
      </div>

      {/* Yearly Asset Value Table */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Yearly Asset Market Value</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-orange-50">
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Year</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Total Buffaloes</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Buffalo Value</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">CPF Value</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Total Asset Value</th>
              </tr>
            </thead>
            <tbody>
              {assetMarketValue.map((data, index) => (
                <tr key={data.year} className="hover:bg-orange-50 transition-colors">
                  <td className="px-6 py-4 border-b">
                    <div className="font-semibold text-gray-900">{data.year}</div>
                    <div className="text-sm text-gray-600">Year {index + 1}</div>
                  </td>
                  <td className="px-6 py-4 border-b font-semibold text-purple-600">
                    {formatNumber(data.totalBuffaloes)}
                  </td>
                  <td className="px-6 py-4 border-b font-semibold text-blue-600">
                    {formatCurrency(data.assetValue)}
                  </td>
                  <td className="px-6 py-4 border-b font-semibold text-green-600">
                    {formatCurrency(data.cpfValue)}
                  </td>
                  <td className="px-6 py-4 border-b font-semibold text-orange-600">
                    {formatCurrency(data.totalAssetValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Quick Stats Card Component
  const QuickStatsCard = () => (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl h-fit">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <span className="text-3xl">🚀</span>
        Investment Summary
      </h3>
      <div className="space-y-5">
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Total Investment:</span>
          <span className="font-bold text-xl">{formatCurrency(initialInvestment.totalInvestment)}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Total Revenue:</span>
          <span className="font-bold text-xl">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Final Asset Value:</span>
          <span className="font-bold text-xl">{formatCurrency(assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Break-Even Year:</span>
          <span className="font-bold text-xl">{breakEvenAnalysis.breakEvenYear || 'Not Reached'}</span>
        </div>
      </div>
    </div>
  );

  // Summary Cards Component
  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-blue-100 text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-5xl font-bold text-blue-600 mb-4">{treeData.units}</div>
        <div className="text-lg font-semibold text-gray-600 uppercase tracking-wide">Starting Units</div>
        <div className="text-sm text-gray-500 mt-2">{herdStats.startingBuffaloes} initial buffaloes</div>
        <div className="w-16 h-2 bg-blue-500 mx-auto mt-4 rounded-full"></div>
      </div>
      
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-green-100 text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-5xl font-bold text-green-600 mb-4">{treeData.years}</div>
        <div className="text-lg font-semibold text-gray-600 uppercase tracking-wide">Simulation Years</div>
        <div className="text-sm text-gray-500 mt-2">Revenue generation period</div>
        <div className="w-16 h-2 bg-green-500 mx-auto mt-4 rounded-full"></div>
      </div>
      
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-purple-100 text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-5xl font-bold text-purple-600 mb-4">{treeData.totalBuffaloes}</div>
        <div className="text-lg font-semibold text-gray-600 uppercase tracking-wide">Final Herd Size</div>
        <div className="text-sm text-gray-500 mt-2">{herdStats.growthMultiple.toFixed(1)}x growth</div>
        <div className="w-16 h-2 bg-purple-500 mx-auto mt-4 rounded-full"></div>
      </div>
      
      <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-8 shadow-2xl text-white text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-4xl font-bold mb-4">{formatCurrency(totalRevenue)}</div>
        <div className="text-lg font-semibold opacity-90 uppercase tracking-wide">Total Revenue</div>
        <div className="text-sm opacity-80 mt-2">From entire herd growth</div>
        <div className="w-16 h-2 bg-white opacity-50 mx-auto mt-4 rounded-full"></div>
      </div>
    </div>
  );

  // Production Schedule Component
  const ProductionSchedule = () => (
    <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 mb-16">
      <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center flex items-center justify-center gap-4">
        <span className="text-5xl">📊</span>
        Staggered Revenue Distribution Schedule
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 text-white text-center transform hover:scale-105 transition-transform duration-300 shadow-2xl">
          <div className="text-2xl font-bold mb-4">High Revenue Phase</div>
          <div className="text-5xl font-bold mb-4">₹9,000</div>
          <div className="text-xl opacity-90">per month</div>
          <div className="text-base opacity-80 mt-4">5 months duration</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white text-center transform hover:scale-105 transition-transform duration-300 shadow-2xl">
          <div className="text-2xl font-bold mb-4">Medium Revenue Phase</div>
          <div className="text-5xl font-bold mb-4">₹6,000</div>
          <div className="text-xl opacity-90">per month</div>
          <div className="text-base opacity-80 mt-4">3 months duration</div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-3xl p-8 text-white text-center transform hover:scale-105 transition-transform duration-300 shadow-2xl">
          <div className="text-2xl font-bold mb-4">Rest Period</div>
          <div className="text-5xl font-bold mb-4">₹0</div>
          <div className="text-xl opacity-90">per month</div>
          <div className="text-base opacity-80 mt-4">4 months duration</div>
        </div>
      </div>
      
      <div className="text-center bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
        <div className="text-2xl font-bold text-yellow-800">
          🎯 Staggered 6-Month Cycles | 📈 Year 1 Revenue: ₹99,000 per Unit
        </div>
        <div className="text-lg text-yellow-700 mt-2">
          Each buffalo follows independent 12-month cycle: 2m rest + 5m high + 3m medium + 2m rest
        </div>
      </div>
    </div>
  );

  // Enhanced Revenue Table Component
  const RevenueTable = () => (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-16">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-10 text-white">
        <div className="h-10"></div>
        <h2 className="text-4xl font-bold mb-4 flex items-center gap-4">
          <span className="text-5xl">💰</span>
          Annual Herd Revenue Breakdown
        </h2>
        <p className="text-blue-100 text-xl">Detailed year-by-year financial analysis based on actual herd growth with staggered cycles</p>
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
                <div className="text-xl">Mature</div>
                <div className="text-base font-normal text-gray-500">Buffaloes</div>
              </th>
              <th className="px-10 py-8 text-left text-lg font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <div className="text-xl">Annual Revenue</div>
                <div className="text-base font-normal text-gray-500">Current Year</div>
              </th>
              <th className="px-10 py-8 text-left text-lg font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <div className="text-xl">Cumulative Revenue</div>
                <div className="text-base font-normal text-gray-500">Running Total</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {yearlyData.map((data, index) => {
              const cumulativeRevenue = yearlyData
                .slice(0, index + 1)
                .reduce((sum, item) => sum + item.revenue, 0);
              
              const growthRate = index > 0 
                ? ((data.revenue - yearlyData[index-1].revenue) / yearlyData[index-1].revenue * 100).toFixed(1)
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
                    <div className="text-3xl font-bold text-blue-600">
                      {formatNumber(data.matureBuffaloes)}
                    </div>
                    <div className="text-base text-gray-500 mt-2">mature buffaloes</div>
                  </td>
                  <td className="px-10 py-8 whitespace-nowrap">
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(data.revenue)}
                    </div>
                    {growthRate > 0 && (
                      <div className="text-base text-green-500 font-semibold mt-2 flex items-center gap-2">
                        <span className="text-xl">↑</span>
                        {growthRate}% growth
                      </div>
                    )}
                  </td>
                  <td className="px-10 py-8 whitespace-nowrap">
                    <div className="text-3xl font-bold text-indigo-600">
                      {formatCurrency(cumulativeRevenue)}
                    </div>
                    <div className="text-base text-gray-500 mt-2">
                      {((cumulativeRevenue / totalRevenue) * 100).toFixed(1)}% of total
                    </div>
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
                <div className="text-base opacity-80">{treeData.years} Years</div>
              </td>
              <td className="px-10 py-8">
                <div className="text-2xl font-bold">
                  {formatNumber(yearlyData[yearlyData.length - 1]?.totalBuffaloes || 0)}
                </div>
                <div className="text-base opacity-80">final herd size</div>
              </td>
              <td className="px-10 py-8">
                <div className="text-2xl font-bold">
                  {formatNumber(totalMatureBuffaloYears)}
                </div>
                <div className="text-base opacity-80">mature buffalo years</div>
              </td>
              <td className="px-10 py-8">
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <div className="text-base opacity-80">total revenue</div>
              </td>
              <td className="px-10 py-8">
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <div className="text-base opacity-80">final cumulative</div>
              </td>
            </tr>
            <div className="h-10"></div>
          </tfoot>
        </table>
      </div>
    </div>
  );

  // Additional Information Component
  const AdditionalInformation = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
      
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-10 border border-yellow-200 shadow-2xl">
        <div className="h-10"></div>
        <h3 className="text-3xl font-bold text-yellow-800 mb-8 flex items-center gap-4">
          <span className="text-4xl">💡</span>
          Investment Highlights
        </h3>
        <div className="space-y-6">
          {[
            { title: "Initial Investment", description: `${formatCurrency(initialInvestment.totalInvestment)} (Buffaloes: ${formatCurrency(initialInvestment.buffaloCost)} + CPF: ${formatCurrency(initialInvestment.cpfCost)})` },
            { title: "Break-Even Point", description: breakEvenAnalysis.breakEvenYear ? `Year ${breakEvenAnalysis.breakEvenYear}` : 'Not reached within simulation period' },
            { title: "Asset Growth", description: `${((assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0) / (assetMarketValue[0]?.totalAssetValue || 1)).toFixed(1)}x growth in ${treeData.years} years` },
            { title: "Total Returns", description: `Revenue: ${formatCurrency(totalRevenue)} + Final Assets: ${formatCurrency(assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)}` },
            { title: "Herd Growth", description: `${herdStats.growthMultiple.toFixed(1)}x herd growth (${herdStats.startingBuffaloes} → ${treeData.totalBuffaloes} buffaloes)` }
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-yellow-100 shadow-lg">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {index + 1}
              </div>
              <div>
                <div className="font-semibold text-yellow-800 text-xl">{item.title}</div>
                <div className="text-yellow-600 text-lg">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="h-10"></div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-10 border border-blue-200 shadow-2xl">
        <h3 className="text-3xl font-bold text-blue-800 mb-8 flex items-center gap-4">
          <span className="text-4xl">📈</span>
          Financial Performance
        </h3>
        <div className="space-y-8">
          {[
            { value: formatCurrency(totalRevenue / treeData.years), label: "Average Annual Revenue", color: "blue" },
            { value: formatCurrency(herdStats.revenuePerBuffalo), label: "Revenue per Buffalo", color: "green" },
            { value: `${herdStats.growthMultiple.toFixed(1)}x`, label: "Herd Growth Multiple", color: "purple" },
            { value: formatCurrency((totalRevenue + (assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)) / initialInvestment.totalInvestment), label: "ROI Multiple", color: "orange" }
          ].map((item, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 border border-blue-100 shadow-lg">
              <div className="text-4xl font-bold text-blue-600 mb-4">
                {item.value}
              </div>
              <div className="text-blue-700 font-semibold text-xl">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-8xl mx-auto">
          <div className="h-5"></div>
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-12 py-8 rounded-3xl shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
              <h1 className="text-5xl font-bold mb-4">🐃 Buffalo Herd Investment Analysis</h1>
              <h2 className="text-3xl font-semibold opacity-90">Complete Financial Projection with Break-Even & Asset Valuation</h2>
            </div>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Comprehensive financial analysis for {treeData.units} starting unit{treeData.units > 1 ? 's' : ''} over {treeData.years} years
              <br />
              <span className="text-lg text-gray-500">
                Staggered 6-month cycles | Initial Investment: {formatCurrency(initialInvestment.totalInvestment)} | Final Herd: {treeData.totalBuffaloes} buffaloes
              </span>
            </p>
          </div>
          <div className="h-5"></div>

          <SummaryCards />
          <div className="h-10"></div>

          {/* NEW: Revenue Break-Even Analysis */}
          <RevenueBreakEvenAnalysis />
          <div className="h-10"></div>

          {/* NEW: Asset Market Value */}
          <AssetMarketValue />
          <div className="h-10"></div>

          {/* Enhanced GRAPHS SECTION */}
          <div className="mb-16">
            <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100">
              <div className="pt-16 pb-8">
                <div className="h-5"></div>
                <h2 className="text-5xl font-bold text-gray-800 text-center flex items-center justify-center gap-6">
                  Herd Performance Analytics
                </h2>
              </div>
              <div className="h-5"></div>

              {/* Enhanced Graph Navigation */}
              <div className="flex flex-wrap gap-6 justify-center mb-12 mt-12">
                {[
                  { key: "revenue", label: "💰 Revenue Trends", color: "green" },
                  { key: "buffaloes", label: "🐃 Herd Growth", color: "purple" },
                  { key: "nonproducing", label: "📊 Production Analysis", color: "orange" }
                ].map((button) => (
                  <button
                    key={button.key}
                    onClick={() => setActiveGraph(button.key)}
                    className={`
                      px-12 py-8 rounded-3xl font-bold text-2xl transition-all transform hover:scale-110 
                      min-w-[280px] min-h-[120px] flex items-center justify-center
                      ${activeGraph === button.key 
                        ? `bg-gradient-to-r from-${button.color}-500 to-${
                            button.color === 'green' ? 'emerald' : 
                            button.color === 'purple' ? 'indigo' : 'red'
                          }-600 text-white shadow-2xl border-4 border-${button.color}-300` 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-xl border-4 border-gray-200"
                      }
                    `}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
              <div className="h-10"></div>

              {/* Enhanced Graph Display with Side Padding */}
              <div className="px-6 md:px-12 lg:px-16 xl:px-30">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 xl:gap-16">
                  <div className={activeGraph === "nonproducing" ? "xl:col-span-2" : "xl:col-span-2"}>
                    {activeGraph === "revenue" && <RevenueGraph yearlyData={yearlyData} />}
                    {activeGraph === "buffaloes" && <BuffaloGrowthGraph yearlyData={yearlyData} />}
                    {activeGraph === "nonproducing" && (
                      <div className="xl:col-span-2">
                        <NonProducingBuffaloGraph yearlyData={yearlyData} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-10"></div>

          {/* Price in Words */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-12 shadow-2xl mb-16 text-center mt-8">
            <div className="text-white">
              <div className="text-xl font-semibold opacity-90 mb-6 uppercase tracking-wider">Total Investment Returns in Words</div>
              <div className="text-3xl md:text-4xl font-bold bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-white/20 leading-relaxed">
                {formatPriceInWords(totalRevenue + (assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0))}
              </div>
              <div className="text-lg opacity-90 mt-4">
                (Revenue: {formatCurrency(totalRevenue)} + Final Assets: {formatCurrency(assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)})
              </div>
            </div>
          </div>
          <div className="h-10"></div>
          <ProductionSchedule />
          <div className="h-10"></div>
          <RevenueTable />
          <div className="h-10"></div>
          <AdditionalInformation />
          <div className="h-10"></div>

          {/* Action Buttons */}
          <div className="text-center mb-12">
            <button
              onClick={() => setShowCostEstimation(false)}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-16 py-5 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl"
            >
              ← Back to Family Tree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostEstimationTable;