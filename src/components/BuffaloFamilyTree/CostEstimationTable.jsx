import React, { useState } from 'react';
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

  // Corrected Age-based buffalo pricing structure
  const getBuffaloValueByAge = (ageInMonths) => {
    if (ageInMonths >= 60) {
      return 175000; // 5+ years (5th year) - Mother buffaloes
    } else if (ageInMonths >= 48) {
      return 150000; // 4+ years (5th year)
    } else if (ageInMonths >= 40) {
      return 100000; // After 40 months (4 years 1 month)
    } else if (ageInMonths >= 36) {
      return 50000; // 36-40 months
    } else if (ageInMonths >= 30) {
      return 50000; // 30-36 months
    } else if (ageInMonths >= 24) {
      return 35000; // 24-30 months
    } else if (ageInMonths >= 18) {
      return 25000; // 18-24 months
    } else if (ageInMonths >= 12) {
      return 12000; // 12-18 months
    } else if (ageInMonths >= 6) {
      return 6000; // 6-12 months
    } else {
      return 3000; // 0-6 months
    }
  };

  const getBuffaloValueDescription = (ageInMonths) => {
    if (ageInMonths >= 60) {
      return "5+ years (Mother buffalo - ₹1,75,000)";
    } else if (ageInMonths >= 48) {
      return "4+ years (5th year - ₹1,50,000)";
    } else if (ageInMonths >= 40) {
      return "After 40 months (₹1,00,000)";
    } else if (ageInMonths >= 36) {
      return "36-40 months (₹50,000)";
    } else if (ageInMonths >= 30) {
      return "30-36 months (₹50,000)";
    } else if (ageInMonths >= 24) {
      return "24-30 months (₹35,000)";
    } else if (ageInMonths >= 18) {
      return "18-24 months (₹25,000)";
    } else if (ageInMonths >= 12) {
      return "12-18 months (₹12,000)";
    } else if (ageInMonths >= 6) {
      return "6-12 months (₹6,000)";
    } else {
      return "0-6 months (Calves - ₹3,000)";
    }
  };

  // Investment and Asset Value Calculations
  const MOTHER_BUFFALO_PRICE = 175000; // Correct: Price for mother buffaloes (5th year, 60 months)
  const CPF_PER_UNIT = 13000;

  // Calculate initial investment - 2 mother buffaloes @ ₹1.75 lakhs each + their 2 calves (included free)
  const calculateInitialInvestment = () => {
    const motherBuffaloCost = treeData.units * 2 * MOTHER_BUFFALO_PRICE; // 2 mother buffaloes per unit
    const cpfCost = treeData.units * CPF_PER_UNIT;
    return {
      motherBuffaloCost,
      cpfCost,
      totalInvestment: motherBuffaloCost + cpfCost,
      totalBuffaloesAtStart: treeData.units * 4, // 2 mothers + 2 calves per unit
      motherBuffaloes: treeData.units * 2,
      calvesAtStart: treeData.units * 2
    };
  };

  const initialInvestment = calculateInitialInvestment();

  // Enhanced monthly revenue calculation for each buffalo
  const calculateMonthlyRevenueForBuffalo = (acquisitionMonth, currentMonth, currentYear, startYear) => {
    const monthsSinceAcquisition = (currentYear - startYear) * 12 + (currentMonth - acquisitionMonth);
    
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

  // Calculate buffalo's age in months at a specific year and month
  const calculateAgeInMonths = (buffalo, targetYear, targetMonth = 0) => {
    const birthYear = buffalo.birthYear;
    const birthMonth = buffalo.birthMonth || 0; // January if not specified
    
    const totalMonths = (targetYear - birthYear) * 12 + (targetMonth - birthMonth);
    return Math.max(0, totalMonths);
  };

  // Detailed buffalo tracking with IDs and relationships
  const getBuffaloDetails = () => {
    const buffaloDetails = {};
    let buffaloCounter = 1;
    
    // Track mother buffaloes (B1, B2 for each unit) - these are 60 months old (5 years)
    treeData.buffaloes.forEach(buffalo => {
      if (buffalo.generation === 0) {
        const unit = buffalo.unit || 1;
        const buffaloId = `M${buffaloCounter}`; // M for Mother
        
        buffaloDetails[buffalo.id] = {
          id: buffaloId,
          originalId: buffalo.id,
          generation: buffalo.generation,
          unit: unit,
          acquisitionMonth: buffalo.acquisitionMonth,
          birthYear: treeData.startYear - 5, // Mother buffaloes are 5 years old (60 months)
          birthMonth: buffalo.birthMonth || 0,
          parentId: buffalo.parentId,
          children: [],
          grandchildren: []
        };
        buffaloCounter++;
      }
    });

    // Track calves that come with the mother buffaloes
    let calfCounter = 1;
    treeData.buffaloes.forEach(buffalo => {
      if (buffalo.generation === 1 && buffalo.isInitialCalf) {
        const unit = buffalo.unit || 1;
        const mother = Object.values(buffaloDetails).find(b => 
          b.unit === unit && b.generation === 0
        );
        
        if (mother) {
          const calfId = `${mother.id}C${calfCounter}`;
          buffaloDetails[buffalo.id] = {
            id: calfId,
            originalId: buffalo.id,
            generation: buffalo.generation,
            unit: unit,
            acquisitionMonth: mother.acquisitionMonth,
            birthYear: treeData.startYear, // Calves are born in the start year
            birthMonth: 0, // January birth
            parentId: mother.originalId,
            children: [],
            grandchildren: []
          };
          mother.children.push(buffalo.id);
          calfCounter++;
        }
      }
    });

    // Track other children and grandchildren born during simulation
    treeData.buffaloes.forEach(buffalo => {
      if (buffalo.generation === 1 && !buffalo.isInitialCalf) {
        const parent = Object.values(buffaloDetails).find(b => b.originalId === buffalo.parentId);
        if (parent) {
          const childId = `${parent.id}C${parent.children.length + 1}`;
          buffaloDetails[buffalo.id] = {
            id: childId,
            originalId: buffalo.id,
            generation: buffalo.generation,
            unit: parent.unit,
            acquisitionMonth: parent.acquisitionMonth,
            birthYear: buffalo.birthYear,
            birthMonth: buffalo.birthMonth || 0,
            parentId: buffalo.parentId,
            children: [],
            grandchildren: []
          };
          parent.children.push(buffalo.id);
        }
      } else if (buffalo.generation === 2) {
        const grandparent = Object.values(buffaloDetails).find(b => 
          b.children.includes(buffalo.parentId)
        );
        if (grandparent) {
          const grandchildId = `${grandparent.id}GC${grandparent.grandchildren.length + 1}`;
          buffaloDetails[buffalo.id] = {
            id: grandchildId,
            originalId: buffalo.id,
            generation: buffalo.generation,
            unit: grandparent.unit,
            acquisitionMonth: grandparent.acquisitionMonth,
            birthYear: buffalo.birthYear,
            birthMonth: buffalo.birthMonth || 0,
            parentId: buffalo.parentId,
            children: [],
            grandchildren: []
          };
          grandparent.grandchildren.push(buffalo.id);
        }
      }
    });

    return buffaloDetails;
  };

  // Calculate detailed monthly revenue for all buffaloes
  const calculateDetailedMonthlyRevenue = () => {
    const buffaloDetails = getBuffaloDetails();
    const monthlyRevenue = {};
    const investorMonthlyRevenue = {};
    const buffaloValuesByYear = {}; // Track buffalo values by year
    
    // Initialize monthly revenue structure
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      monthlyRevenue[year] = {};
      investorMonthlyRevenue[year] = {};
      buffaloValuesByYear[year] = {};
      
      for (let month = 0; month < 12; month++) {
        monthlyRevenue[year][month] = {
          total: 0,
          buffaloes: {}
        };
        investorMonthlyRevenue[year][month] = 0;
      }
    }

    // Calculate revenue and value for each buffalo for each month
    Object.values(buffaloDetails).forEach(buffalo => {
      for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
        // Calculate age in months for this year (at the end of the year)
        const ageInMonths = calculateAgeInMonths(buffalo, year, 11); // December (end of year)
        
        // Track buffalo value for this year
        if (!buffaloValuesByYear[year][buffalo.id]) {
          buffaloValuesByYear[year][buffalo.id] = {
            ageInMonths: ageInMonths,
            value: getBuffaloValueByAge(ageInMonths),
            description: getBuffaloValueDescription(ageInMonths)
          };
        }

        // Check if buffalo exists in this year and is milk producing (age >= 3 years)
        if (year >= buffalo.birthYear + 3) { // Buffalo becomes productive at age 3
          for (let month = 0; month < 12; month++) {
            const revenue = calculateMonthlyRevenueForBuffalo(
              buffalo.acquisitionMonth,
              month,
              year,
              treeData.startYear
            );
            
            if (revenue > 0) {
              monthlyRevenue[year][month].total += revenue;
              monthlyRevenue[year][month].buffaloes[buffalo.id] = revenue;
              investorMonthlyRevenue[year][month] += revenue;
            }
          }
        }
      }
    });

    return { monthlyRevenue, investorMonthlyRevenue, buffaloDetails, buffaloValuesByYear };
  };

  const { monthlyRevenue, investorMonthlyRevenue, buffaloDetails, buffaloValuesByYear } = calculateDetailedMonthlyRevenue();

  // Calculate Revenue Break-Even Analysis with monthly precision
  const calculateBreakEvenAnalysis = () => {
    let cumulativeRevenue = 0;
    const breakEvenData = [];
    let breakEvenYear = null;
    let breakEvenMonth = null;

    // Check monthly break-even
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      for (let month = 0; month < 12; month++) {
        cumulativeRevenue += investorMonthlyRevenue[year][month];
        
        if (cumulativeRevenue >= initialInvestment.totalInvestment && !breakEvenYear) {
          breakEvenYear = year;
          breakEvenMonth = month;
          break;
        }
      }
      if (breakEvenYear) break;
    }

    // Yearly break-even data for table
    for (let i = 0; i < yearlyData.length; i++) {
      const yearData = yearlyData[i];
      const yearCumulative = yearlyData.slice(0, i + 1).reduce((sum, item) => sum + item.revenue, 0);
      
      breakEvenData.push({
        year: yearData.year,
        annualRevenue: yearData.revenue,
        cumulativeRevenue: yearCumulative,
        isBreakEven: breakEvenYear === yearData.year,
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

  // Calculate Asset Market Value based on age-based pricing
  const calculateAssetMarketValue = () => {
    const assetValues = [];
    
    // Calculate asset value for each year
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      let totalAssetValue = 0;
      let motherBuffaloes = 0;
      let fiveYearBuffaloes = 0;
      let after40MonthBuffaloes = 0;
      let growingBuffaloes = 0;
      let calfBuffaloes = 0;
      
      // Sum values of all buffaloes alive in this year
      Object.values(buffaloDetails).forEach(buffalo => {
        if (year >= buffalo.birthYear) { // Buffalo is alive
          const ageInMonths = calculateAgeInMonths(buffalo, year, 11); // Age at end of year
          const value = getBuffaloValueByAge(ageInMonths);
          totalAssetValue += value;
          
          if (buffalo.generation === 0) {
            motherBuffaloes++; // Original mother buffaloes
          }
          
          if (ageInMonths >= 60) {
            fiveYearBuffaloes++;
          } else if (ageInMonths >= 40) {
            after40MonthBuffaloes++;
          } else if (ageInMonths >= 12) {
            growingBuffaloes++;
          } else {
            calfBuffaloes++;
          }
        }
      });
      
      const yearData = yearlyData.find(d => d.year === year);
      
      assetValues.push({
        year: year,
        totalBuffaloes: yearData?.totalBuffaloes || 0,
        motherBuffaloes: motherBuffaloes,
        fiveYearBuffaloes: fiveYearBuffaloes,
        after40MonthBuffaloes: after40MonthBuffaloes,
        growingBuffaloes: growingBuffaloes,
        calfBuffaloes: calfBuffaloes,
        totalAssetValue: totalAssetValue
      });
    }

    return assetValues;
  };

  const assetMarketValue = calculateAssetMarketValue();

  // Detailed Asset Value Breakdown by Age Group
  const calculateDetailedAssetValue = (year) => {
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
      if (year >= buffalo.birthYear) {
        const ageInMonths = calculateAgeInMonths(buffalo, year, 11);
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

  // Calculate herd statistics
  const herdStats = {
    startingBuffaloes: initialInvestment.totalBuffaloesAtStart,
    motherBuffaloes: initialInvestment.motherBuffaloes,
    initialCalves: initialInvestment.calvesAtStart,
    finalBuffaloes: treeData.totalBuffaloes,
    growthMultiple: treeData.totalBuffaloes / initialInvestment.totalBuffaloesAtStart,
    averageMatureBuffaloes: totalMatureBuffaloYears / treeData.years,
    revenuePerBuffalo: totalRevenue / treeData.totalBuffaloes,
    initialInvestmentPerBuffalo: initialInvestment.totalInvestment / initialInvestment.totalBuffaloesAtStart
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

  // Buffalo Value By Age Breakdown Component
  const BuffaloValueByAge = () => {
    const [selectedYear, setSelectedYear] = useState(treeData.startYear + treeData.years);
    
    const detailedAssetValue = calculateDetailedAssetValue(selectedYear);
    
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-3xl p-10 shadow-2xl border border-purple-200 mb-16">
        <h2 className="text-4xl font-bold text-purple-800 mb-10 text-center flex items-center justify-center gap-4">
          <span className="text-5xl">💰</span>
          Buffalo Value By Age (Market Valuation)
        </h2>
        
        {/* Year Selection */}
        <div className="bg-white rounded-2xl p-6 border border-purple-200 mb-8 max-w-md mx-auto">
          <label className="block text-lg font-semibold text-purple-700 mb-3">
            Select Year for Valuation:
          </label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full p-3 border border-purple-300 rounded-xl text-lg"
          >
            {Array.from({ length: treeData.years + 1 }, (_, i) => (
              <option key={i} value={treeData.startYear + i}>
                {treeData.startYear + i} (Year {i + 1})
              </option>
            ))}
          </select>
        </div>

        {/* Total Value Summary */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-white text-center shadow-2xl mb-8">
          <div className="text-2xl font-bold mb-2">Total Asset Value in {selectedYear}</div>
          <div className="text-5xl font-bold mb-4">{formatCurrency(detailedAssetValue.totalValue)}</div>
          <div className="text-lg opacity-90">
            {detailedAssetValue.totalCount} buffaloes | Average: {formatCurrency(detailedAssetValue.totalValue / detailedAssetValue.totalCount)}
          </div>
        </div>

        {/* Age Group Breakdown */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Age-Based Valuation Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-purple-50">
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Age Group</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Unit Value</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Count</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Total Value</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(detailedAssetValue.ageGroups)
                  .filter(([_, data]) => data.count > 0)
                  .map(([ageGroup, data], index) => (
                    <tr key={ageGroup} className="hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4 border-b">
                        <div className="font-semibold text-gray-900">{ageGroup}</div>
                      </td>
                      <td className="px-6 py-4 border-b font-semibold text-blue-600">
                        {formatCurrency(data.unitValue)}
                      </td>
                      <td className="px-6 py-4 border-b font-semibold text-purple-600">
                        {data.count}
                      </td>
                      <td className="px-6 py-4 border-b font-semibold text-green-600">
                        {formatCurrency(data.value)}
                      </td>
                      <td className="px-6 py-4 border-b">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-purple-500 h-4 rounded-full" 
                              style={{ width: `${(data.value / detailedAssetValue.totalValue) * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-sm font-semibold text-gray-600 min-w-[50px]">
                            {((data.value / detailedAssetValue.totalValue) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                  <td className="px-6 py-4 font-bold">Total</td>
                  <td className="px-6 py-4 font-bold">-</td>
                  <td className="px-6 py-4 font-bold">{detailedAssetValue.totalCount}</td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(detailedAssetValue.totalValue)}</td>
                  <td className="px-6 py-4 font-bold">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Price Schedule */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-8 border border-blue-200">
          <h3 className="text-2xl font-bold text-blue-800 mb-6 text-center">📋 Age-Based Price Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { age: '0-6 months (Calves)', price: '₹3,000', color: 'from-blue-100 to-blue-200', desc: 'New born calves' },
              { age: '6-12 months', price: '₹6,000', color: 'from-blue-200 to-blue-300', desc: 'Growing' },
              { age: '12-18 months', price: '₹12,000', color: 'from-green-100 to-green-200', desc: 'Growing' },
              { age: '18-24 months', price: '₹25,000', color: 'from-green-200 to-green-300', desc: 'Growing' },
              { age: '24-30 months', price: '₹35,000', color: 'from-orange-100 to-orange-200', desc: 'Growing' },
              { age: '30-36 months', price: '₹50,000', color: 'from-orange-200 to-orange-300', desc: 'Growing' },
              { age: '36-40 months', price: '₹50,000', color: 'from-red-100 to-red-200', desc: 'Transition' },
              { age: '40-48 months', price: '₹1,00,000', color: 'from-red-200 to-red-300', desc: '4+ years' },
              { age: '48-60 months', price: '₹1,50,000', color: 'from-purple-100 to-purple-200', desc: '5th year (4+ years)' },
              { age: '60+ months (Mother Buffalo)', price: '₹1,75,000', color: 'from-purple-200 to-purple-300', desc: '5+ years (Mother buffaloes)' }
            ].map((item, index) => (
              <div 
                key={index} 
                className={`bg-gradient-to-br ${item.color} rounded-xl p-6 border border-gray-200 shadow-lg`}
              >
                <div className="text-xl font-bold text-gray-800 mb-2">{item.age}</div>
                <div className="text-2xl font-bold text-gray-900">{item.price}</div>
                <div className="text-sm text-gray-600 mt-2">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Detailed Monthly Revenue Breakdown Component
  const DetailedMonthlyRevenueBreakdown = () => {
    const [selectedYear, setSelectedYear] = useState(treeData.startYear);
    const [selectedUnit, setSelectedUnit] = useState(1);

    // Get buffaloes for selected unit and filter only income-producing ones for the selected year
    const unitBuffaloes = Object.values(buffaloDetails)
      .filter(buffalo => buffalo.unit === selectedUnit)
      .filter(buffalo => {
        // Check if buffalo is income-producing in the selected year
        if (selectedYear < buffalo.birthYear + 3) {
          return false; // Buffalo is too young
        }
        
        // Check if buffalo has any revenue in the selected year
        const hasRevenue = monthNames.some((_, monthIndex) => {
          return (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0) > 0;
        });
        
        return hasRevenue;
      });

    // Calculate CPF cost for milk-producing buffaloes
    const calculateCPFCost = () => {
      // Count milk-producing buffaloes (age >= 3 and generating revenue)
      const milkProducingBuffaloes = unitBuffaloes.length;
      
      // CPF cost: ₹13,000 per milk-producing buffalo per year
      const annualCPFCost = milkProducingBuffaloes * 13000;
      const monthlyCPFCost = annualCPFCost / 12;
      
      return {
        milkProducingBuffaloes,
        annualCPFCost,
        monthlyCPFCost: Math.round(monthlyCPFCost)
      };
    };

    const cpfCost = calculateCPFCost();

    // Download Excel function
    const downloadExcel = () => {
      // Create CSV content
      let csvContent = "Monthly Revenue Breakdown - Unit " + selectedUnit + " - " + selectedYear + "\n\n";
      
      // Headers
      csvContent += "Month,";
      unitBuffaloes.forEach(buffalo => {
        csvContent += buffalo.id + ",";
      });
      csvContent += "Unit Total,CPF Cost,Net Revenue\n";
      
      // Monthly data
      monthNames.forEach((month, monthIndex) => {
        const unitTotal = unitBuffaloes.reduce((sum, buffalo) => {
          return sum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
        }, 0);
        
        const netRevenue = unitTotal - cpfCost.monthlyCPFCost;
        
        csvContent += month + ",";
        unitBuffaloes.forEach(buffalo => {
          const revenue = monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0;
          csvContent += revenue + ",";
        });
        csvContent += unitTotal + "," + cpfCost.monthlyCPFCost + "," + netRevenue + "\n";
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
      csvContent += yearlyUnitTotal + "," + cpfCost.annualCPFCost + "," + yearlyNetRevenue + "\n";
      
      // Create and download file
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
      <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-3xl p-10 shadow-2xl border border-blue-200 mb-16">
        <h2 className="text-4xl font-bold text-blue-800 mb-8 text-center flex items-center justify-center gap-4">
          <span className="text-5xl">📊</span>
          Monthly Revenue - Income Producing Buffaloes Only
        </h2>

        {/* Year and Unit Selection with Download Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-blue-200">
            <label className="block text-lg font-semibold text-blue-700 mb-3">
              Select Year:
            </label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full p-3 border border-blue-300 rounded-xl text-lg"
            >
              {Array.from({ length: treeData.years + 1 }, (_, i) => (
                <option key={i} value={treeData.startYear + i}>
                  {treeData.startYear + i}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-blue-200">
            <label className="block text-lg font-semibold text-blue-700 mb-3">
              Select Unit:
            </label>
            <select 
              value={selectedUnit} 
              onChange={(e) => setSelectedUnit(parseInt(e.target.value))}
              className="w-full p-3 border border-blue-300 rounded-xl text-lg"
            >
              {Array.from({ length: treeData.units }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Unit {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-green-200 flex items-center justify-center">
            <button
              onClick={downloadExcel}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-3 w-full"
            >
              <span className="text-2xl">📥</span>
              <span className="text-xl">Download Excel</span>
            </button>
          </div>
        </div>

        {/* CPF Cost Summary */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white text-center mb-8">
          <div className="text-2xl font-bold mb-2">
            CPF (Cattle Protection Fund) - ₹13,000 per Milk-Producing Buffalo
          </div>
          <div className="text-lg opacity-90">
            {cpfCost.milkProducingBuffaloes} milk-producing buffaloes × ₹13,000 = {formatCurrency(cpfCost.annualCPFCost)} annually
          </div>
          <div className="text-sm opacity-80 mt-2">
            Monthly CPF Cost: {formatCurrency(cpfCost.monthlyCPFCost)} | Net Revenue = Total Revenue - CPF Cost
          </div>
        </div>

        {/* Income Producing Buffaloes Summary */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center mb-8">
          <div className="text-2xl font-bold mb-2">
            {unitBuffaloes.length} Income Producing Buffaloes in {selectedYear}
          </div>
          <div className="text-lg opacity-90">
            Unit {selectedUnit} | Showing only buffaloes generating revenue (age 3+ years)
          </div>
        </div>

        {/* Monthly Revenue Table */}
        {unitBuffaloes.length > 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Monthly Revenue Breakdown - {selectedYear} (Unit {selectedUnit})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <th className="px-8 py-6 text-left font-bold text-gray-700 border-b-2 border-r-2 border-gray-300 text-xl">
                      Month
                    </th>
                    {unitBuffaloes.map((buffalo, index) => (
                      <th 
                        key={buffalo.id} 
                        className="px-6 py-6 text-center font-bold text-gray-700 border-b-2 border-r-2 border-gray-300 text-lg"
                        style={{ 
                          borderRight: index === unitBuffaloes.length - 1 ? '2px solid #d1d5db' : '1px solid #e5e7eb'
                        }}
                      >
                        <div className="text-xl font-bold">{buffalo.id}</div>
                        <div className="text-sm font-normal text-gray-500 mt-1">
                          {buffalo.generation === 0 ? 'Mother' : 
                           buffalo.generation === 1 ? 'Child' : 'Grandchild'}
                        </div>
                      </th>
                    ))}
                    <th className="px-8 py-6 text-center font-bold text-gray-700 border-b-2 border-r-2 border-gray-300 text-xl bg-blue-100">
                      Unit Total
                    </th>
                    <th className="px-8 py-6 text-center font-bold text-gray-700 border-b-2 border-r-2 border-gray-300 text-xl bg-orange-100">
                      CPF Cost
                    </th>
                    <th className="px-8 py-6 text-center font-bold text-gray-700 border-b-2 border-gray-300 text-xl bg-green-100">
                      Net Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthNames.map((month, monthIndex) => {
                    const unitTotal = unitBuffaloes.reduce((sum, buffalo) => {
                      return sum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                    }, 0);
                    
                    const netRevenue = unitTotal - cpfCost.monthlyCPFCost;

                    return (
                      <tr key={monthIndex} className="hover:bg-blue-50 transition-colors group">
                        <td className="px-8 py-5 border-b border-r-2 border-gray-300 font-semibold text-gray-900 text-lg bg-gray-50">
                          {month}
                        </td>
                        {unitBuffaloes.map((buffalo, buffaloIndex) => {
                          const revenue = monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0;
                          return (
                            <td 
                              key={buffalo.id} 
                              className="px-6 py-5 border-b text-center transition-all duration-200 group-hover:bg-blue-50"
                              style={{ 
                                borderRight: buffaloIndex === unitBuffaloes.length - 1 ? '2px solid #d1d5db' : '1px solid #e5e7eb',
                                background: revenue > 0 ? (revenue === 9000 ? '#f0fdf4' : revenue === 6000 ? '#f0f9ff' : '#f8fafc') : '#f8fafc'
                              }}
                            >
                              <div className={`font-semibold text-lg ${
                                revenue === 9000 ? 'text-green-600' : 
                                revenue === 6000 ? 'text-blue-600' : 
                                'text-gray-400'
                              }`}>
                                {formatCurrency(revenue)}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {revenue === 9000 ? 'High' : revenue === 6000 ? 'Medium' : 'Rest'}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-8 py-5 border-b border-r-2 border-gray-300 text-center font-semibold text-purple-600 text-lg bg-blue-50">
                          {formatCurrency(unitTotal)}
                        </td>
                        <td className="px-8 py-5 border-b border-r-2 border-gray-300 text-center font-semibold text-orange-600 text-lg bg-orange-50">
                          {formatCurrency(cpfCost.monthlyCPFCost)}
                        </td>
                        <td className="px-8 py-5 border-b text-center font-semibold text-lg bg-green-50"
                            style={{ color: netRevenue >= 0 ? '#059669' : '#dc2626' }}>
                          {formatCurrency(netRevenue)}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Yearly Total Row */}
                  <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                    <td className="px-8 py-6 font-bold text-xl border-r-2 border-gray-600">Yearly Total</td>
                    {unitBuffaloes.map((buffalo, buffaloIndex) => {
                      const yearlyTotal = monthNames.reduce((sum, _, monthIndex) => {
                        return sum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                      }, 0);
                      return (
                        <td 
                          key={buffalo.id} 
                          className="px-6 py-6 text-center font-bold text-lg border-r-2 border-gray-600"
                          style={{ borderRight: buffaloIndex === unitBuffaloes.length - 1 ? '2px solid #4b5563' : '1px solid #6b7280' }}
                        >
                          {formatCurrency(yearlyTotal)}
                        </td>
                      );
                    })}
                    <td className="px-8 py-6 text-center font-bold text-lg border-r-2 border-gray-600 bg-blue-800">
                      {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                        return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                          return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                        }, 0);
                      }, 0))}
                    </td>
                    <td className="px-8 py-6 text-center font-bold text-lg border-r-2 border-gray-600 bg-orange-800">
                      {formatCurrency(cpfCost.annualCPFCost)}
                    </td>
                    <td className="px-8 py-6 text-center font-bold text-lg bg-green-800">
                      {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                        return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                          return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                        }, 0);
                      }, 0) - cpfCost.annualCPFCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                    return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                      return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                    }, 0);
                  }, 0))}
                </div>
                <div className="text-lg font-semibold text-blue-700">Total Annual Revenue</div>
              </div>
              
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-200 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {formatCurrency(cpfCost.annualCPFCost)}
                </div>
                <div className="text-lg font-semibold text-orange-700">Annual CPF Cost</div>
                <div className="text-sm text-orange-600 mt-1">
                  {cpfCost.milkProducingBuffaloes} buffaloes × ₹13,000
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-6 border border-green-200 text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                    return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                      return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                    }, 0);
                  }, 0) - cpfCost.annualCPFCost)}
                </div>
                <div className="text-lg font-semibold text-green-700">Net Annual Revenue</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-200 text-center">
            <div className="text-2xl font-bold text-yellow-800 mb-4">
              🐄 No Income Producing Buffaloes
            </div>
            <div className="text-lg text-yellow-700">
              There are no income-producing buffaloes in Unit {selectedUnit} for the year {selectedYear}.
            </div>
            <div className="text-sm text-yellow-600 mt-2">
              Buffaloes start generating income at age 3 (born in {selectedYear - 3} or earlier).
            </div>
          </div>
        )}
      </div>
    );
  };

  // Revenue Break-Even Analysis Component
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
            {formatCurrency(initialInvestment.motherBuffaloCost)}
          </div>
          <div className="text-lg font-semibold text-blue-700">Mother Buffaloes (60 months old)</div>
          <div className="text-sm text-gray-600 mt-2">
            {treeData.units} units × 2 mothers × ₹1.75 Lakhs
            <br />
            {initialInvestment.motherBuffaloes} mother buffaloes @ ₹1.75 Lakhs each
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-green-200 shadow-lg text-center">
          <div className="text-3xl font-bold text-green-600 mb-4">
            {formatCurrency(initialInvestment.cpfCost)}
          </div>
          <div className="text-lg font-semibold text-green-700">CPF Cost</div>
          <div className="text-sm text-gray-600 mt-2">
            {treeData.units} units × ₹13,000
            <br />
            Annual cattle protection fund
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg text-center">
          <div className="text-3xl font-bold mb-4">
            {formatCurrency(initialInvestment.totalInvestment)}
          </div>
          <div className="text-lg font-semibold opacity-90">Total Initial Investment</div>
          <div className="text-sm opacity-80 mt-2">
            Includes {initialInvestment.totalBuffaloesAtStart} buffaloes (2 mothers + 2 calves per unit)
          </div>
        </div>
      </div>

      {/* Starting Buffalo Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white text-center shadow-2xl mb-8">
        <div className="text-2xl font-bold mb-4">Starting Buffaloes (Included in Initial Purchase)</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-3xl font-bold">{initialInvestment.motherBuffaloes}</div>
            <div className="text-lg font-semibold">Mother Buffaloes (60 months)</div>
            <div className="text-sm opacity-90">5th year @ ₹1.75 Lakhs each</div>
          </div>
          <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-3xl font-bold">{initialInvestment.calvesAtStart}</div>
            <div className="text-lg font-semibold">Newborn Calves</div>
            <div className="text-sm opacity-90">Included free with mothers</div>
          </div>
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
                <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Investment Recovery</th>
              </tr>
            </thead>
            <tbody>
              {breakEvenAnalysis.breakEvenData.map((data, index) => {
                const recoveryPercentage = (data.cumulativeRevenue / initialInvestment.totalInvestment) * 100;
                return (
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
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className={`h-4 rounded-full ${recoveryPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(recoveryPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-sm font-semibold text-gray-600 min-w-[60px]">
                          {recoveryPercentage.toFixed(1)}%
                        </div>
                      </div>
                      {data.isBreakEven ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mt-2 inline-block">
                          ✓ Break-Even
                        </span>
                      ) : recoveryPercentage >= 75 ? (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold mt-2 inline-block">
                          75% Recovered
                        </span>
                      ) : recoveryPercentage >= 50 ? (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mt-2 inline-block">
                          50% Recovered
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm mt-2 inline-block">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Asset Market Value Component
  const AssetMarketValue = () => {
    const [selectedYear, setSelectedYear] = useState(treeData.startYear + treeData.years);
    const detailedAssetValue = calculateDetailedAssetValue(selectedYear);
    const selectedAssetValue = assetMarketValue.find(a => a.year === selectedYear) || assetMarketValue[assetMarketValue.length - 1];

    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-3xl p-10 shadow-2xl border border-orange-200 mb-16">
        <h2 className="text-4xl font-bold text-orange-800 mb-10 text-center flex items-center justify-center gap-4">
          <span className="text-5xl">🏦</span>
          Asset Market Value Analysis
        </h2>

        {/* Year Selection and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-orange-200">
            <label className="block text-lg font-semibold text-orange-700 mb-3">
              Select Year for Valuation:
            </label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full p-3 border border-orange-300 rounded-xl text-lg"
            >
              {assetMarketValue.map((asset, index) => (
                <option key={index} value={asset.year}>
                  {asset.year} (Year {asset.year - treeData.startYear + 1})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg text-center">
            <div className="text-2xl font-bold mb-2">Total Asset Value</div>
            <div className="text-4xl font-bold mb-2">{formatCurrency(selectedAssetValue?.totalAssetValue || 0)}</div>
            <div className="text-lg opacity-90">
              {selectedAssetValue?.totalBuffaloes || 0} buffaloes
            </div>
          </div>
        </div>

        {/* Current vs Final Asset Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-8 border border-blue-200 shadow-lg text-center">
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {formatCurrency(assetMarketValue[0]?.totalAssetValue || 0)}
            </div>
            <div className="text-lg font-semibold text-blue-700">Initial Asset Value</div>
            <div className="text-sm text-gray-600 mt-2">
              {assetMarketValue[0]?.totalBuffaloes || 0} buffaloes
              <br />
              2 mothers (60 months, ₹1.75L each) + 2 calves (newborn, ₹3k each)
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-lg text-center">
            <div className="text-3xl font-bold mb-4">
              {formatCurrency(assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)}
            </div>
            <div className="text-lg font-semibold opacity-90">Final Asset Value</div>
            <div className="text-sm opacity-80 mt-2">
              {assetMarketValue[assetMarketValue.length - 1]?.totalBuffaloes || 0} buffaloes
              <br />
              Multiple generations with age-based valuation
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
          <div className="text-sm text-gray-500 mt-2">
            Includes value appreciation as buffaloes mature through age brackets
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
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Mother Buffaloes</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">60+ months (₹1.75L)</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Calves (0-6m)</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Total Asset Value</th>
                </tr>
              </thead>
              <tbody>
                {assetMarketValue.map((data, index) => (
                  <tr 
                    key={data.year} 
                    className={`hover:bg-orange-50 transition-colors ${data.year === selectedYear ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}
                  >
                    <td className="px-6 py-4 border-b">
                      <div className="font-semibold text-gray-900">{data.year}</div>
                      <div className="text-sm text-gray-600">Year {index + 1}</div>
                    </td>
                    <td className="px-6 py-4 border-b font-semibold text-purple-600">
                      {formatNumber(data.totalBuffaloes)}
                    </td>
                    <td className="px-6 py-4 border-b font-semibold text-blue-600">
                      {formatNumber(data.motherBuffaloes)}
                    </td>
                    <td className="px-6 py-4 border-b font-semibold text-red-600">
                      {formatNumber(data.fiveYearBuffaloes)}
                    </td>
                    <td className="px-6 py-4 border-b font-semibold text-green-600">
                      {formatNumber(data.calfBuffaloes)}
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
  };

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
        <div className="text-sm text-gray-500 mt-2">
          {herdStats.startingBuffaloes} buffaloes total
          <br />
          ({herdStats.motherBuffaloes} mothers + {herdStats.initialCalves} calves)
        </div>
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
            { title: "Initial Investment", description: `${formatCurrency(initialInvestment.totalInvestment)} (Mother Buffaloes: ${formatCurrency(initialInvestment.motherBuffaloCost)} + CPF: ${formatCurrency(initialInvestment.cpfCost)})` },
            { title: "Starting Buffaloes", description: `${herdStats.startingBuffaloes} total (${herdStats.motherBuffaloes} mothers @ ₹1.75L each + ${herdStats.initialCalves} calves included)` },
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
              <h2 className="text-3xl font-semibold opacity-90">2 Mother Buffaloes (60 months) + 2 Calves per Unit | Complete Financial Projection</h2>
            </div>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Comprehensive financial analysis for {treeData.units} starting unit{treeData.units > 1 ? 's' : ''} over {treeData.years} years
              <br />
              <span className="text-lg text-gray-500">
                Each unit starts with 2 mother buffaloes (₹1.75L each, 60 months old) + 2 newborn calves (included free) | Age-based asset valuation
              </span>
            </p>
          </div>
          <div className="h-5"></div>

          <SummaryCards />
          <div className="h-10"></div>

          {/* Buffalo Value By Age Component */}
          <BuffaloValueByAge />
          <div className="h-10"></div>

          {/* Detailed Monthly Revenue Components */}
          <DetailedMonthlyRevenueBreakdown />
          <div className="h-10"></div>

          {/* Revenue Break-Even Analysis */}
          <RevenueBreakEvenAnalysis />
          <div className="h-10"></div>

          {/* Asset Market Value */}
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