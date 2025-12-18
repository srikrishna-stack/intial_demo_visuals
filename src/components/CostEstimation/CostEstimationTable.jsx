import React, { useState } from 'react';
import { Info } from 'lucide-react';
import MonthlyRevenueBreak from './MonthlyRevenueBreak';
import RevenueBreakEven from './RevenueBreakEven';
import AssetMarketValue from './AssetMarketValue';
import HerdPerformance from './HerdPerformance';
import AnnualHerdRevenue from './AnnualHerdRevenue';
import BreakEvenTimeline from './BreakEvenTimeline';
import CattleGrowingFund from './CattleGrowingFund';
import { formatCurrency, formatNumber } from '../BuffaloFamilyTree/CommonComponents';

const CostEstimationTable = ({
  treeData,
  activeGraph,
  setActiveGraph,
  onBack,
  setHeaderStats
}) => {
  if (!treeData?.revenueData) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-2xl text-red-500 mb-4">Revenue data not available</div>
          <button
            onClick={onBack}
            className="bg-red-500 text-white px-6 py-3 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState("Monthly Revenue Break");
  const [cpfToggle, setCpfToggle] = useState("withCPF");

  const { yearlyData, totalRevenue, totalUnits, totalMatureBuffaloYears } = treeData.revenueData;

  // Shared calculation functions
  const calculateAgeInMonths = (buffalo, targetYear, targetMonth = 0) => {
    const birthYear = buffalo.birthYear;
    // Use birthMonth if available (from getBuffaloDetails), fall back to acquisitionMonth or 0
    const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
    const totalMonths = (targetYear - birthYear) * 12 + (targetMonth - birthMonth);
    return Math.max(0, totalMonths);
  };

  const getBuffaloDetails = () => {
    const buffaloDetails = {};

    // First pass: Create all buffalo entries
    treeData.buffaloes.forEach(buffalo => {
      // Determine acquisition/birth month logic
      // For Gen 0, acquisitionMonth is set.
      // For Gen > 0, we can use birthMonth if available or inherit from parent acquisition if consistent.
      // In the new treeData, acquisitionMonth is passed down.

      const birthMonth = buffalo.generation === 0 ? (buffalo.acquisitionMonth || 0) : (buffalo.acquisitionMonth || 0);

      buffaloDetails[buffalo.id] = {
        id: buffalo.id,
        name: buffalo.name || buffalo.id, // Pass name, fallback to ID
        originalId: buffalo.id,
        generation: buffalo.generation,
        unit: buffalo.unit,
        acquisitionMonth: buffalo.acquisitionMonth,
        absoluteAcquisitionMonth: buffalo.absoluteAcquisitionMonth, // Pass this down
        birthYear: buffalo.birthYear,
        birthMonth: birthMonth,
        parentId: buffalo.parentId,
        children: [],
        grandchildren: []
      };
    });

    // Second pass: Link relationships
    treeData.buffaloes.forEach(buffalo => {
      if (buffalo.parentId && buffaloDetails[buffalo.parentId]) {
        const parent = buffaloDetails[buffalo.parentId];
        parent.children.push(buffalo.id);

        // If parent is a child (generation 1), then this buffalo is a grandchild (generation 2)
        // We also want to link it to the grandparent for CostEstimationTable structure if needed,
        // though the current code only explicitly tracks grandchildren for the grandparent object?
        // The original code was: grandparent.grandchildren.push(buffalo.id)

        if (parent.generation === 1) {
          const grandparent = buffaloDetails[parent.parentId];
          if (grandparent) {
            grandparent.grandchildren.push(buffalo.id);
          }
        }
      }
    });

    return buffaloDetails;
  };

  const calculateMonthlyRevenueForBuffalo = (acquisitionMonth, currentMonth, currentYear, startYear, absoluteAcquisitionMonth, generation = 0, buffaloId = '') => {
    let monthsSinceAcquisition;

    if (absoluteAcquisitionMonth !== undefined) {
      const currentAbsolute = currentYear * 12 + currentMonth;
      monthsSinceAcquisition = currentAbsolute - absoluteAcquisitionMonth;
    } else {
      monthsSinceAcquisition = (currentYear - startYear) * 12 + (currentMonth - acquisitionMonth);
    }

    let offset = 2;
    if (generation > 0) {
      offset = 34; // Standardized for all offspring
    }

    if (monthsSinceAcquisition < offset) {
      return 0;
    }

    const productionMonth = monthsSinceAcquisition - offset;
    const cycleMonth = productionMonth % 12;

    if (cycleMonth < 5) {
      return 9000;
    } else if (cycleMonth < 8) {
      return 6000;
    } else {
      return 0;
    }
  };

  const calculateYearlyCPFCost = () => {
    const buffaloDetails = getBuffaloDetails();
    const cpfCostByYear = {};

    const CPF_PER_MONTH = 13000 / 12;

    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      let totalCPFCost = 0;

      for (let unit = 1; unit <= treeData.units; unit++) {
        let unitCPFCost = 0;
        const unitBuffaloes = Object.values(buffaloDetails).filter(buffalo => buffalo.unit === unit);

        unitBuffaloes.forEach(buffalo => {
          let monthsWithCPF = 0;

          for (let month = 0; month < 12; month++) {
            // Cutoff Logic
            const currentAbsoluteMonth = year * 12 + month;
            const absoluteStartMonth = treeData.startYear * 12 + treeData.startMonth;
            const absoluteEndMonth = absoluteStartMonth + (treeData.years * 12) - 1;

            if (currentAbsoluteMonth < absoluteStartMonth || currentAbsoluteMonth > absoluteEndMonth) {
              continue;
            }

            let isCpfApplicable = false;

            if (buffalo.generation === 0) {
              // Gen 0: Identify Type A (First in unit) vs Type B (Second in unit)
              // Logic: (charCode - 65) % 2 === 0 is Type A (Even: 0, 2, 4...), Odd is Type B (1, 3...)
              const isFirstInUnit = (buffalo.id.charCodeAt(0) - 65) % 2 === 0;

              if (isFirstInUnit) {
                // Type A: Always pays from start
                isCpfApplicable = true;
              } else {
                // Type B: Free Period Check
                // Fix: Check presence logic to match index.jsx fix (Simulation start vs Birth)
                // For Gen 0, birthYear is older, so we must check relative to Start Year for acquisition
                const startYear = treeData.startYear;
                // Check presence using Absolute Acquisition Month
                const currentAbsolute = year * 12 + month;
                const isPresentInSimulation = buffalo.absoluteAcquisitionMonth !== undefined
                  ? currentAbsolute >= buffalo.absoluteAcquisitionMonth
                  : (year > startYear || (year === startYear && month >= buffalo.acquisitionMonth));

                if (isPresentInSimulation) {
                  // Free Period: 12 months starting 6 months after simulation start
                  const absoluteStart = treeData.startYear * 12 + treeData.startMonth;
                  const currentAbsolute = year * 12 + month;
                  const monthsSinceStart = currentAbsolute - absoluteStart;

                  // B is acquired at month 6 relative to start. Free for 12 months (6-17).
                  const isFreePeriod = monthsSinceStart >= 6 && monthsSinceStart < 18;

                  if (!isFreePeriod) {
                    isCpfApplicable = true;
                  }
                }
              }
            } else if (buffalo.generation >= 1) {
              // Child CPF: Age >= 24 months (From 25th month)
              // Use precise monthly calculation
              const ageInMonths = calculateAgeInMonths(buffalo, year, month);
              if (ageInMonths >= 24) {
                isCpfApplicable = true;
              }
            }

            if (isCpfApplicable) {
              monthsWithCPF++;
            }
          }

          unitCPFCost += monthsWithCPF * CPF_PER_MONTH;
        });

        totalCPFCost += unitCPFCost;
      }

      cpfCostByYear[year] = Math.round(totalCPFCost);
    }

    return cpfCostByYear;
  };

  const yearlyCPFCost = calculateYearlyCPFCost();

  const calculateYearlyDataWithCPF = () => {
    return yearlyData.map(yearData => {
      const cpfCost = yearlyCPFCost[yearData.year] || 0;
      const revenueWithoutCPF = yearData.revenue;
      const revenueWithCPF = revenueWithoutCPF - cpfCost;

      return {
        ...yearData,
        cpfCost,
        revenueWithoutCPF,
        revenueWithCPF
      };
    });
  };

  const yearlyDataWithCPF = calculateYearlyDataWithCPF();

  const calculateCumulativeRevenueData = () => {
    const cumulativeData = [];
    let cumulativeRevenueWithoutCPF = 0;
    let cumulativeRevenueWithCPF = 0;

    yearlyDataWithCPF.forEach((yearData, index) => {
      cumulativeRevenueWithoutCPF += yearData.revenueWithoutCPF;
      cumulativeRevenueWithCPF += yearData.revenueWithCPF;

      cumulativeData.push({
        ...yearData,
        cumulativeRevenueWithCPF: cumulativeRevenueWithCPF,
        cumulativeCPFCost: cumulativeRevenueWithoutCPF - cumulativeRevenueWithCPF
      });
    });

    return cumulativeData;
  };

  const cumulativeYearlyData = calculateCumulativeRevenueData();

  const getBuffaloValueByAge = (ageInMonths) => {
    if (ageInMonths >= 48) {
      return 200000;
    } else if (ageInMonths >= 41) {
      return 175000;
    } else if (ageInMonths >= 35) {
      return 150000;
    } else if (ageInMonths >= 25) {
      return 100000;
    } else if (ageInMonths >= 19) {
      return 40000;
    } else if (ageInMonths >= 13) {
      return 25000;
    } else {
      return 10000;
    }
  };

  const getBuffaloValueDescription = (ageInMonths) => {
    if (ageInMonths > 48) {
      return "48+ months (Proven - ₹2,00,000)";
    } else if (ageInMonths >= 41) {
      return "41-48 months (Peak - ₹1,75,000)";
    } else if (ageInMonths >= 35) {
      return "35-40 months (Prime - ₹1,50,000)";
    } else if (ageInMonths >= 25) {
      return "25-34 months (Mature - ₹1,00,000)";
    } else if (ageInMonths >= 19) {
      return "19-24 months (Heifer - ₹40,000)";
    } else if (ageInMonths >= 13) {
      return "13-18 months (Growing - ₹25,000)";
    } else {
      return "0-12 months (Calf - ₹10,000)";
    }
  };

  const MOTHER_BUFFALO_PRICE = 175000;
  const CPF_PER_UNIT = 13000;

  const calculateInitialInvestment = () => {
    const motherBuffaloCost = treeData.units * 2 * MOTHER_BUFFALO_PRICE;
    const cpfCost = treeData.units * CPF_PER_UNIT;
    return {
      motherBuffaloCost,
      cpfCost,
      totalInvestment: motherBuffaloCost + cpfCost,
      totalBuffaloesAtStart: treeData.units * 4,
      motherBuffaloes: treeData.units * 2,
      calvesAtStart: treeData.units * 2,
      pricePerMotherBuffalo: MOTHER_BUFFALO_PRICE,
      cpfPerUnit: CPF_PER_UNIT
    };
  };

  const initialInvestment = calculateInitialInvestment();



  const calculateDetailedMonthlyRevenue = () => {
    const buffaloDetails = getBuffaloDetails();
    const monthlyRevenue = {};
    const investorMonthlyRevenue = {};
    const buffaloValuesByYear = {};

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

    Object.values(buffaloDetails).forEach(buffalo => {
      for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
        const ageInMonths = calculateAgeInMonths(buffalo, year, 11);

        if (!buffaloValuesByYear[year][buffalo.id]) {
          buffaloValuesByYear[year][buffalo.id] = {
            ageInMonths: ageInMonths,
            value: getBuffaloValueByAge(ageInMonths),
            description: getBuffaloValueDescription(ageInMonths)
          };
        }

        // Revenue Logic
        // For Gen 0 (Mothers): Revenue based on acquisitionMonth
        // For Gen 1/2 (Children): Revenue starts when they mature (e.g. 3 years / 36 months)

        let shouldCalculateRevenue = false;
        if (buffalo.generation === 0) {
          shouldCalculateRevenue = true;
        } else {
          // For children, checking strictly year is not enough as M2C1 is born mid-year.
          // We check if they are at least 36 months old in this year (at some point).
          // Actually, we should check per month.
          shouldCalculateRevenue = true; // We will check inside the monthly loop
        }

        if (shouldCalculateRevenue) {
          for (let month = 0; month < 12; month++) {
            // Cutoff Logic
            const currentAbsoluteMonth = year * 12 + month;
            const absoluteStartMonth = treeData.startYear * 12 + treeData.startMonth;
            const absoluteEndMonth = absoluteStartMonth + (treeData.years * 12) - 1;

            if (currentAbsoluteMonth < absoluteStartMonth || currentAbsoluteMonth > absoluteEndMonth) {
              continue;
            }

            // Precise age check for children
            if (buffalo.generation > 0) {
              const ageAtMonth = calculateAgeInMonths(buffalo, year, month);
              const threshold = 34; // Standardized for all offspring
              if (ageAtMonth < threshold) continue;
            }

            const revenue = calculateMonthlyRevenueForBuffalo(
              buffalo.acquisitionMonth,
              month,
              year,
              treeData.startYear,
              buffalo.absoluteAcquisitionMonth,
              buffalo.generation,
              buffalo.id
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

  const calculateBreakEvenAnalysis = () => {
    const breakEvenData = [];
    let breakEvenYearWithCPF = null;
    let breakEvenMonthWithCPF = null;
    let exactBreakEvenDateWithCPF = null;

    let revenueBreakEvenYearWithCPF = null;
    let revenueBreakEvenMonthWithCPF = null;
    let revenueExactBreakEvenDateWithCPF = null;

    // Helper to calculate total asset value for a specific point in time
    const calculateTotalAssetValueForMonth = (targetYear, targetMonth) => {
      let totalValue = 0;
      Object.values(buffaloDetails).forEach(buffalo => {
        // Only count buffaloes born before or in this month
        if (buffalo.birthYear < targetYear || (buffalo.birthYear === targetYear && (buffalo.birthMonth || 0) <= targetMonth)) {
          const ageInMonths = calculateAgeInMonths(buffalo, targetYear, targetMonth);
          totalValue += getBuffaloValueByAge(ageInMonths);
        }
      });
      return totalValue;
    };

    // Reset for With CPF calculation (Break Even Timeline)
    let tempCumulativeWithCPF = 0;
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      const annualCPFCost = yearlyCPFCost[year] || 0;
      for (let month = 0; month < 12; month++) {
        tempCumulativeWithCPF += investorMonthlyRevenue[year][month];
        tempCumulativeWithCPF -= (annualCPFCost / 12);

        // Calculate Asset Value for this month
        const currentAssetValue = calculateTotalAssetValueForMonth(year, month);
        const totalValueWithCPF = tempCumulativeWithCPF + currentAssetValue;

        if (totalValueWithCPF >= initialInvestment.totalInvestment && !breakEvenYearWithCPF) {
          breakEvenYearWithCPF = year;
          breakEvenMonthWithCPF = month;

          const startDate = new Date(treeData.startYear, treeData.startMonth, treeData.startDay || 1);
          const monthsSinceStart = (year - treeData.startYear) * 12 + (month - treeData.startMonth);
          const breakEvenDate = new Date(startDate);
          breakEvenDate.setMonth(breakEvenDate.getMonth() + monthsSinceStart);

          const lastDayOfMonth = new Date(breakEvenDate.getFullYear(), breakEvenDate.getMonth() + 1, 0).getDate();
          breakEvenDate.setDate(lastDayOfMonth);

          exactBreakEvenDateWithCPF = breakEvenDate;
        }
      }
      if (breakEvenYearWithCPF) break;
    }

    // Reset for Revenue Break Even with CPF
    let revenueTempCumulativeWithCPF = 0;
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      const annualCPFCost = yearlyCPFCost[year] || 0;
      for (let month = 0; month < 12; month++) {
        revenueTempCumulativeWithCPF += investorMonthlyRevenue[year][month];
        revenueTempCumulativeWithCPF -= (annualCPFCost / 12);

        if (revenueTempCumulativeWithCPF >= initialInvestment.totalInvestment && !revenueBreakEvenYearWithCPF) {
          revenueBreakEvenYearWithCPF = year;
          revenueBreakEvenMonthWithCPF = month;

          const startDate = new Date(treeData.startYear, treeData.startMonth, treeData.startDay || 1);
          const monthsSinceStart = (year - treeData.startYear) * 12 + (month - treeData.startMonth);
          const breakEvenDate = new Date(startDate);
          breakEvenDate.setMonth(breakEvenDate.getMonth() + monthsSinceStart);

          const lastDayOfMonth = new Date(breakEvenDate.getFullYear(), breakEvenDate.getMonth() + 1, 0).getDate();
          breakEvenDate.setDate(lastDayOfMonth);

          revenueExactBreakEvenDateWithCPF = breakEvenDate;
        }
      }
      if (revenueBreakEvenYearWithCPF) break;
    }

    let yearlyCumulativeWithCPF = 0;

    for (let i = 0; i < cumulativeYearlyData.length; i++) {
      const yearData = cumulativeYearlyData[i];
      yearlyCumulativeWithCPF = yearData.cumulativeRevenueWithCPF;

      // Calculate Year-End Asset Value for Table
      const yearEndAssetValue = calculateTotalAssetValueForMonth(yearData.year, 11); // December value

      const totalValueWithCPF = yearlyCumulativeWithCPF + yearEndAssetValue;

      // For Revenue Break Even (only revenue)
      const revenueOnlyPercentageWithCPF = (yearlyCumulativeWithCPF / initialInvestment.totalInvestment) * 100;
      const recoveryPercentageWithCPF = (totalValueWithCPF / initialInvestment.totalInvestment) * 100;

      let statusWithCPF = "in Progress";
      let revenueOnlyStatusWithCPF = "in Progress";

      if (recoveryPercentageWithCPF >= 100) {
        statusWithCPF = "✔ Break-Even";
      } else if (recoveryPercentageWithCPF >= 75) {
        statusWithCPF = "75% Recovered";
      } else if (recoveryPercentageWithCPF >= 50) {
        statusWithCPF = "50% Recovered";
      }

      if (revenueOnlyPercentageWithCPF >= 100) {
        revenueOnlyStatusWithCPF = "✔ Break-Even";
      } else if (revenueOnlyPercentageWithCPF >= 75) {
        revenueOnlyStatusWithCPF = "75% Recovered";
      } else if (revenueOnlyPercentageWithCPF >= 50) {
        revenueOnlyStatusWithCPF = "50% Recovered";
      }

      breakEvenData.push({

        year: yearData.year,
        annualRevenueWithCPF: yearData.revenueWithCPF,
        cpfCost: yearData.cpfCost,
        cumulativeRevenueWithCPF: yearlyCumulativeWithCPF,
        assetValue: yearEndAssetValue,
        totalValueWithCPF: totalValueWithCPF,
        recoveryPercentageWithCPF: recoveryPercentageWithCPF,
        revenueOnlyPercentageWithCPF: revenueOnlyPercentageWithCPF,
        statusWithCPF: statusWithCPF,
        revenueOnlyStatusWithCPF: revenueOnlyStatusWithCPF,
        isBreakEvenWithCPF: breakEvenYearWithCPF === yearData.year,
        isRevenueBreakEvenWithCPF: revenueBreakEvenYearWithCPF === yearData.year,
        totalBuffaloes: yearData.totalBuffaloes,
        matureBuffaloes: yearData.matureBuffaloes
      });
    }


    return {
      breakEvenData,
      // Break Even Timeline data
      breakEvenYearWithCPF,
      breakEvenMonthWithCPF,
      exactBreakEvenDateWithCPF,
      // Revenue Break Even data
      revenueBreakEvenYearWithCPF,
      revenueBreakEvenMonthWithCPF,
      revenueExactBreakEvenDateWithCPF,
      initialInvestment: initialInvestment.totalInvestment,
      finalCumulativeRevenueWithCPF: cumulativeYearlyData[cumulativeYearlyData.length - 1]?.cumulativeRevenueWithCPF || 0
    };
  };

  const breakEvenAnalysis = calculateBreakEvenAnalysis();

  const calculateAssetMarketValue = () => {
    const assetValues = [];
    // Correctly calculate end year including partial years (same as index.jsx)
    const totalMonthsDuration = treeData.years * 12;
    const endYear = treeData.startYear + Math.floor((treeData.startMonth + totalMonthsDuration - 1) / 12);

    const absoluteStartMonth = treeData.startYear * 12 + treeData.startMonth;
    const absoluteEndMonth = absoluteStartMonth + (treeData.years * 12) - 1;
    const endMonthOfSimulation = absoluteEndMonth % 12;

    for (let year = treeData.startYear; year <= endYear; year++) {
      let totalAssetValue = 0;

      // Determine target month: December (11) for full years, or endMonthOfSimulation for the final year
      // Use 12 (January of next year equivalent) for full years to capture completed year valuation
      // If it is the end year AND endMonthOfSimulation is 11 (Dec), use 12 to treat it as a full completed year
      const targetMonth = (year === endYear && endMonthOfSimulation !== 11) ? endMonthOfSimulation : 12;

      const ageCategories = {
        '0-12 months': { count: 0, value: 0 },
        '13-18 months': { count: 0, value: 0 },
        '19-24 months': { count: 0, value: 0 },
        '25-34 months': { count: 0, value: 0 },
        '35-40 months': { count: 0, value: 0 },
        '41-48 months': { count: 0, value: 0 },
        '48+ months': { count: 0, value: 0 }
      };

      Object.values(buffaloDetails).forEach(buffalo => {
        // Only count buffaloes born before or in the last year/month
        if (buffalo.birthYear < year || (buffalo.birthYear === year && (buffalo.birthMonth || 0) <= targetMonth)) {
          const ageInMonths = calculateAgeInMonths(buffalo, year, targetMonth);
          const value = getBuffaloValueByAge(ageInMonths);
          totalAssetValue += value;

          if (ageInMonths >= 48) {
            ageCategories['48+ months'].count++;
            ageCategories['48+ months'].value += value;
          } else if (ageInMonths >= 41) {
            ageCategories['41-48 months'].count++;
            ageCategories['41-48 months'].value += value;
          } else if (ageInMonths >= 35) {
            ageCategories['35-40 months'].count++;
            ageCategories['35-40 months'].value += value;
          } else if (ageInMonths >= 25) {
            ageCategories['25-34 months'].count++;
            ageCategories['25-34 months'].value += value;
          } else if (ageInMonths >= 19) {
            ageCategories['19-24 months'].count++;
            ageCategories['19-24 months'].value += value;
          } else if (ageInMonths >= 13) {
            ageCategories['13-18 months'].count++;
            ageCategories['13-18 months'].value += value;
          } else {
            ageCategories['0-12 months'].count++;
            ageCategories['0-12 months'].value += value;
          }
        }
      });

      const yearData = yearlyData.find(d => d.year === year);

      assetValues.push({
        year: year,
        totalBuffaloes: yearData?.totalBuffaloes || 0,
        ageCategories: ageCategories,
        totalAssetValue: totalAssetValue,
        motherBuffaloes: ageCategories['48+ months'].count
      });
    }

    return assetValues;
  };

  const assetMarketValue = calculateAssetMarketValue();

  const calculateDetailedAssetValue = (year) => {
    const ageGroups = {
      '0-12 months': { count: 0, value: 0, unitValue: 10000 },
      '13-18 months': { count: 0, value: 0, unitValue: 25000 },
      '19-24 months': { count: 0, value: 0, unitValue: 40000 },
      '25-34 months': { count: 0, value: 0, unitValue: 100000 },
      '35-40 months': { count: 0, value: 0, unitValue: 150000 },
      '41-48 months': { count: 0, value: 0, unitValue: 175000 },
      '48+ months': { count: 0, value: 0, unitValue: 200000 }
    };

    let totalValue = 0;
    let totalCount = 0;

    Object.values(buffaloDetails).forEach(buffalo => {
      if (year >= buffalo.birthYear) {
        const ageInMonths = calculateAgeInMonths(buffalo, year, 11);
        const value = getBuffaloValueByAge(ageInMonths);

        if (ageInMonths > 48) {
          ageGroups['48+ months'].count++;
          ageGroups['48+ months'].value += value;
        } else if (ageInMonths >= 41) {
          ageGroups['41-48 months'].count++;
          ageGroups['41-48 months'].value += value;
        } else if (ageInMonths >= 35) {
          ageGroups['35-40 months'].count++;
          ageGroups['35-40 months'].value += value;
        } else if (ageInMonths >= 25) {
          ageGroups['25-34 months'].count++;
          ageGroups['25-34 months'].value += value;
        } else if (ageInMonths >= 19) {
          ageGroups['19-24 months'].count++;
          ageGroups['19-24 months'].value += value;
        } else if (ageInMonths >= 13) {
          ageGroups['13-18 months'].count++;
          ageGroups['13-18 months'].value += value;
        } else {
          ageGroups['0-12 months'].count++;
          ageGroups['0-12 months'].value += value;
        }

        totalValue += value;
        totalCount++;
      }
    });

    return { ageGroups, totalValue, totalCount };
  };

  const calculateCumulativeRevenueUntilYear = (unit, selectedYear) => {
    const cumulativeRevenue = {};
    const unitBuffaloes = Object.values(buffaloDetails).filter(buffalo => buffalo.unit === unit);

    unitBuffaloes.forEach(buffalo => {
      let total = 0;
      for (let year = treeData.startYear; year <= selectedYear; year++) {
        for (let month = 0; month < 12; month++) {
          total += monthlyRevenue[year]?.[month]?.buffaloes[buffalo.id] || 0;
        }
      }
      cumulativeRevenue[buffalo.id] = total;
    });

    return cumulativeRevenue;
  };

  const calculateTotalCumulativeRevenueUntilYear = (unit, selectedYear) => {
    const cumulativeRevenue = calculateCumulativeRevenueUntilYear(unit, selectedYear);
    return Object.values(cumulativeRevenue).reduce((sum, revenue) => sum + revenue, 0);
  };

  // Calculate dynamic year ranges
  const startYear = treeData.startYear;
  const endYear = startYear + treeData.years - 1;
  const yearRange = `${startYear}-${endYear}`;

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div className="bg-white rounded-lg shadow-lg m-4">
      <div className="min-h-full bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-8xl mx-auto">
          <div className="h-5"></div>



          <div className='w-full flex items-center justify-center text-white mb-8 flex-wrap gap-2'>
            <button
              onClick={() => setActiveTab("Monthly Revenue Break")}
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${activeTab === "Monthly Revenue Break"
                ? 'bg-green-500 text-black shadow-lg transform scale-105'
                : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
              Monthly Revenue Break
            </button>

            <button
              onClick={() => setActiveTab("Revenue Break Even")}
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${activeTab === "Revenue Break Even"
                ? 'bg-green-500 text-black shadow-lg transform scale-105'
                : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
              Revenue Break Even
            </button>
            <button
              onClick={() => setActiveTab("Asset Market Value")}
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${activeTab === "Asset Market Value"
                ? 'bg-green-500 text-black shadow-lg transform scale-105'
                : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
              Asset Market Value
            </button>
            <button
              onClick={() => setActiveTab("Herd Performance")}
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${activeTab === "Herd Performance"
                ? 'bg-green-500 text-black shadow-lg transform scale-105'
                : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
              Herd Performance
            </button>
            <button
              onClick={() => setActiveTab("Annual Herd Revenue")}
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${activeTab === "Annual Herd Revenue"
                ? 'bg-green-500 text-black shadow-lg transform scale-105'
                : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
              Annual Herd Revenue
            </button>
            <button
              onClick={() => setActiveTab("Break Even Timeline")}
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${activeTab === "Break Even Timeline"
                ? 'bg-green-500 text-black shadow-lg transform scale-105'
                : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
              Break Even Timeline
            </button>
            <button
              onClick={() => setActiveTab("Cattle Growing Fund")}
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${activeTab === "Cattle Growing Fund"
                ? 'bg-green-500 text-black shadow-lg transform scale-105'
                : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
              Cattle Growing Fund
            </button>
          </div>



          <div className='w-full'>
            {activeTab === "Monthly Revenue Break" && (
              <MonthlyRevenueBreak
                treeData={treeData}
                buffaloDetails={buffaloDetails}
                monthlyRevenue={monthlyRevenue}
                calculateAgeInMonths={calculateAgeInMonths}
                calculateCumulativeRevenueUntilYear={calculateCumulativeRevenueUntilYear}
                calculateTotalCumulativeRevenueUntilYear={calculateTotalCumulativeRevenueUntilYear}
                monthNames={monthNames}
                formatCurrency={formatCurrency}
                setHeaderStats={setHeaderStats}
              />
            )}

            {activeTab === "Break Even Timeline" && (
              <BreakEvenTimeline
                treeData={treeData}
                breakEvenAnalysis={breakEvenAnalysis}
                cpfToggle={cpfToggle}
                setCpfToggle={setCpfToggle}
                monthNames={monthNames}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === "Cattle Growing Fund" && (
              <CattleGrowingFund
                treeData={treeData}
                buffaloDetails={buffaloDetails}
                yearlyCPFCost={yearlyCPFCost}
                monthlyRevenue={monthlyRevenue}
                yearlyData={yearlyData}
                formatCurrency={formatCurrency}
                startYear={startYear}
                endYear={treeData.startYear + Math.floor((treeData.startMonth + (treeData.years * 12) - 1) / 12)}
                endMonth={(treeData.startMonth + (treeData.years * 12) - 1) % 12}
              />
            )}


            {activeTab === "Revenue Break Even" && (
              <RevenueBreakEven
                treeData={treeData}
                initialInvestment={initialInvestment}
                yearlyCPFCost={yearlyCPFCost}
                breakEvenAnalysis={breakEvenAnalysis}
                cpfToggle={cpfToggle}
                setCpfToggle={setCpfToggle}
                formatCurrency={formatCurrency}
                // Pass the revenue-only break-even dates
                revenueBreakEvenYearWithCPF={breakEvenAnalysis.revenueBreakEvenYearWithCPF}
                revenueBreakEvenMonthWithCPF={breakEvenAnalysis.revenueBreakEvenMonthWithCPF}
                revenueExactBreakEvenDateWithCPF={breakEvenAnalysis.revenueExactBreakEvenDateWithCPF}
              />
            )}

            {activeTab === "Asset Market Value" && (
              <AssetMarketValue
                treeData={treeData}
                buffaloDetails={buffaloDetails}
                calculateAgeInMonths={calculateAgeInMonths}
                getBuffaloValueByAge={getBuffaloValueByAge}
                getBuffaloValueDescription={getBuffaloValueDescription}
                calculateDetailedAssetValue={calculateDetailedAssetValue}
                assetMarketValue={assetMarketValue}
                formatCurrency={formatCurrency}
                startYear={startYear}
                endYear={treeData.startYear + Math.floor((treeData.startMonth + (treeData.years * 12) - 1) / 12)}
                endMonth={(treeData.startYear * 12 + treeData.startMonth + (treeData.years * 12) - 1) % 12}
                yearRange={yearRange}
                yearlyData={yearlyData}
                monthlyRevenue={monthlyRevenue}
                yearlyCPFCost={yearlyCPFCost}
              />
            )}

            {activeTab === "Herd Performance" && (
              <HerdPerformance
                yearlyData={yearlyData}
                activeGraph={activeGraph}
                setActiveGraph={setActiveGraph}
                startYear={startYear}
                endYear={endYear}
                yearRange={yearRange}
              />
            )}

            {activeTab === "Annual Herd Revenue" && (
              <AnnualHerdRevenue
                cumulativeYearlyData={cumulativeYearlyData}
                assetMarketValue={assetMarketValue}
                cpfToggle={cpfToggle}
                setCpfToggle={setCpfToggle}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                treeData={treeData}
                startYear={startYear}
                endYear={endYear}
                yearRange={yearRange}
              />
            )}
          </div>

          {/* CPF Explanation Note - Sticky Footer */}
          <div className="sticky bottom-0 z-40 mx-4 mt-8 mb-0 bg-blue-50/95 backdrop-blur-md border-l-4 border-blue-500 p-4 rounded-r shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ring-1 ring-blue-100">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-blue-800">Cattle Protection Fund (CPF): Income Guarantee & Asset Security</h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    Your income is guaranteed through the Cattle Protection Fund. This safety measure secures your animals,
                    decreases revenue risk, and ensures growing assets. It is a vital step for long-term stability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostEstimationTable;