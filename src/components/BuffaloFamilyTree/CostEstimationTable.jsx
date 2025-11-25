import React from 'react';
import { RevenueGraph, MilkProductionGraph, BuffaloGrowthGraph, NonProducingBuffaloGraph } from './GraphComponents';
import { formatCurrency, formatNumber } from './CommonComponents';

const CostEstimationTable = ({ 
  treeData, 
  activeGraph, 
  setActiveGraph, 
  setShowCostEstimation 
}) => {
  if (!treeData?.milkData) return null;

  const { yearlyData, totalRevenue, totalLiters } = treeData.milkData;

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

  // Quick Stats Card Component
  const QuickStatsCard = () => (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl h-fit">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <span className="text-3xl">🚀</span>
        Quick Statistics
      </h3>
      <div className="space-y-5">
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Average Annual Revenue:</span>
          <span className="font-bold text-xl">{formatCurrency(totalRevenue / treeData.years)}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Total Milk Production:</span>
          <span className="font-bold text-xl">{formatNumber(totalLiters)} L</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Revenue per Buffalo:</span>
          <span className="font-bold text-xl">{formatCurrency(totalRevenue / treeData.totalBuffaloes)}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
          <span className="text-lg">Milk per Buffalo:</span>
          <span className="font-bold text-xl">{formatNumber(totalLiters / treeData.totalBuffaloes)} L</span>
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
        <div className="w-16 h-2 bg-blue-500 mx-auto mt-4 rounded-full"></div>
      </div>
      
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-green-100 text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-5xl font-bold text-green-600 mb-4">{treeData.years}</div>
        <div className="text-lg font-semibold text-gray-600 uppercase tracking-wide">Simulation Years</div>
        <div className="w-16 h-2 bg-green-500 mx-auto mt-4 rounded-full"></div>
      </div>
      
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-purple-100 text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-5xl font-bold text-purple-600 mb-4">{treeData.totalBuffaloes}</div>
        <div className="text-lg font-semibold text-gray-600 uppercase tracking-wide">Total Buffaloes</div>
        <div className="w-16 h-2 bg-purple-500 mx-auto mt-4 rounded-full"></div>
      </div>
      
      <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-8 shadow-2xl text-white text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-4xl font-bold mb-4">{formatCurrency(totalRevenue)}</div>
        <div className="text-lg font-semibold opacity-90 uppercase tracking-wide">Total Revenue</div>
        <div className="w-16 h-2 bg-white opacity-50 mx-auto mt-4 rounded-full"></div>
      </div>
    </div>
  );

  // Production Schedule Component
  const ProductionSchedule = () => (
    <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 mb-16">
      <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center flex items-center justify-center gap-4">
        <span className="text-5xl">📊</span>
        Milk Production Schedule
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white text-center transform hover:scale-105 transition-transform duration-300 shadow-2xl">
          <div className="text-2xl font-bold mb-4">Jan - May</div>
          <div className="text-5xl font-bold mb-4">10L/day</div>
          <div className="text-xl opacity-90">1,500L Total</div>
          <div className="text-base opacity-80 mt-4">High Production Phase</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 text-white text-center transform hover:scale-105 transition-transform duration-300 shadow-2xl">
          <div className="text-2xl font-bold mb-4">Jun - Aug</div>
          <div className="text-5xl font-bold mb-4">5L/day</div>
          <div className="text-xl opacity-90">450L Total</div>
          <div className="text-base opacity-80 mt-4">Medium Production Phase</div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-3xl p-8 text-white text-center transform hover:scale-105 transition-transform duration-300 shadow-2xl">
          <div className="text-2xl font-bold mb-4">Sep - Dec</div>
          <div className="text-5xl font-bold mb-4">Rest</div>
          <div className="text-xl opacity-90">0L Total</div>
          <div className="text-base opacity-80 mt-4">Recovery Period</div>
        </div>
      </div>
      
      <div className="text-center bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
        <div className="text-2xl font-bold text-yellow-800">
          🎯 Fixed Price: ₹100 per liter | 📈 Annual Production per Buffalo: 1,950 Liters
        </div>
      </div>
    </div>
  );

  // Revenue Table Component
  const RevenueTable = () => (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-16">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-10 text-white">
        <h2 className="text-4xl font-bold mb-4 flex items-center gap-4">
          <span className="text-5xl">💰</span>
          Annual Revenue Breakdown
        </h2>
        <p className="text-blue-100 text-xl">Detailed year-by-year financial analysis with cumulative growth tracking</p>
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
                <div className="text-xl">Producing</div>
                <div className="text-base font-normal text-gray-500">Buffaloes</div>
              </th>
              <th className="px-10 py-8 text-left text-lg font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <div className="text-xl">Milk Production</div>
                <div className="text-base font-normal text-gray-500">Liters</div>
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
                      {formatNumber(data.producingBuffaloes)}
                    </div>
                    <div className="text-base text-gray-500 mt-2">buffaloes</div>
                  </td>
                  <td className="px-10 py-8 whitespace-nowrap">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatNumber(data.liters)}
                    </div>
                    <div className="text-base text-gray-500 mt-2">liters</div>
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
          <tfoot>
            <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <td className="px-10 py-8">
                <div className="text-2xl font-bold">Grand Total</div>
                <div className="text-base opacity-80">{treeData.years} Years</div>
              </td>
              <td className="px-10 py-8">
                <div className="text-2xl font-bold">
                  {formatNumber(yearlyData.reduce((sum, data) => sum + data.producingBuffaloes, 0))}
                </div>
                <div className="text-base opacity-80">cumulative</div>
              </td>
              <td className="px-10 py-8">
                <div className="text-2xl font-bold">{formatNumber(totalLiters)} L</div>
                <div className="text-base opacity-80">total milk</div>
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
          </tfoot>
        </table>
      </div>
    </div>
  );

  // Additional Information Component
  const AdditionalInformation = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-10 border border-yellow-200 shadow-2xl">
        <h3 className="text-3xl font-bold text-yellow-800 mb-8 flex items-center gap-4">
          <span className="text-4xl">💡</span>
          Key Business Assumptions
        </h3>
        <div className="space-y-6">
          {[
            { title: "Milk Production Start", description: "Buffaloes begin milk production at age 3" },
            { title: "Annual Reproduction", description: "Each mature buffalo gives birth annually" },
            { title: "Fixed Pricing", description: "Milk price locked at ₹100 per liter" },
            { title: "Consistent Production", description: "Stable production schedule maintained throughout" }
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
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-10 border border-blue-200 shadow-2xl">
        <h3 className="text-3xl font-bold text-blue-800 mb-8 flex items-center gap-4">
          <span className="text-4xl">📈</span>
          Investment Insights
        </h3>
        <div className="space-y-8">
          {[
            { value: formatCurrency(totalRevenue / treeData.years), label: "Average Annual Revenue", color: "blue" },
            { value: formatCurrency(totalRevenue / treeData.totalBuffaloes), label: "Revenue per Buffalo", color: "green" },
            { value: `${formatNumber(totalLiters / treeData.totalBuffaloes)}L`, label: "Milk Yield per Buffalo", color: "purple" }
          ].map((item, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 border border-blue-100 shadow-lg">
              <div className={`text-4xl font-bold text-${item.color}-600 mb-4`}>
                {item.value}
              </div>
              <div className={`text-${item.color}-700 font-semibold text-xl`}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-6">
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-12 py-8 rounded-3xl shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
              <h1 className="text-5xl font-bold mb-4">🐃 Buffalo Milk Production</h1>
              <h2 className="text-3xl font-semibold opacity-90">Comprehensive Revenue Estimation Report</h2>
            </div>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Detailed financial analysis for {treeData.units} starting unit{treeData.units > 1 ? 's' : ''} over {treeData.years} years simulation period
            </p>
          </div>

          <SummaryCards />

          {/* Enhanced GRAPHS SECTION */}
          <div className="mb-16">
            <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100">
              <div className="pt-16 pb-8">
             <h2 className="text-5xl font-bold text-gray-800 text-center flex items-center justify-center gap-6">
              Performance Analytics & Trends
              </h2>
              </div>

              
              {/* Enhanced Graph Navigation */}
              <div className="flex flex-wrap gap-6 justify-center mb-12 mt-12">
                {[
                  { key: "revenue", label: "💰 Revenue Trends", color: "green" },
                  { key: "milk", label: "🥛 Milk Production", color: "blue" },
                  { key: "buffaloes", label: "🐃 Population Growth", color: "purple" },
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
                                button.color === 'blue' ? 'cyan' : 
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

              {/* Enhanced Graph Display */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className={`${activeGraph === "nonproducing" ? "xl:col-span-3" : "xl:col-span-2"}`}>
                  {activeGraph === "revenue" && <RevenueGraph yearlyData={yearlyData} />}
                  {activeGraph === "milk" && <MilkProductionGraph yearlyData={yearlyData} />}
                  {activeGraph === "buffaloes" && <BuffaloGrowthGraph yearlyData={yearlyData} />}
                  {activeGraph === "nonproducing" && <NonProducingBuffaloGraph yearlyData={yearlyData} />}
                </div>
                
                {/* Enhanced Quick Stats Card */}
               
              </div>
            </div>
          </div>

          {/* Price in Words */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-12 shadow-2xl mb-16 text-center mt-8">
            <div className="text-white">
              <div className="text-xl font-semibold opacity-90 mb-6 uppercase tracking-wider">Total Revenue in Words</div>
              <div className="text-3xl md:text-4xl font-bold bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-white/20 leading-relaxed">
                {formatPriceInWords(totalRevenue)}
              </div>
            </div>
          </div>

          <ProductionSchedule />
          <RevenueTable />
          <AdditionalInformation />

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