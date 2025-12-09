import React, { useState } from 'react';
import MonthlyRevenueBreak from './MonthlyRevenueBreak';
import RevenueBreakEven from './RevenueBreakEven';
import AssetMarketValue from './AssetMarketValue';
import HerdPerformance from './HerdPerformance';
import AnnualHerdRevenue from './AnnualHerdRevenue';
import BreakEvenTimeline from './BreakEvenTimeline';
import { formatCurrency, formatNumber } from '../BuffaloFamilyTree/CommonComponents';

const CostEstimationTable = ({
  treeData,
  activeGraph,
  setActiveGraph,
  onBack
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
    const birthMonth = buffalo.birthMonth || 0;
    const totalMonths = (targetYear - birthYear) * 12 + (targetMonth - birthMonth);
    return Math.max(0, totalMonths);
  };

  const getBuffaloDetails = () => {
    const buffaloDetails = {};
    let buffaloCounter = 1;

    treeData.buffaloes.forEach(buffalo => {
      if (buffalo.generation === 0) {
        const unit = buffalo.unit || 1;
        const buffaloId = `M${buffaloCounter}`;
        buffaloDetails[buffalo.id] = {
          id: buffaloId,
          originalId: buffalo.id,
          generation: buffalo.generation,
          unit: unit,
          acquisitionMonth: buffalo.acquisitionMonth,
          birthYear: treeData.startYear - 5,
          birthMonth: buffalo.birthMonth || 0,
          parentId: buffalo.parentId,
          children: [],
          grandchildren: []
        };
        buffaloCounter++;
      }
    });

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
            birthYear: treeData.startYear,
            birthMonth: 0,
            parentId: mother.originalId,
            children: [],
            grandchildren: []
          };
          mother.children.push(buffalo.id);
          calfCounter++;
        }
      }
    });

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

  const calculateYearlyCPFCost = () => {
    const buffaloDetails = getBuffaloDetails();
    const cpfCostByYear = {};

    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      let totalCPFCost = 0;

      for (let unit = 1; unit <= treeData.units; unit++) {
        let unitCPFCost = 0;
        const unitBuffaloes = Object.values(buffaloDetails).filter(buffalo => buffalo.unit === unit);

        unitBuffaloes.forEach(buffalo => {
          if (buffalo.id === 'M1') {
            unitCPFCost += 13000;
          } else if (buffalo.id === 'M2') {
            // No CPF
          } else if (buffalo.generation === 1 || buffalo.generation === 2) {
            const ageInMonths = calculateAgeInMonths(buffalo, year, 11);
            if (ageInMonths >= 36) {
              unitCPFCost += 13000;
            }
          }
        });

        totalCPFCost += unitCPFCost;
      }

      cpfCostByYear[year] = totalCPFCost;
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
        cumulativeRevenueWithoutCPF: cumulativeRevenueWithoutCPF,
        cumulativeRevenueWithCPF: cumulativeRevenueWithCPF,
        cumulativeCPFCost: cumulativeRevenueWithoutCPF - cumulativeRevenueWithCPF
      });
    });

    return cumulativeData;
  };

  const cumulativeYearlyData = calculateCumulativeRevenueData();

  const getBuffaloValueByAge = (ageInMonths) => {
    if (ageInMonths >= 60) {
      return 175000;
    } else if (ageInMonths >= 48) {
      return 150000;
    } else if (ageInMonths >= 40) {
      return 100000;
    } else if (ageInMonths >= 36) {
      return 50000;
    } else if (ageInMonths >= 30) {
      return 50000;
    } else if (ageInMonths >= 24) {
      return 35000;
    } else if (ageInMonths >= 18) {
      return 25000;
    } else if (ageInMonths >= 12) {
      return 12000;
    } else if (ageInMonths >= 6) {
      return 6000;
    } else {
      return 3000;
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

  const calculateMonthlyRevenueForBuffalo = (acquisitionMonth, currentMonth, currentYear, startYear) => {
    const monthsSinceAcquisition = (currentYear - startYear) * 12 + (currentMonth - acquisitionMonth);

    if (monthsSinceAcquisition < 2) {
      return 0;
    }

    const productionMonth = monthsSinceAcquisition - 2;
    const cycleMonth = productionMonth % 12;

    if (cycleMonth < 5) {
      return 9000;
    } else if (cycleMonth < 8) {
      return 6000;
    } else {
      return 0;
    }
  };

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

        if (year >= buffalo.birthYear + 3) {
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

  const calculateBreakEvenAnalysis = () => {
    let cumulativeRevenueWithoutCPF = 0;
    let cumulativeRevenueWithCPF = 0;
    const breakEvenData = [];
    let breakEvenYearWithoutCPF = null;
    let breakEvenMonthWithoutCPF = null;
    let breakEvenYearWithCPF = null;
    let breakEvenMonthWithCPF = null;
    let exactBreakEvenDateWithoutCPF = null;
    let exactBreakEvenDateWithCPF = null;
    
    // For Revenue Break Even - Only compare cumulative revenue (without asset value)
    let revenueBreakEvenYearWithoutCPF = null;
    let revenueBreakEvenMonthWithoutCPF = null;
    let revenueBreakEvenYearWithCPF = null;
    let revenueBreakEvenMonthWithCPF = null;
    let revenueExactBreakEvenDateWithoutCPF = null;
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

    // Break Even Timeline Calculation (Revenue + Asset Value)
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      for (let month = 0; month < 12; month++) {
        cumulativeRevenueWithoutCPF += investorMonthlyRevenue[year][month];

        // Calculate Asset Value for this month
        const currentAssetValue = calculateTotalAssetValueForMonth(year, month);
        const totalValueWithoutCPF = cumulativeRevenueWithoutCPF + currentAssetValue;

        if (totalValueWithoutCPF >= initialInvestment.totalInvestment && !breakEvenYearWithoutCPF) {
          breakEvenYearWithoutCPF = year;
          breakEvenMonthWithoutCPF = month;

          const startDate = new Date(treeData.startYear, treeData.startMonth, treeData.startDay || 1);
          const monthsSinceStart = (year - treeData.startYear) * 12 + (month - treeData.startMonth);
          const breakEvenDate = new Date(startDate);
          breakEvenDate.setMonth(breakEvenDate.getMonth() + monthsSinceStart);

          const lastDayOfMonth = new Date(breakEvenDate.getFullYear(), breakEvenDate.getMonth() + 1, 0).getDate();
          breakEvenDate.setDate(lastDayOfMonth);

          exactBreakEvenDateWithoutCPF = breakEvenDate;
        }
      }
      if (breakEvenYearWithoutCPF) break;
    }

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

    // Revenue Break Even Calculation (Only Cumulative Revenue)
    let revenueCumulativeWithoutCPF = 0;
    let revenueCumulativeWithCPF = 0;
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      for (let month = 0; month < 12; month++) {
        revenueCumulativeWithoutCPF += investorMonthlyRevenue[year][month];
        
        if (revenueCumulativeWithoutCPF >= initialInvestment.totalInvestment && !revenueBreakEvenYearWithoutCPF) {
          revenueBreakEvenYearWithoutCPF = year;
          revenueBreakEvenMonthWithoutCPF = month;

          const startDate = new Date(treeData.startYear, treeData.startMonth, treeData.startDay || 1);
          const monthsSinceStart = (year - treeData.startYear) * 12 + (month - treeData.startMonth);
          const breakEvenDate = new Date(startDate);
          breakEvenDate.setMonth(breakEvenDate.getMonth() + monthsSinceStart);

          const lastDayOfMonth = new Date(breakEvenDate.getFullYear(), breakEvenDate.getMonth() + 1, 0).getDate();
          breakEvenDate.setDate(lastDayOfMonth);

          revenueExactBreakEvenDateWithoutCPF = breakEvenDate;
        }
      }
      if (revenueBreakEvenYearWithoutCPF) break;
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

    let yearlyCumulativeWithoutCPF = 0;
    let yearlyCumulativeWithCPF = 0;

    for (let i = 0; i < cumulativeYearlyData.length; i++) {
      const yearData = cumulativeYearlyData[i];
      yearlyCumulativeWithoutCPF = yearData.cumulativeRevenueWithoutCPF;
      yearlyCumulativeWithCPF = yearData.cumulativeRevenueWithCPF;

      // Calculate Year-End Asset Value for Table
      const yearEndAssetValue = calculateTotalAssetValueForMonth(yearData.year, 11); // December value

      const totalValueWithoutCPF = yearlyCumulativeWithoutCPF + yearEndAssetValue;
      const totalValueWithCPF = yearlyCumulativeWithCPF + yearEndAssetValue;

      // For Revenue Break Even (only revenue)
      const revenueOnlyPercentageWithoutCPF = (yearlyCumulativeWithoutCPF / initialInvestment.totalInvestment) * 100;
      const revenueOnlyPercentageWithCPF = (yearlyCumulativeWithCPF / initialInvestment.totalInvestment) * 100;

      const recoveryPercentageWithoutCPF = (totalValueWithoutCPF / initialInvestment.totalInvestment) * 100;
      const recoveryPercentageWithCPF = (totalValueWithCPF / initialInvestment.totalInvestment) * 100;

      let statusWithoutCPF = "in Progress";
      let revenueOnlyStatusWithoutCPF = "in Progress";
      
      if (recoveryPercentageWithoutCPF >= 100) {
        statusWithoutCPF = "✔ Break-Even";
      } else if (recoveryPercentageWithoutCPF >= 75) {
        statusWithoutCPF = "75% Recovered";
      } else if (recoveryPercentageWithoutCPF >= 50) {
        statusWithoutCPF = "50% Recovered";
      }

      if (revenueOnlyPercentageWithoutCPF >= 100) {
        revenueOnlyStatusWithoutCPF = "✔ Break-Even";
      } else if (revenueOnlyPercentageWithoutCPF >= 75) {
        revenueOnlyStatusWithoutCPF = "75% Recovered";
      } else if (revenueOnlyPercentageWithoutCPF >= 50) {
        revenueOnlyStatusWithoutCPF = "50% Recovered";
      }

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
        annualRevenueWithoutCPF: yearData.revenueWithoutCPF,
        annualRevenueWithCPF: yearData.revenueWithCPF,
        cpfCost: yearData.cpfCost,
        cumulativeRevenueWithoutCPF: yearlyCumulativeWithoutCPF,
        cumulativeRevenueWithCPF: yearlyCumulativeWithCPF,
        assetValue: yearEndAssetValue,
        totalValueWithoutCPF: totalValueWithoutCPF,
        totalValueWithCPF: totalValueWithCPF,
        recoveryPercentageWithoutCPF: recoveryPercentageWithoutCPF,
        recoveryPercentageWithCPF: recoveryPercentageWithCPF,
        revenueOnlyPercentageWithoutCPF: revenueOnlyPercentageWithoutCPF,
        revenueOnlyPercentageWithCPF: revenueOnlyPercentageWithCPF,
        statusWithoutCPF: statusWithoutCPF,
        statusWithCPF: statusWithCPF,
        revenueOnlyStatusWithoutCPF: revenueOnlyStatusWithoutCPF,
        revenueOnlyStatusWithCPF: revenueOnlyStatusWithCPF,
        isBreakEvenWithoutCPF: breakEvenYearWithoutCPF === yearData.year,
        isBreakEvenWithCPF: breakEvenYearWithCPF === yearData.year,
        isRevenueBreakEvenWithoutCPF: revenueBreakEvenYearWithoutCPF === yearData.year,
        isRevenueBreakEvenWithCPF: revenueBreakEvenYearWithCPF === yearData.year,
        totalBuffaloes: yearData.totalBuffaloes,
        matureBuffaloes: yearData.matureBuffaloes
      });
    }

    return {
      breakEvenData,
      // Break Even Timeline data
      breakEvenYearWithoutCPF,
      breakEvenMonthWithoutCPF,
      breakEvenYearWithCPF,
      breakEvenMonthWithCPF,
      exactBreakEvenDateWithoutCPF,
      exactBreakEvenDateWithCPF,
      // Revenue Break Even data
      revenueBreakEvenYearWithoutCPF,
      revenueBreakEvenMonthWithoutCPF,
      revenueBreakEvenYearWithCPF,
      revenueBreakEvenMonthWithCPF,
      revenueExactBreakEvenDateWithoutCPF,
      revenueExactBreakEvenDateWithCPF,
      initialInvestment: initialInvestment.totalInvestment,
      finalCumulativeRevenueWithoutCPF: cumulativeYearlyData[cumulativeYearlyData.length - 1]?.cumulativeRevenueWithoutCPF || 0,
      finalCumulativeRevenueWithCPF: cumulativeYearlyData[cumulativeYearlyData.length - 1]?.cumulativeRevenueWithCPF || 0
    };
  };

  const breakEvenAnalysis = calculateBreakEvenAnalysis();

  const calculateAssetMarketValue = () => {
    const assetValues = [];
    const endYear = treeData.startYear + 9;

    for (let year = treeData.startYear; year <= endYear; year++) {
      let totalAssetValue = 0;

      const ageCategories = {
        '0-6 months': { count: 0, value: 0 },
        '6-12 months': { count: 0, value: 0 },
        '12-18 months': { count: 0, value: 0 },
        '18-24 months': { count: 0, value: 0 },
        '24-30 months': { count: 0, value: 0 },
        '30-36 months': { count: 0, value: 0 },
        '36-40 months': { count: 0, value: 0 },
        '40-48 months': { count: 0, value: 0 },
        '48-60 months': { count: 0, value: 0 },
        '60+ months (Mother Buffalo)': { count: 0, value: 0 }
      };

      Object.values(buffaloDetails).forEach(buffalo => {
        if (year >= buffalo.birthYear) {
          const ageInMonths = calculateAgeInMonths(buffalo, year, 11);
          const value = getBuffaloValueByAge(ageInMonths);
          totalAssetValue += value;

          if (ageInMonths >= 60) {
            ageCategories['60+ months (Mother Buffalo)'].count++;
            ageCategories['60+ months (Mother Buffalo)'].value += value;
          } else if (ageInMonths >= 48) {
            ageCategories['48-60 months'].count++;
            ageCategories['48-60 months'].value += value;
          } else if (ageInMonths >= 40) {
            ageCategories['40-48 months'].count++;
            ageCategories['40-48 months'].value += value;
          } else if (ageInMonths >= 36) {
            ageCategories['36-40 months'].count++;
            ageCategories['36-40 months'].value += value;
          } else if (ageInMonths >= 30) {
            ageCategories['30-36 months'].count++;
            ageCategories['30-36 months'].value += value;
          } else if (ageInMonths >= 24) {
            ageCategories['24-30 months'].count++;
            ageCategories['24-30 months'].value += value;
          } else if (ageInMonths >= 18) {
            ageCategories['18-24 months'].count++;
            ageCategories['18-24 months'].value += value;
          } else if (ageInMonths >= 12) {
            ageCategories['12-18 months'].count++;
            ageCategories['12-18 months'].value += value;
          } else if (ageInMonths >= 6) {
            ageCategories['6-12 months'].count++;
            ageCategories['6-12 months'].value += value;
          } else {
            ageCategories['0-6 months'].count++;
            ageCategories['0-6 months'].value += value;
          }
        }
      });

      const yearData = yearlyData.find(d => d.year === year);

      assetValues.push({
        year: year,
        totalBuffaloes: yearData?.totalBuffaloes || 0,
        ageCategories: ageCategories,
        totalAssetValue: totalAssetValue,
        motherBuffaloes: ageCategories['60+ months (Mother Buffalo)'].count
      });
    }

    return assetValues;
  };

  const assetMarketValue = calculateAssetMarketValue();

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

  const calculateCumulativeRevenueUntilYear = (unit, selectedYear) => {
    const buffaloDetails = getBuffaloDetails();
    const unitBuffaloes = Object.values(buffaloDetails).filter(buffalo => buffalo.unit === unit);
    const cumulativeRevenue = {};

    const monthlyRevenue = {};
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      monthlyRevenue[year] = {};
      for (let month = 0; month < 12; month++) {
        monthlyRevenue[year][month] = {
          total: 0,
          buffaloes: {}
        };
      }
    }

    unitBuffaloes.forEach(buffalo => {
      for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
        if (year >= buffalo.birthYear + 3) {
          for (let month = 0; month < 12; month++) {
            const revenue = calculateMonthlyRevenueForBuffalo(
              buffalo.acquisitionMonth,
              month,
              year,
              treeData.startYear
            );
            if (revenue > 0) {
              monthlyRevenue[year][month].buffaloes[buffalo.id] = revenue;
            }
          }
        }
      }
    });

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
    <div className="h-full overflow-auto bg-white rounded-lg shadow-lg m-4">
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
                startYear={startYear}
                endYear={endYear}
                yearRange={yearRange}
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
                revenueBreakEvenYearWithoutCPF={breakEvenAnalysis.revenueBreakEvenYearWithoutCPF}
                revenueBreakEvenMonthWithoutCPF={breakEvenAnalysis.revenueBreakEvenMonthWithoutCPF}
                revenueBreakEvenYearWithCPF={breakEvenAnalysis.revenueBreakEvenYearWithCPF}
                revenueBreakEvenMonthWithCPF={breakEvenAnalysis.revenueBreakEvenMonthWithCPF}
                revenueExactBreakEvenDateWithoutCPF={breakEvenAnalysis.revenueExactBreakEvenDateWithoutCPF}
                revenueExactBreakEvenDateWithCPF={breakEvenAnalysis.revenueExactBreakEvenDateWithCPF}
              />
            )}

            {activeTab === "Asset Market Value" && (
              <>
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
                  endYear={endYear}
                  yearRange={yearRange}
                  isAssetMarketValue={true}
                />
              </>
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
        </div>
      </div>
    </div>
  );
};

export default CostEstimationTable;