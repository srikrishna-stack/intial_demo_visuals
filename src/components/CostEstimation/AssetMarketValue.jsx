import React, { useState, useEffect } from 'react';

const AssetMarketValue = ({
  treeData,
  buffaloDetails,
  calculateAgeInMonths,
  getBuffaloValueByAge,
  getBuffaloValueDescription,
  calculateDetailedAssetValue,
  assetMarketValue,
  formatCurrency,
  isAssetMarketValue = true,
  startYear,
  endYear,
  endMonth,
  yearRange,
  yearlyData,
  monthlyRevenue,
  yearlyCPFCost
}) => {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Helper for date formatting
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const startDay = treeData.startDay || 1;
  const startMonthName = monthNames[treeData.startMonth || 0];
  const startDateString = `${getOrdinal(startDay)} ${startMonthName} ${treeData.startYear}`;
  const endDateString = `31st December ${endYear}`;

  const [selectedYear, setSelectedYear] = useState(treeData.startYear);
  const [breakdownYear, setBreakdownYear] = useState(treeData.startYear);
  const [selectedAssetData, setSelectedAssetData] = useState(null);
  const [breakdownAssetData, setBreakdownAssetData] = useState(null);
  const [totalBuffaloes, setTotalBuffaloes] = useState(0);

  // Update selected asset data when year changes
  useEffect(() => {
    const assetData = assetMarketValue.find(a => a.year === selectedYear) || assetMarketValue[0];
    setSelectedAssetData(assetData);

    if (assetData) {
      // Calculate total buffaloes from age categories
      let total = 0;
      Object.values(assetData.ageCategories || {}).forEach(category => {
        total += category.count || 0;
      });
      setTotalBuffaloes(total);
    } else {
      // Fallback: calculate from buffaloDetails
      let count = 0;
      Object.values(buffaloDetails).forEach(buffalo => {
        if (selectedYear >= buffalo.birthYear) {
          count++;
        }
      });
      setTotalBuffaloes(count);
    }
  }, [selectedYear, assetMarketValue, buffaloDetails]);

  // Update breakdown asset data when breakdown year changes
  useEffect(() => {
    const assetData = assetMarketValue.find(a => a.year === breakdownYear) || assetMarketValue[0];
    setBreakdownAssetData(assetData);
  }, [breakdownYear, assetMarketValue]);

  // Age-Based Valuation Breakdown function for selected year
  const calculateDetailedAssetValueForYear = (year) => {
    const ageGroups = {
      '0-6 months (Calves)': { count: 0, value: 0, unitValue: 3000 },
      '6-12 months': { count: 0, value: 0, unitValue: 6000 },
      '12-18 months': { count: 0, value: 0, unitValue: 12000 },
      '18-24 months': { count: 0, value: 0, unitValue: 25000 },
      '24-30 months': { count: 0, value: 0, unitValue: 35000 },
      '30-36 months': { count: 0, value: 0, unitValue: 50000 },
      '36-40 months': { count: 0, value: 0, unitValue: 50000 },
      '40-48 months': { count: 0, value: 0, unitValue: 100000 },
      '48-60 months': { count: 0, value: 0, unitValue: 150000 },
      '60+ months (Mother Buffalo)': { count: 0, value: 0, unitValue: 175000 }
    };

    let totalValue = 0;
    let totalCount = 0;

    Object.values(buffaloDetails).forEach(buffalo => {
      // Only count buffaloes born before or in the last year/month
      // Determine target month: December (11) for full years, or endMonth for the final year
      const targetMonth = (year === endYear && endMonth !== undefined) ? endMonth : 11;

      if (buffalo.birthYear < year || (buffalo.birthYear === year && (buffalo.birthMonth || 0) <= targetMonth)) {
        const ageInMonths = calculateAgeInMonths(buffalo, year, targetMonth);
        const value = getBuffaloValueByAge(ageInMonths);

        if (ageInMonths >= 60) {
          ageGroups['60+ months (Mother Buffalo)'].count++;
          ageGroups['60+ months (Mother Buffalo)'].value += value;
        } else if (ageInMonths >= 48) {
          ageGroups['48-60 months'].count++;
          ageGroups['48-60 months'].value += value;
        } else if (ageInMonths >= 40) {
          ageGroups['40-48 months'].count++;
          ageGroups['40-48 months'].value += value;
        } else if (ageInMonths >= 36) {
          ageGroups['36-40 months'].count++;
          ageGroups['36-40 months'].value += value;
        } else if (ageInMonths >= 30) {
          ageGroups['30-36 months'].count++;
          ageGroups['30-36 months'].value += value;
        } else if (ageInMonths >= 24) {
          ageGroups['24-30 months'].count++;
          ageGroups['24-30 months'].value += value;
        } else if (ageInMonths >= 18) {
          ageGroups['18-24 months'].count++;
          ageGroups['18-24 months'].value += value;
        } else if (ageInMonths >= 12) {
          ageGroups['12-18 months'].count++;
          ageGroups['12-18 months'].value += value;
        } else if (ageInMonths >= 6) {
          ageGroups['6-12 months'].count++;
          ageGroups['6-12 months'].value += value;
        } else {
          ageGroups['0-6 months (Calves)'].count++;
          ageGroups['0-6 months (Calves)'].value += value;
        }

        totalValue += value;
        totalCount++;
      }
    });

    return { ageGroups, totalValue, totalCount };
  };



  // Helper function to get category count from asset data
  const getCategoryCount = (categoryKey, dataSource = selectedAssetData) => {
    if (!dataSource || !dataSource.ageCategories) return 0;

    // Try multiple possible key formats
    const keys = [
      categoryKey,
      categoryKey.replace(' (Calves)', ''),
      categoryKey.replace(' (Mother Buffalo)', ''),
      categoryKey.includes('0-6') ? '0-6 months' : undefined,
      categoryKey.includes('60+') ? '60+ months' : undefined
    ].filter(Boolean);

    for (const key of keys) {
      if (dataSource.ageCategories[key]) {
        return dataSource.ageCategories[key].count || 0;
      }
    }

    return 0;
  };

  // Helper function to get category value from asset data
  const getCategoryValue = (categoryKey, dataSource = selectedAssetData) => {
    if (!dataSource || !dataSource.ageCategories) return 0;

    const keys = [
      categoryKey,
      categoryKey.replace(' (Calves)', ''),
      categoryKey.replace(' (Mother Buffalo)', ''),
      categoryKey.includes('0-6') ? '0-6 months' : undefined,
      categoryKey.includes('60+') ? '60+ months' : undefined
    ].filter(Boolean);

    for (const key of keys) {
      if (dataSource.ageCategories[key]) {
        return dataSource.ageCategories[key].value || 0;
      }
    }

    return 0;
  };

  if (isAssetMarketValue) {
    // This is the Asset Market Value component
    if (!selectedAssetData || !breakdownAssetData) {
      return <div>Loading asset data...</div>;
    }

    const detailedValue = calculateDetailedAssetValueForYear(selectedYear);

    return (
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-3xl p-8 shadow-xl border border-gray-200 mb-16 mx-4 lg:mx-20">


        {/* Age-Based Valuation Breakdown Table */}
        <div className="bg-white rounded-2xl p-6 border border-gray-300 shadow-sm mb-8 mx-4 lg:mx-20">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-6">
            <div className="flex items-center gap-3 justify-self-start w-full md:w-auto">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Select Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="py-1 px-3 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {assetMarketValue.map((asset, index) => (
                  <option key={index} value={asset.year}>
                    {asset.year}
                  </option>
                ))}
              </select>
            </div>

            <h3 className="text-xl font-bold text-gray-800 text-center justify-self-center md:whitespace-nowrap">
              Age-Based Valuation Breakdown
            </h3>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-3 justify-self-end w-full md:w-auto justify-between md:justify-start">
              <span className="text-sm font-medium opacity-90">Total Value:</span>
              <span className="text-xl font-bold">{formatCurrency(detailedValue.totalValue || 0)}</span>
              <span className="text-xs opacity-75 border-l border-white/30 pl-3 ml-1">
                {detailedValue.totalCount} Buffaloes
              </span>
            </div>
          </div>
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
                {Object.entries(detailedValue.ageGroups)
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
                                style={{ width: `${(data.value / detailedValue.totalValue) * 100}%` }}
                              ></div>
                            </div>
                            <div className="font-medium text-gray-600 min-w-[45px] text-xs">
                              {detailedValue.totalValue > 0 ? ((data.value / detailedValue.totalValue) * 100).toFixed(1) : 0}%
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
                  <td className="px-4 py-4 font-semibold text-sm">{detailedValue.totalCount}</td>
                  <td className="px-4 py-4 font-semibold text-sm">
                    {formatCurrency(detailedValue.totalValue || 0)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-sm">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Compact Age Category Table - Using breakdownAssetData data */}
        <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm mb-8 mx-4 lg:mx-20">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-6">
            <div className="flex items-center gap-3 justify-self-start w-full md:w-auto">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Select Year:</label>
              <select
                value={breakdownYear}
                onChange={(e) => setBreakdownYear(parseInt(e.target.value))}
                className="py-1 px-3 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {assetMarketValue.map((asset, index) => (
                  <option key={index} value={asset.year}>
                    {asset.year}
                  </option>
                ))}
              </select>
            </div>

            <h3 className="text-xl font-bold text-gray-800 text-center justify-self-center md:whitespace-nowrap">
              Age-Based Asset Breakdown
            </h3>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-lg font-bold justify-self-end w-full md:w-auto text-center md:text-right">
              {formatCurrency(breakdownAssetData.totalAssetValue || 0)}
            </div>
          </div>
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
                  { category: '0-6 months (Calves)', unitValue: 3000 },
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
                  const count = getCategoryCount(item.category, breakdownAssetData);
                  // console.log(count);

                  const value = getCategoryValue(item.category, breakdownAssetData);
                  const percentage = breakdownAssetData.totalAssetValue > 0
                    ? (value / breakdownAssetData.totalAssetValue * 100).toFixed(1)
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
                  <td className="px-6 py-4 font-bold">
                    {(() => {
                      let total = 0;
                      Object.values(breakdownAssetData.ageCategories || {}).forEach(cat => total += cat.count || 0);
                      return total;
                    })()}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {formatCurrency(breakdownAssetData.totalAssetValue || 0)}
                  </td>
                  <td className="px-6 py-4 font-bold">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Year-wise Age Category Distribution Table */}
        <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm mb-8 mx-4 lg:mx-20">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
            Year-wise Age Category Distribution (Years 1-10)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Year</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Total Buffaloes</th>
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

                {assetMarketValue.slice(0, 10).map((asset, yearIndex) => {
                  // Calculate total buffaloes for this year
                  let yearTotalBuffaloes = 0;
                  if (asset.ageCategories) {
                    Object.values(asset.ageCategories).forEach(category => {
                      yearTotalBuffaloes += category.count || 0;
                    });
                  }
                  // console.log(assetMarketValue)
                  return (
                    <tr key={yearIndex} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 border-b font-semibold text-gray-900">
                        Year {yearIndex + 1} ({asset.year})
                      </td>
                      <td className="px-6 py-4 border-b text-center font-bold text-gray-800">
                        {asset.totalBuffaloes}
                      </td>
                      <td className="px-6 py-4 border-b text-center font-medium text-blue-600">
                        {asset.ageCategories?.['0-6 months (Calves)']?.count || 0}
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
                        {asset.ageCategories?.['60+ months (Mother Buffalo)']?.count || 0}
                      </td>
                      <td className="px-6 py-4 border-b text-center font-semibold text-green-600">
                        {formatCurrency(asset.totalAssetValue || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-500 text-center">
            Shows the distribution of buffaloes across different age categories for each year (1-10)
          </div>
        </div>

        {/* Combined Current vs Final Asset Value */}
        <div className="flex flex-col lg:flex-row justify-center items-center gap-8 mb-8 px-4">
          {/* Initial Asset Value Card */}
          <div className="w-full lg:w-1/2 max-w-md bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-300 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
            <div className="text-2xl font-bold text-blue-700 mb-2">
              {(() => {
                const initialMothers = treeData.units * 2;
                const initialValue = initialMothers * 175000;
                return formatCurrency(initialValue);
              })()}
            </div>
            <div className="text-lg font-semibold text-blue-700">Initial Asset Value ({startDateString})</div>
            <div className="text-sm text-gray-600 mt-2">
              {(() => {
                const initialMothers = treeData.units * 2;
                return `${initialMothers} buffaloes`;
              })()}
              <br />
              {(() => {
                const initialMothers = treeData.units * 2;
                return `${initialMothers} mother buffaloes (60+ months)`;
              })()}
            </div>
          </div>

          {/* Final Asset Value Card */}
          <div className="w-full lg:w-1/2 max-w-md bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-md hover:shadow-lg transition-all duration-300 text-center">
            <div className="text-2xl font-bold mb-2">
              {formatCurrency(assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)}
            </div>
            <div className="text-lg font-semibold opacity-90">Final Asset Value ({endDateString})</div>
            <div className="text-sm opacity-80 mt-2">
              {(() => {
                const finalAsset = assetMarketValue[assetMarketValue.length - 1];
                if (!finalAsset || !finalAsset.ageCategories) return "0 buffaloes";
                let total = 0;
                Object.values(finalAsset.ageCategories).forEach(cat => {
                  total += cat.count || 0;
                });
                return `${total} buffaloes`;
              })()}
              <br />
              {assetMarketValue[assetMarketValue.length - 1]?.ageCategories?.['60+ months (Mother Buffalo)']?.count || 0} mother buffaloes (60+ months)
              <br />
              Multiple generations with age-based valuation
            </div>
          </div>
        </div>

        {/* Caring Cost & Net Value Table */}
        <div className="bg-white rounded-2xl p-6 border border-gray-300 shadow-sm mb-8 mx-4 lg:mx-20">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-6">
            <div className="flex items-center gap-3 justify-self-start w-full md:w-auto">
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

            <h3 className="text-xl font-bold text-gray-800 text-center justify-self-center md:whitespace-nowrap">
              Caring Cost & Net Value Analysis
            </h3>

            <div className="justify-self-end w-full md:w-auto"></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-teal-50 to-teal-100">
                  <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b text-sm">Age Group</th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b text-sm">Yearly Cost</th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b text-sm"> Buffaloes</th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b text-sm">Annual Cost</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
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

                    const bracketStats = costBrackets.map(b => ({ ...b, count: new Set(), totalCost: 0 }));
                    let totalCaringCost = 0;

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

                    const absoluteStartMonthInYear = year * 12 + startMonthInYear;
                    const absoluteEndMonthInYear = year * 12 + endMonthInYear;

                    // Simplified: No monthly cost loop. Using Snapshot counts below.

                    // Snapshot Logic for Counts (End of selected year)
                    const snapshotAbsoluteMonth = year * 12 + endMonthInYear;
                    Object.values(buffaloDetails).forEach(buffalo => {
                      const buffaloAbsoluteBirth = buffalo.birthYear * 12 + (buffalo.birthMonth || 0);

                      // Only count if born before or at snapshot date
                      if (buffaloAbsoluteBirth <= snapshotAbsoluteMonth) {
                        const ageInMonths = snapshotAbsoluteMonth - buffaloAbsoluteBirth;
                        const bracketIndex = bracketStats.findIndex(b => ageInMonths >= b.start && ageInMonths <= b.end);

                        if (bracketIndex !== -1) {
                          bracketStats[bracketIndex].count.add(buffalo.id);
                        }
                      }
                    });

                    // Simplified Cost Calculation (Aligned with Snapshot Counts)
                    totalCaringCost = 0; // Reset
                    bracketStats.forEach(bracket => {
                      bracket.totalCost = bracket.count.size * bracket.cost;
                      totalCaringCost += bracket.totalCost;
                    });

                    let yearlyRevenue = 0;
                    if (monthlyRevenue && monthlyRevenue[year]) {
                      yearlyRevenue = Object.values(monthlyRevenue[year]).reduce((sum, m) => sum + (m.total || 0), 0);
                    } else {
                      yearlyRevenue = yearlyData ? (yearlyData.find(d => d.year === year)?.revenue || 0) : 0;
                    }

                    const cpfDeduction = yearlyCPFCost ? (yearlyCPFCost[year] || 0) : 0;
                    yearlyRevenue = yearlyRevenue - cpfDeduction;

                    const netValue = yearlyRevenue - totalCaringCost;

                    return { bracketStats, totalCaringCost, yearlyRevenue, netValue };
                  };

                  // Calculate for current selected year (for display in main rows)
                  const currentYearFinancials = calculateFinancialsForYear(selectedYear);

                  // Calculate cumulatives up to selected year
                  let cumCaringCost = 0;
                  let cumRevenue = 0;
                  let cumNetValue = 0;

                  for (let y = treeData.startYear; y <= selectedYear; y++) {
                    const f = calculateFinancialsForYear(y);
                    cumCaringCost += f.totalCaringCost;
                    cumRevenue += f.yearlyRevenue;
                    cumNetValue += f.netValue;
                  }

                  return (
                    <>
                      {currentYearFinancials.bracketStats.map((bracket, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{bracket.label}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(bracket.cost)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{bracket.count.size}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatCurrency(bracket.totalCost)}</td>
                        </tr>
                      ))}

                      {/* Footer Rows */}
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-700">Total Caring Cost:</td>
                        <td className="px-4 py-3 text-sm font-bold text-red-700">{formatCurrency(currentYearFinancials.totalCaringCost)}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-700">Annual Revenue ({selectedYear}):</td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-700">{formatCurrency(currentYearFinancials.yearlyRevenue)}</td>
                      </tr>
                      <tr className="bg-gradient-to-r from-slate-800 to-gray-900 text-white">
                        <td colSpan="3" className="px-4 py-4 text-right font-bold text-lg">Net Value:</td>
                        <td className="px-4 py-4 text-lg font-bold">
                          {formatCurrency(currentYearFinancials.netValue)}
                        </td>
                      </tr>

                      {/* Cumulative Row */}
                      <tr className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white border-t-2 border-slate-600">
                        <td className="px-4 py-4 font-bold text-sm">Cumulative Net ({treeData.startYear}-{selectedYear})</td>
                        <td className="px-4 py-4 font-bold text-red-300 text-sm" title="Cumulative Caring Cost">
                          {formatCurrency(cumCaringCost)}(caring cost)
                        </td>
                        <td className="px-4 py-4 font-bold text-emerald-300 text-sm" title="Cumulative Annual Revenue">
                          {formatCurrency(cumRevenue)}(annual revenue)
                        </td>
                        <td className="px-4 py-4 font-bold text-white text-lg" title="Cumulative Net Value">
                          {formatCurrency(cumNetValue)}(net value)
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
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
  }

  // This is the Buffalo Value By Age component
  const detailedAssetValue = calculateDetailedAssetValue(selectedYear);
  const buffaloCountForYear = Object.values(buffaloDetails).filter(buffalo =>
    selectedYear >= buffalo.birthYear
  ).length;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 shadow-xl border border-gray-200 mb-16 mx-4 lg:mx-20">
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
                {Array.from({ length: (endYear && endYear >= treeData.startYear) ? (endYear - treeData.startYear + 1) : 10 }, (_, i) => (
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
                {buffaloCountForYear} buffaloes •
                Average: {formatCurrency(detailedAssetValue.totalValue / buffaloCountForYear)}
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
                <td className="px-4 py-4 font-semibold text-sm">{buffaloCountForYear}</td>
                <td className="px-4 py-4 font-semibold text-sm">{formatCurrency(detailedAssetValue.totalValue)}</td>
                <td className="px-4 py-4 font-semibold text-sm">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssetMarketValue;
