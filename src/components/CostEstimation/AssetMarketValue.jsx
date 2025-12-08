import React, { useState } from 'react';

const AssetMarketValue = ({
  treeData,
  buffaloDetails,
  calculateAgeInMonths,
  getBuffaloValueByAge,
  getBuffaloValueDescription,
  calculateDetailedAssetValue,
  assetMarketValue,
  formatCurrency,
  isAssetMarketValue = false,
  startYear,
  endYear,
  yearRange
}) => {
  const [selectedYear, setSelectedYear] = useState(treeData.startYear + treeData.years);

  if (isAssetMarketValue) {
    // This is the Asset Market Value component
    const selectedAssetValue = assetMarketValue.find(a => a.year === selectedYear) || assetMarketValue[0];

    return (
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-3xl p-8 shadow-xl border border-gray-200 mb-16 mx-4 lg:mx-20">
        {/* Combined Year Selection and Summary */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-300 shadow-sm max-w-3xl w-full">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              {/* Year Selection */}
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Year for Valuation:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  {assetMarketValue.map((asset, index) => (
                    <option key={index} value={asset.year}>
                      {asset.year} (Year {asset.year - treeData.startYear + 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="hidden lg:block h-14 w-px bg-gray-300"></div>

              {/* Total Value Display */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white flex-1 min-w-0 text-center shadow-md">
                <div className="text-xs font-semibold mb-1 text-blue-100">Total Asset Value</div>
                <div className="text-2xl font-bold mb-1">{formatCurrency(selectedAssetValue?.totalAssetValue || 0)}</div>
                <div className="text-xs text-blue-200">
                  {selectedAssetValue?.totalBuffaloes || 0} buffaloes
                  {selectedAssetValue?.motherBuffaloes ? ` · ${selectedAssetValue.motherBuffaloes} mothers` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Age Category Table */}
        <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm mb-8 mx-4 lg:mx-20">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
            Age-Based Asset Breakdown - {selectedYear}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-orange-50">
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Age Category</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Unit Value</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Count</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Total Value</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { category: '0-6 months', unitValue: 3000 },
                  { category: '6-12 months', unitValue: 6000 },
                  { category: '12-18 months', unitValue: 12000 },
                  { category: '18-24 months', unitValue: 25000 },
                  { category: '24-30 months', unitValue: 35000 },
                  { category: '30-36 months', unitValue: 50000 },
                  { category: '36-40 months', unitValue: 50000 },
                  { category: '40-48 months', unitValue: 100000 },
                  { category: '48-60 months', unitValue: 150000 },
                  { category: '60+ months (Mother Buffalo)', unitValue: 175000 }
                ].map((item, index) => {
                  const count = selectedAssetValue?.ageCategories?.[item.category]?.count || 0;
                  const value = selectedAssetValue?.ageCategories?.[item.category]?.value || 0;
                  const percentage = selectedAssetValue?.totalAssetValue > 0
                    ? (value / selectedAssetValue.totalAssetValue * 100).toFixed(1)
                    : 0;

                  return (
                    <tr key={index} className="hover:bg-orange-50 transition-colors">
                      <td className="px-6 py-4 border-b">
                        <div className="font-semibold text-gray-900">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 border-b font-semibold text-blue-600">
                        {formatCurrency(item.unitValue)}
                      </td>
                      <td className="px-6 py-4 border-b font-semibold text-purple-600">
                        {count}
                      </td>
                      <td className="px-6 py-4 border-b font-semibold text-green-600">
                        {formatCurrency(value)}
                      </td>
                      <td className="px-6 py-4 border-b">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-gray-200 rounded-sm h-4">
                            <div
                              className="bg-orange-500 h-4 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-sm font-semibold text-gray-600 min-w-[50px]">
                            {percentage}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                  <td className="px-6 py-4 font-bold">Total</td>
                  <td className="px-6 py-4 font-bold">-</td>
                  <td className="px-6 py-4 font-bold">{selectedAssetValue?.totalBuffaloes || 0}</td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(selectedAssetValue?.totalAssetValue || 0)}</td>
                  <td className="px-6 py-4 font-bold">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* New: Year-wise Age Category Distribution Table */}
        <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm mb-8 mx-4 lg:mx-20">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
            Year-wise Age Category Distribution (Years 1-10)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Year</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">0-6 months</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">6-12 months</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">12-18 months</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">18-24 months</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">24-30 months</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">30-36 months</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">36-40 months</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">40-48 months</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">48-60 months</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">60+ months</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {assetMarketValue.slice(0, 10).map((asset, yearIndex) => (
                  <tr key={yearIndex} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 border-b font-semibold text-gray-900">
                      Year {yearIndex + 1} ({asset.year})
                    </td>
                    <td className="px-6 py-4 border-b text-center font-medium text-blue-600">
                      {asset.ageCategories?.['0-6 months']?.count || 0}
                    </td>
                    <td className="px-6 py-4 border-b text-center font-medium text-blue-600">
                      {asset.ageCategories?.['6-12 months']?.count || 0}
                    </td>
                    <td className="px-6 py-4 border-b text-center font-medium text-blue-600">
                      {asset.ageCategories?.['12-18 months']?.count || 0}
                    </td>
                    <td className="px-6 py-4 border-b text-center font-medium text-blue-600">
                      {asset.ageCategories?.['18-24 months']?.count || 0}
                    </td>
                    <td className="px-6 py-4 border-b text-center font-medium text-blue-600">
                      {asset.ageCategories?.['24-30 months']?.count || 0}
                    </td>
                    <td className="px-6 py-4 border-b text-center font-medium text-blue-600">
                      {asset.ageCategories?.['30-36 months']?.count || 0}
                    </td>
                    <td className="px-6 py-4 border-b text-center font-medium text-blue-600">
                      {asset.ageCategories?.['36-40 months']?.count || 0}
                    </td>
                    <td className="px-6 py-4 border-b text-center font-medium text-blue-600">
                      {asset.ageCategories?.['40-48 months']?.count || 0}
                    </td>
                    <td className="px-6 py-4 border-b text-center font-medium text-blue-600">
                      {asset.ageCategories?.['48-60 months']?.count || 0}
                    </td>
                    <td className="px-6 py-4 border-b text-center font-medium text-red-600">
                      {asset.ageCategories?.['60+ months (Mother Buffalo)']?.count || 
                       asset.ageCategories?.['60+ months']?.count || 0}
                    </td>
                    <td className="px-6 py-4 border-b text-center font-semibold text-green-600">
                      {formatCurrency(asset.totalAssetValue || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
      
            </table>
          </div>
         
        </div>

        {/* Combined Current vs Final Asset Value */}
        <div className="flex flex-col lg:flex-row justify-center items-center gap-8 mb-8 px-4">
          {/* Initial Asset Value Card */}
          <div className="w-full lg:w-1/2 max-w-md bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-300 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
            <div className="text-2xl font-bold text-blue-700 mb-2">
              {formatCurrency(assetMarketValue[0]?.totalAssetValue || 0)}
            </div>
            <div className="text-lg font-semibold text-blue-700">Initial Asset Value ({startYear})</div>
            <div className="text-sm text-gray-600 mt-2">
              {assetMarketValue[0]?.totalBuffaloes || 0} buffaloes
              <br />
              {assetMarketValue[0]?.motherBuffaloes || 0} mother buffaloes (60+ months)
              <br />
              {assetMarketValue[0]?.ageCategories?.['0-6 months']?.count || 0} newborn calves
            </div>
          </div>

          {/* Final Asset Value Card */}
          <div className="w-full lg:w-1/2 max-w-md bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-md hover:shadow-lg transition-all duration-300 text-center">
            <div className="text-2xl font-bold mb-2 ">
              {formatCurrency(assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)}
            </div>
            <div className="text-lg font-semibold opacity-90">Final Asset Value ({endYear})</div>
            <div className="text-sm opacity-80 mt-2">
              {assetMarketValue[assetMarketValue.length - 1]?.totalBuffaloes || 0} buffaloes
              <br />
              {assetMarketValue[assetMarketValue.length - 1]?.motherBuffaloes || 0} mother buffaloes (60+ months)
              <br />
              Multiple generations with age-based valuation
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This is the Buffalo Value By Age component
  const detailedAssetValue = calculateDetailedAssetValue(selectedYear);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 shadow-xl border border-gray-200 mb-16 mx-4 lg:mx-25">
      <div className='flex justify-center items-center mb-6'>
        <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm w-full max-w-3xl">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Year Selection */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valuation Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full p-3 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={treeData.startYear + i}>
                    {treeData.startYear + i} (Year {i + 1})
                  </option>
                ))}
              </select>
            </div>

            {/* Value Summary */}
            <div className="flex-1 min-w-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white text-center shadow-md">
              <div className="text-sm font-medium text-blue-100 mb-1">
                Total Value in {selectedYear}
              </div>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(detailedAssetValue.totalValue)}
              </div>
              <div className="text-xs text-blue-200">
                {detailedAssetValue.totalCount} buffaloes • 
                Average: {formatCurrency(detailedAssetValue.totalValue / detailedAssetValue.totalCount)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Age Group Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-gray-300 shadow-sm mb-8 mx-4 lg:mx-18">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Age-Based Valuation Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b text-sm">Age Group</th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b text-sm">Unit Value</th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b text-sm">Count</th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b text-sm">Total Value</th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b text-sm">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(detailedAssetValue.ageGroups)
                .filter(([_, data]) => data.count > 0)
                .map(([ageGroup, data], index) => {
                  const colors = [
                    'from-blue-50 to-blue-100',
                    'from-blue-100 to-blue-200',
                    'from-teal-50 to-teal-100',
                    'from-teal-100 to-teal-200',
                    'from-emerald-50 to-emerald-100',
                    'from-emerald-100 to-emerald-200',
                    'from-amber-50 to-amber-100',
                    'from-amber-100 to-amber-200',
                    'from-orange-50 to-orange-100',
                    'from-red-50 to-red-100'
                  ];
                  
                  return (
                    <tr 
                      key={ageGroup} 
                      className={`hover:bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-200`}
                    >
                      <td className="px-4 py-4 border-b text-sm">
                        <div className="font-medium text-gray-900">{ageGroup}</div>
                      </td>
                      <td className="px-4 py-4 border-b font-medium text-blue-600 text-sm">
                        {formatCurrency(data.unitValue)}
                      </td>
                      <td className="px-4 py-4 border-b font-medium text-indigo-600 text-sm">
                        {data.count}
                      </td>
                      <td className="px-4 py-4 border-b font-medium text-emerald-600 text-sm">
                        {formatCurrency(data.value)}
                      </td>
                      <td className="px-4 py-4 border-b text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                              style={{ width: `${(data.value / detailedAssetValue.totalValue) * 100}%` }}
                            ></div>
                          </div>
                          <div className="font-medium text-gray-600 min-w-[45px] text-xs">
                            {((data.value / detailedAssetValue.totalValue) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            <tfoot>
              <tr className="bg-gradient-to-r from-slate-800 to-gray-900 text-white">
                <td className="px-4 py-4 font-semibold text-sm">Total</td>
                <td className="px-4 py-4 font-semibold text-sm">-</td>
                <td className="px-4 py-4 font-semibold text-sm">{detailedAssetValue.totalCount}</td>
                <td className="px-4 py-4 font-semibold text-sm">{formatCurrency(detailedAssetValue.totalValue)}</td>
                <td className="px-4 py-4 font-semibold text-sm">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Price Schedule Grid */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 border border-gray-300 mx-4 lg:mx-20">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Age-Based Price Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[
            { age: '0-6 months', price: '₹3,000', color: 'from-blue-50 to-blue-100', desc: 'New born' },
            { age: '6-12 months', price: '₹6,000', color: 'from-blue-100 to-blue-200', desc: 'Growing' },
            { age: '12-18 months', price: '₹12,000', color: 'from-teal-50 to-teal-100', desc: 'Growing' },
            { age: '18-24 months', price: '₹25,000', color: 'from-teal-100 to-teal-200', desc: 'Growing' },
            { age: '24-30 months', price: '₹35,000', color: 'from-emerald-50 to-emerald-100', desc: 'Growing' },
            { age: '30-36 months', price: '₹50,000', color: 'from-emerald-100 to-emerald-200', desc: 'Growing' },
            { age: '36-40 months', price: '₹50,000', color: 'from-amber-50 to-amber-100', desc: 'Transition' },
            { age: '40-48 months', price: '₹1,00,000', color: 'from-amber-100 to-amber-200', desc: '4+ years' },
            { age: '48-60 months', price: '₹1,50,000', color: 'from-orange-50 to-orange-100', desc: '5th year' },
            { age: '60+ months', price: '₹1,75,000', color: 'from-red-50 to-red-100', desc: 'Mother buffalo' }
          ].map((item, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${item.color} rounded-lg p-5 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300`}
            >
              <div className="text-base font-semibold text-gray-800 mb-1">{item.age}</div>
              <div className="text-xl font-bold text-gray-900 mb-2">{item.price}</div>
              <div className="text-xs font-medium text-gray-600">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetMarketValue;