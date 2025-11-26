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

  // Quick Stats Card Component
  const QuickStatsCard = () => (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl h-fit">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <span className="text-3xl">🚀</span>
        Herd Revenue Statistics
      </h3>
      <div className="space-y-5">
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Total Herd Revenue:</span>
          <span className="font-bold text-xl">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Final Herd Size:</span>
          <span className="font-bold text-xl">{formatNumber(treeData.totalBuffaloes)} Buffaloes</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Growth Multiple:</span>
          <span className="font-bold text-xl">{herdStats.growthMultiple.toFixed(1)}x</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Year 1 Revenue:</span>
          <span className="font-bold text-xl">{formatCurrency(yearlyData[0]?.revenue || 0)}</span>
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
          Staggered Cycle System
        </h3>
        <div className="space-y-6">
          {[
            { title: "Buffalo 1 Cycle", description: "Acquired January: 2m rest → 5m high (₹9k) → 3m medium (₹6k) → 2m rest" },
            { title: "Buffalo 2 Cycle", description: "Acquired July: 2m rest → 5m high (₹9k) → 3m medium (₹6k) → 2m rest" },
            { title: "Year 1 Revenue", description: "Buffalo 1: ₹63,000 + Buffalo 2: ₹36,000 = ₹99,000 total" },
            { title: "Cycle Inheritance", description: "Offspring inherit parent's acquisition month and cycle pattern" },
            { title: "Herd Growth", description: `${herdStats.growthMultiple.toFixed(1)}x growth in ${treeData.years} years` }
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
          Investment Insights
        </h3>
        <div className="space-y-8">
          {[
            { value: formatCurrency(totalRevenue / treeData.years), label: "Average Annual Revenue", color: "blue" },
            { value: formatCurrency(herdStats.revenuePerBuffalo), label: "Revenue per Buffalo", color: "green" },
            { value: `${herdStats.growthMultiple.toFixed(1)}x`, label: "Herd Growth Multiple", color: "purple" },
            { value: formatCurrency(yearlyData[0]?.revenue || 0), label: "Year 1 Revenue", color: "orange" }
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
              <h1 className="text-5xl font-bold mb-4">🐃 Buffalo Herd Investment Revenue</h1>
              <h2 className="text-3xl font-semibold opacity-90">Staggered Cycle System - Year 1: ₹99,000 per Unit</h2>
            </div>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Detailed financial analysis for {treeData.units} starting unit{treeData.units > 1 ? 's' : ''} over {treeData.years} years
              <br />
              <span className="text-lg text-gray-500">
                Staggered 6-month cycles | Herd growth: {herdStats.startingBuffaloes} → {treeData.totalBuffaloes} buffaloes
              </span>
            </p>
          </div>
          <div className="h-5"></div>

          <SummaryCards />
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
              <div className="text-xl font-semibold opacity-90 mb-6 uppercase tracking-wider">Total Herd Revenue in Words</div>
              <div className="text-3xl md:text-4xl font-bold bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-white/20 leading-relaxed">
                {formatPriceInWords(totalRevenue)}
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