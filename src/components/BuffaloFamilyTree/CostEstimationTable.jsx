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
  const [activeTab, SetActiveTab] = useState("Monthly Revenue Break");
  const [cpfToggle, setCpfToggle] = useState("withCPF"); // "withCPF" or "withoutCPF"

  const { yearlyData, totalRevenue, totalUnits, totalMatureBuffaloYears } = treeData.revenueData;
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];


     const calculateAgeInMonths = (buffalo, targetYear, targetMonth = 0) => {
    const birthYear = buffalo.birthYear;
    const birthMonth = buffalo.birthMonth || 0; // January if not specified

    const totalMonths = (targetYear - birthYear) * 12 + (targetMonth - birthMonth);
    return Math.max(0, totalMonths);
  };
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

  // Calculate CPF cost for each year
  const calculateYearlyCPFCost = () => {
    const buffaloDetails = getBuffaloDetails();
    const cpfCostByYear = {};

    // For each year from startYear to startYear + years
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      let totalCPFCost = 0;
      
      // For each unit
      for (let unit = 1; unit <= treeData.units; unit++) {
        let unitCPFCost = 0;
        
        // Get buffaloes for this unit
        const unitBuffaloes = Object.values(buffaloDetails).filter(buffalo => buffalo.unit === unit);
        
        // Calculate CPF for each buffalo in this unit for this year
        unitBuffaloes.forEach(buffalo => {
          // M1 always has CPF (from the beginning)
          if (buffalo.id === 'M1') {
            unitCPFCost += 13000;
          }
          // M2 never has CPF
          else if (buffalo.id === 'M2') {
            // No CPF
          }
          // Children: Only have CPF after age 3 (36 months)
          else if (buffalo.generation === 1 || buffalo.generation === 2) {
            const ageInMonths = calculateAgeInMonths(buffalo, year, 11); // Age at end of year
            if (ageInMonths >= 36) { // Age 3 years = 36 months
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

  // Calculate yearly data with CPF
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

  // Calculate cumulative revenue data with CPF
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

  // Calculate cumulative revenue until a specific year for each buffalo
  const calculateCumulativeRevenueUntilYear = (unit, selectedYear) => {
    const buffaloDetails = getBuffaloDetails();
    const unitBuffaloes = Object.values(buffaloDetails).filter(buffalo => buffalo.unit === unit);
    const cumulativeRevenue = {};
    
    // Initialize revenue structure
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

    // Calculate revenue for each buffalo
    unitBuffaloes.forEach(buffalo => {
      for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
        if (year >= buffalo.birthYear + 3) { // Buffalo becomes productive at age 3
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

    // Calculate cumulative revenue for each buffalo until selected year
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

  // Calculate total cumulative revenue until selected year
  const calculateTotalCumulativeRevenueUntilYear = (unit, selectedYear) => {
    const cumulativeRevenue = calculateCumulativeRevenueUntilYear(unit, selectedYear);
    return Object.values(cumulativeRevenue).reduce((sum, revenue) => sum + revenue, 0);
  };

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
  const CPF_PER_UNIT = 13000; // CPF for ONE unit (covers both M1 and M2)

  // CORRECTED: Calculate initial investment - 2 mother buffaloes @ ₹1.75 lakhs each + their 2 calves (included free)
  // CPF is only ₹13,000 for the entire unit (not per buffalo)
  const calculateInitialInvestment = () => {
    const motherBuffaloCost = treeData.units * 2 * MOTHER_BUFFALO_PRICE; // 2 mother buffaloes per unit @ ₹1.75L each
    const cpfCost = treeData.units * CPF_PER_UNIT; // Only ₹13,000 per unit (not per buffalo)
    return {
      motherBuffaloCost,
      cpfCost,
      totalInvestment: motherBuffaloCost + cpfCost,
      totalBuffaloesAtStart: treeData.units * 4, // 2 mothers + 2 calves per unit
      motherBuffaloes: treeData.units * 2,
      calvesAtStart: treeData.units * 2,
      pricePerMotherBuffalo: MOTHER_BUFFALO_PRICE,
      cpfPerUnit: CPF_PER_UNIT
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
 

  // Detailed buffalo tracking with IDs and relationships
  

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

  // Calculate Revenue Break-Even Analysis with exact date - UPDATED FOR BOTH WITH AND WITHOUT CPF
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

    // Check monthly break-even for WITHOUT CPF
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      for (let month = 0; month < 12; month++) {
        cumulativeRevenueWithoutCPF += investorMonthlyRevenue[year][month];

        if (cumulativeRevenueWithoutCPF >= initialInvestment.totalInvestment && !breakEvenYearWithoutCPF) {
          breakEvenYearWithoutCPF = year;
          breakEvenMonthWithoutCPF = month;
          
          // Calculate the exact date by adding months to the start date
          const startDate = new Date(treeData.startYear, treeData.startMonth, treeData.startDay || 1);
          const monthsSinceStart = (year - treeData.startYear) * 12 + (month - treeData.startMonth);
          const breakEvenDate = new Date(startDate);
          breakEvenDate.setMonth(breakEvenDate.getMonth() + monthsSinceStart);
          
          // Set to last day of month since revenue is received monthly
          const lastDayOfMonth = new Date(breakEvenDate.getFullYear(), breakEvenDate.getMonth() + 1, 0).getDate();
          breakEvenDate.setDate(lastDayOfMonth);
          
          exactBreakEvenDateWithoutCPF = breakEvenDate;
        }
      }
      if (breakEvenYearWithoutCPF) break;
    }

    // Reset and check monthly break-even for WITH CPF
    let tempCumulativeWithCPF = 0;
    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
      const annualCPFCost = yearlyCPFCost[year] || 0;
      for (let month = 0; month < 12; month++) {
        tempCumulativeWithCPF += investorMonthlyRevenue[year][month];
        // Subtract CPF cost proportionally (1/12 of annual CPF each month)
        tempCumulativeWithCPF -= (annualCPFCost / 12);

        if (tempCumulativeWithCPF >= initialInvestment.totalInvestment && !breakEvenYearWithCPF) {
          breakEvenYearWithCPF = year;
          breakEvenMonthWithCPF = month;
          
          // Calculate the exact date by adding months to the start date
          const startDate = new Date(treeData.startYear, treeData.startMonth, treeData.startDay || 1);
          const monthsSinceStart = (year - treeData.startYear) * 12 + (month - treeData.startMonth);
          const breakEvenDate = new Date(startDate);
          breakEvenDate.setMonth(breakEvenDate.getMonth() + monthsSinceStart);
          
          // Set to last day of month since revenue is received monthly
          const lastDayOfMonth = new Date(breakEvenDate.getFullYear(), breakEvenDate.getMonth() + 1, 0).getDate();
          breakEvenDate.setDate(lastDayOfMonth);
          
          exactBreakEvenDateWithCPF = breakEvenDate;
        }
      }
      if (breakEvenYearWithCPF) break;
    }

    // Yearly break-even data for table
    let yearlyCumulativeWithoutCPF = 0;
    let yearlyCumulativeWithCPF = 0;
    
    for (let i = 0; i < cumulativeYearlyData.length; i++) {
      const yearData = cumulativeYearlyData[i];
      yearlyCumulativeWithoutCPF = yearData.cumulativeRevenueWithoutCPF;
      yearlyCumulativeWithCPF = yearData.cumulativeRevenueWithCPF;
      
      const recoveryPercentageWithoutCPF = (yearlyCumulativeWithoutCPF / initialInvestment.totalInvestment) * 100;
      const recoveryPercentageWithCPF = (yearlyCumulativeWithCPF / initialInvestment.totalInvestment) * 100;
      
      let statusWithoutCPF = "in Progress";
      if (recoveryPercentageWithoutCPF >= 100) {
        statusWithoutCPF = "✔ Break-Even";
      } else if (recoveryPercentageWithoutCPF >= 75) {
        statusWithoutCPF = "75% Recovered";
      } else if (recoveryPercentageWithoutCPF >= 50) {
        statusWithoutCPF = "50% Recovered";
      }

      let statusWithCPF = "in Progress";
      if (recoveryPercentageWithCPF >= 100) {
        statusWithCPF = "✔ Break-Even";
      } else if (recoveryPercentageWithCPF >= 75) {
        statusWithCPF = "75% Recovered";
      } else if (recoveryPercentageWithCPF >= 50) {
        statusWithCPF = "50% Recovered";
      }

      breakEvenData.push({
        year: yearData.year,
        annualRevenueWithoutCPF: yearData.revenueWithoutCPF,
        annualRevenueWithCPF: yearData.revenueWithCPF,
        cpfCost: yearData.cpfCost,
        cumulativeRevenueWithoutCPF: yearlyCumulativeWithoutCPF,
        cumulativeRevenueWithCPF: yearlyCumulativeWithCPF,
        recoveryPercentageWithoutCPF: recoveryPercentageWithoutCPF,
        recoveryPercentageWithCPF: recoveryPercentageWithCPF,
        statusWithoutCPF: statusWithoutCPF,
        statusWithCPF: statusWithCPF,
        isBreakEvenWithoutCPF: breakEvenYearWithoutCPF === yearData.year,
        isBreakEvenWithCPF: breakEvenYearWithCPF === yearData.year,
        totalBuffaloes: yearData.totalBuffaloes,
        matureBuffaloes: yearData.matureBuffaloes
      });
    }

    return {
      breakEvenData,
      breakEvenYearWithoutCPF,
      breakEvenMonthWithoutCPF,
      breakEvenYearWithCPF,
      breakEvenMonthWithCPF,
      exactBreakEvenDateWithoutCPF,
      exactBreakEvenDateWithCPF,
      initialInvestment: initialInvestment.totalInvestment,
      finalCumulativeRevenueWithoutCPF: cumulativeYearlyData[cumulativeYearlyData.length - 1]?.cumulativeRevenueWithoutCPF || 0,
      finalCumulativeRevenueWithCPF: cumulativeYearlyData[cumulativeYearlyData.length - 1]?.cumulativeRevenueWithCPF || 0
    };
  };

  const breakEvenAnalysis = calculateBreakEvenAnalysis();

  // Calculate Asset Market Value based on age-based pricing - UPDATED to show only until 2035
  const calculateAssetMarketValue = () => {
    const assetValues = [];
    
    // For 10 years from 2026 to 2035
    const endYear = treeData.startYear + 9; // 2026 + 9 = 2035

    // Calculate asset value for each year from startYear to endYear
    for (let year = treeData.startYear; year <= endYear; year++) {
      let totalAssetValue = 0;
      
      // Count buffaloes by age category
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

      // Sum values of all buffaloes alive in this year
      Object.values(buffaloDetails).forEach(buffalo => {
        if (year >= buffalo.birthYear) { // Buffalo is alive
          const ageInMonths = calculateAgeInMonths(buffalo, year, 11); // Age at end of year
          const value = getBuffaloValueByAge(ageInMonths);
          totalAssetValue += value;

          // Categorize by age
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
        // Also include mother buffaloes count (60+ months)
        motherBuffaloes: ageCategories['60+ months (Mother Buffalo)'].count
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
      <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-3xl p-10 xl:py-5 shadow-2xl border border-purple-200 mb-16 xl:mb-8 xl:mx-25">
        <h2 className="text-4xl xl:text-3xl font-bold text-purple-800 mb-10 xl:mb-7 text-center flex items-center justify-center gap-4">
          <span className="text-5xl xl:text-3xl">💰</span>
          Buffalo Value By Age (Market Valuation)
        </h2>
        <div className='grid xl:grid-cols-2 md:grid-cols-1'>
          {/* Year Selection */}
          <div className="bg-white rounded-2xl p-6 border border-purple-200 mb-8 max-w-md mx-auto xl:w-100 xl:h-">
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Select Year for Valuation:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full p-3 xl:p-2 border border-purple-300 rounded-xl xl:text-sm"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={treeData.startYear + i}>
                  {treeData.startYear + i} (Year {i + 1})
                </option>
              ))}
            </select>
          </div>
          {/* Total Value Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 xl:p-4 xl:w-sm   text-white text-center shadow-2xl mb-8">
            <div className="text-2xl font-bold mb-2 xl:text-xl">Total Asset Value in {selectedYear}</div>
            <div className="text-5xl font-bold mb-4 xl:text-2xl">{formatCurrency(detailedAssetValue.totalValue)}</div>
            <div className="text-lg opacity-90 xl:text-sm">
              {detailedAssetValue.totalCount} buffaloes | Average: {formatCurrency(detailedAssetValue.totalValue / detailedAssetValue.totalCount)}
            </div>
          </div>

        </div>

        {/* Age Group Breakdown */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg mb-8 xl:w-">
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
                          <div className="w-full bg-gray-200 rounded-sm h-4">
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
          <h3 className="text-2xl font-bold text-black-800 mb-6 text-center"> Age-Based Price Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4   gap-6">
            {[
              { age: '0-6 months ', price: '₹3,000', color: 'from-blue-100 to-blue-200', desc: 'New born calves' },
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
                className={`bg-gradient-to-br ${item.color} rounded-xl p-6 xl:p-4 border border-gray-200 shadow-lg`}
              >
                <div className="text-xl font-bold text-gray-800 mb-2">{item.age}</div>
                <div className="text-xl font-bold text-gray-900">{item.price}</div>
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

    // CORRECTED: Calculate CPF cost for milk-producing buffaloes
    // Only M1 has CPF initially. Children get CPF after they become mature (age >= 3 years)
    const calculateCPFCost = () => {
      let milkProducingBuffaloesWithCPF = 0;
      const buffaloCPFDetails = [];

      unitBuffaloes.forEach(buffalo => {
        // M1 has CPF (it's the buffalo that comes with CPF)
        if (buffalo.id === 'M1') {
          milkProducingBuffaloesWithCPF++;
          buffaloCPFDetails.push({ id: buffalo.id, hasCPF: true, reason: 'M1 (Comes with CPF)' });
        }
        // M2 does NOT have CPF (free buffalo without CPF)
        else if (buffalo.id === 'M2') {
          buffaloCPFDetails.push({ id: buffalo.id, hasCPF: false, reason: 'M2 (No CPF)' });
        }
        // Children: Only have CPF after they become mature (age >= 3 years)
        else if (buffalo.generation === 1 || buffalo.generation === 2) {
          const ageInMonths = calculateAgeInMonths(buffalo, selectedYear, 11);
          const hasCPF = ageInMonths >= 36; // Age 3 years = 36 months
          if (hasCPF) {
            milkProducingBuffaloesWithCPF++;
          }
          buffaloCPFDetails.push({ 
            id: buffalo.id, 
            hasCPF: hasCPF, 
            reason: hasCPF ? 'Child (Age ≥ 3 years)' : 'Child (Age < 3 years, no CPF)' 
          });
        }
      });

      // CPF cost: ₹13,000 per buffalo that qualifies for CPF
      const annualCPFCost = milkProducingBuffaloesWithCPF * 13000;
      const monthlyCPFCost = annualCPFCost / 12;

      return {
        milkProducingBuffaloes: unitBuffaloes.length,
        milkProducingBuffaloesWithCPF,
        annualCPFCost,
        monthlyCPFCost: Math.round(monthlyCPFCost),
        buffaloCPFDetails
      };
    };

    const cpfCost = calculateCPFCost();
    
    // Calculate cumulative revenue until selected year for each buffalo
    const cumulativeRevenueUntilYear = calculateCumulativeRevenueUntilYear(selectedUnit, selectedYear);
    const totalCumulativeUntilYear = calculateTotalCumulativeRevenueUntilYear(selectedUnit, selectedYear);

    // Calculate CPF cumulative cost until selected year
    const calculateCumulativeCPFCost = () => {
      let totalCPFUntilYear = 0;
      
      // For each year from start to selected year
      for (let year = treeData.startYear; year <= selectedYear; year++) {
        // Get unit buffaloes that existed in this year
        const buffaloesInYear = Object.values(buffaloDetails)
          .filter(buffalo => buffalo.unit === selectedUnit && year >= buffalo.birthYear);
        
        // Count CPF-qualifying buffaloes for this year
        let cpfCount = 0;
        buffaloesInYear.forEach(buffalo => {
          // M1 always has CPF (from the beginning)
          if (buffalo.id === 'M1') {
            cpfCount++;
          }
          // M2 never has CPF
          else if (buffalo.id === 'M2') {
            // No CPF
          }
          // Children: Only have CPF after age 3
          else if (buffalo.generation === 1 || buffalo.generation === 2) {
            const ageInMonths = calculateAgeInMonths(buffalo, year, 11);
            if (ageInMonths >= 36) { // Age 3 years = 36 months
              cpfCount++;
            }
          }
        });
        
        totalCPFUntilYear += cpfCount * 13000;
      }
      
      return totalCPFUntilYear;
    };

    const cumulativeCPFCost = calculateCumulativeCPFCost();
    const cumulativeNetRevenue = totalCumulativeUntilYear - cumulativeCPFCost;

    // Download Excel function
    const downloadExcel = () => {
      // Create CSV content
      let csvContent = "Monthly Revenue Breakdown - Unit " + selectedUnit + " - " + selectedYear + "\n\n";

      // Headers
      csvContent += "Month,";
      unitBuffaloes.forEach(buffalo => {
        csvContent += buffalo.id + ",";
      });
      csvContent += "Unit Total,CPF Cost,Net Revenue,Cumulative Revenue Until " + selectedYear + "\n";

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
        csvContent += unitTotal + "," + cpfCost.monthlyCPFCost + "," + netRevenue + "," + totalCumulativeUntilYear + "\n";
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
      csvContent += yearlyUnitTotal + "," + cpfCost.annualCPFCost + "," + yearlyNetRevenue + "," + totalCumulativeUntilYear + "\n";

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
      <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-3xl  p-10 shadow-2xl border border-blue-200 mb-16 xl:mx-20">
        <h2 className="text-3xl font-bold text-black-800 mb-8 text-center flex items-center justify-center gap-4">
          Monthly Revenue - Income Producing Buffaloes Only
        </h2>

        {/* Year and Unit Selection with Download Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:flex xl:justify-center  gap-6 mb-5 ">
          <div className="bg-white rounded-2xl py-4 pl-6 xl:w-60 xl:h-25 border border-blue-200">
            <label className="block text-sm font-semibold text-blue-700 mb-4 ">
              Select Year:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full p-3 border border-blue-300 rounded-xl xl:text-sm  xl:p-1 xl:w-1/2"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={treeData.startYear + i}>
                  {treeData.startYear + i}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl py-4 pl-6 xl:w-60 xl:h-25 border border-blue-200">
            <label className="block text-lg  xl:text-sm font-semibold text-blue-700 mb-3">
              Select Unit:
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(parseInt(e.target.value))}
              className="w-full p-3 border border-blue-300 rounded-xl text-lg xl:text-sm  xl:p-1 xl:w-1/2"
            >
              {Array.from({ length: treeData.units }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Unit {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl p-6 pl-6 xl:w-60 xl:h-25 border border-green-200 flex items-center justify-center">
            <button
              onClick={downloadExcel}
              className="bg-gray-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 xl:px-5 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-3 w-full"
            >
              <span className="text-xl xl:text-lg">Download Excel</span>
            </button>
          </div>
        </div>

        {/* Cumulative Revenue Summary */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white text-center mb-8">
          <div className="text-2xl font-bold mb-2 xl:text-lg">
            Cumulative Revenue Until {selectedYear}: {formatCurrency(totalCumulativeUntilYear)}
          </div>
          <div className="text-lg xl:text-base opacity-90">
            Total revenue generated by Unit {selectedUnit} from {treeData.startYear} to {selectedYear}
          </div>
        </div>

        {/* CPF Cost Summary - CORRECTED */}
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white text-center mb-8">
            <div className="text-2xl font-bold mb-2 xl:text-sm">
              CPF (Cattle Protection Fund) - ₹13,000 per Buffalo with CPF
            </div>
            <div className="text-lg xl:text-base opacity-90">
              {cpfCost.milkProducingBuffaloesWithCPF} buffaloes with CPF × ₹13,000 = {formatCurrency(cpfCost.annualCPFCost)} annually
            </div>
            <div className="text-sm opacity-80 mt-2">
              Monthly CPF Cost: {formatCurrency(cpfCost.monthlyCPFCost)} | 
              Cumulative CPF Until {selectedYear}: {formatCurrency(cumulativeCPFCost)}
            </div>
            <div className="text-xs opacity-70 mt-2">
              Note: M1 has CPF, M2 has no CPF. Children get CPF only after age 3.
            </div>
          </div>
          {/* Income Producing Buffaloes Summary */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center mb-8">
            <div className="text-2xl xl:text-lg font-bold mb-2">
              {unitBuffaloes.length} Income Producing Buffaloes in {selectedYear}
            </div>
            <div className="text-lg xl:text-sm opacity-90 ">
              Unit {selectedUnit} | Showing only buffaloes generating revenue (age 3+ years)
            </div>
            <div className="text-sm opacity-80 mt-2">
              Cumulative Net Revenue Until {selectedYear}: {formatCurrency(cumulativeNetRevenue)}
            </div>
          </div>
        </div>

        {/* CPF Details */}
        <div className="bg-white rounded-2xl p-6 border border-yellow-200 mb-8">
          <h3 className="text-xl font-bold text-yellow-700 mb-4 text-center">CPF Eligibility Details (Per Unit Basis)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="font-bold text-yellow-700">Buffaloes WITH CPF (₹13,000 each):</div>
              <ul className="list-disc pl-5 text-sm text-yellow-600 mt-2">
                <li>M1 (First Mother Buffalo) - Has CPF included</li>
                <li>Children after they reach 3 years of age (36 months)</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="font-bold text-green-700">Buffaloes WITHOUT CPF:</div>
              <ul className="list-disc pl-5 text-sm text-green-600 mt-2">
                <li>M2 (Second Mother Buffalo) - No CPF (free CPF offer)</li>
                <li>Children before they reach 3 years of age</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700 font-semibold">Important Note:</div>
            <div className="text-xs text-blue-600">
              Each unit (2 mother buffaloes) comes with ONE CPF coverage (₹13,000). 
              The CPF covers M1 only. M2 gets free CPF coverage. 
              Additional CPF is required for children when they reach 3 years of age.
            </div>
          </div>
        </div>

        {/* Monthly Revenue Table */}
        {unitBuffaloes.length > 0 ? (
          <div className="bg-white rounded-2xl p-8 xl:p-5 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Monthly Revenue Breakdown - {selectedYear} (Unit {selectedUnit})
            </h3>
            <div className="overflow-y-auto rounded-xl">
              <table className="w-full  border-collapse ">
                <thead>
                  <tr className="bg-gradient-to-r items-center from-gray-50 to-blue-50">
                    <th className="py-3 text-center font-bold   text-gray-700 border-b-2 border-r-2 border-gray-300 text-xl xl:text-lg">
                      Month
                    </th>
                    {unitBuffaloes.map((buffalo, index) => (
                      <th
                        key={buffalo.id}
                        className="py-3 text-center font-bold text-gray-700 border-b-2 border-r-2 border-gray-300 text-lg"
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
                    <th className=" py-3 text-center font-bold text-gray-700 border-b-2 border-r-2 border-gray-300 text-xl xl:text-lg  bg-blue-100">
                      Unit Total
                    </th>
                    <th className=" py-3 text-center font-bold text-gray-700 border-b-2 border-r-2 border-gray-300 text-xl xl:text-lg bg-orange-100">
                      CPF Cost
                    </th>
                    <th className=" py-3 text-center font-bold text-gray-700 border-b-2 border-gray-300 text-xl xl:text-lg bg-green-100">
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
                        <td className=" py-3 text-center border-b border-r-2 border-gray-300 font-semibold text-gray-900 text-lg bg-gray-50">
                          {month}
                        </td>
                        {unitBuffaloes.map((buffalo, buffaloIndex) => {
                          const revenue = monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0;
                          return (
                            <td
                              key={buffalo.id}
                              className="border-b text-center transition-all duration-200 group-hover:bg-blue-50"
                              style={{
                                borderRight: buffaloIndex === unitBuffaloes.length - 1 ? '2px solid #d1d5db' : '1px solid #e5e7eb',
                                background: revenue > 0 ? (revenue === 9000 ? '#f0fdf4' : revenue === 6000 ? '#f0f9ff' : '#f8fafc') : '#f8fafc'
                              }}
                            >
                              <div className={`font-semibold text-lg ${revenue === 9000 ? 'text-green-600' :
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
                        <td className=" border-b border-r-2 border-gray-300 text-center font-semibold text-purple-600 text-lg bg-blue-50">
                          {formatCurrency(unitTotal)}
                        </td>
                        <td className=" border-b border-r-2 border-gray-300 text-center font-semibold text-orange-600 text-lg bg-orange-50">
                          {formatCurrency(cpfCost.monthlyCPFCost)}
                        </td>
                        <td className=" border-b text-center font-semibold text-lg bg-green-50"
                          style={{ color: netRevenue >= 0 ? '#059669' : '#dc2626' }}>
                          {formatCurrency(netRevenue)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Yearly Total Row */}
                  <tr className="bg-gray-700 text-white">
                    <td className="text-center font-bold text-xl xl:text-lg border-r-2 border-gray-600">Yearly Total</td>
                    {unitBuffaloes.map((buffalo, buffaloIndex) => {
                      const yearlyTotal = monthNames.reduce((sum, _, monthIndex) => {
                        return sum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                      }, 0);
                      return (
                        <td
                          key={buffalo.id}
                          className="px-3 py-3 text-center font-bold text-lg  border-r-2 border-gray-600"
                          style={{ borderRight: buffaloIndex === unitBuffaloes.length - 1 ? '2px solid #4b5563' : '1px solid #6b7280' }}
                        >
                          {formatCurrency(yearlyTotal)}
                        </td>
                      );
                    })}
                    <td className=" text-center font-bold text-lg border-r-2 border-gray-600 ">
                      {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                        return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                          return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                        }, 0);
                      }, 0))}
                    </td>
                    <td className=" text-center font-bold text-lg  border-r-2 border-gray-600 ">
                      {formatCurrency(cpfCost.annualCPFCost)}
                    </td>
                    <td className=" text-center font-bold text-lg ">
                      {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                        return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                          return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                        }, 0);
                      }, 0) - cpfCost.annualCPFCost)}
                    </td>
                  </tr>
                  
                  {/* Cumulative Revenue Row */}
                  <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <td className="text-center font-bold text-xl xl:text-lg border-r-2 border-blue-400">
                      Cumulative Until {selectedYear}
                    </td>
                    {unitBuffaloes.map((buffalo, buffaloIndex) => {
                      return (
                        <td
                          key={buffalo.id}
                          className="px-3 py-3 text-center font-bold text-lg border-r-2 border-blue-400"
                          style={{ borderRight: buffaloIndex === unitBuffaloes.length - 1 ? '2px solid #3b82f6' : '1px solid #60a5fa' }}
                        >
                          {formatCurrency(cumulativeRevenueUntilYear[buffalo.id] || 0)}
                        </td>
                      );
                    })}
                    <td className="text-center font-bold text-lg border-r-2 border-blue-400 bg-blue-700">
                      {formatCurrency(totalCumulativeUntilYear)}
                    </td>
                    <td className="text-center font-bold text-lg border-r-2 border-blue-400 bg-orange-700">
                      {formatCurrency(cumulativeCPFCost)}
                    </td>
                    <td className="text-center font-bold text-lg bg-green-700">
                      {formatCurrency(cumulativeNetRevenue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="mt-5  grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 rounded-xl p-6 xl:p-3 border border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2 xl:mb-1">
                  {formatCurrency(unitBuffaloes.reduce((sum, buffalo) => {
                    return sum + monthNames.reduce((monthSum, _, monthIndex) => {
                      return monthSum + (monthlyRevenue[selectedYear]?.[monthIndex]?.buffaloes[buffalo.id] || 0);
                    }, 0);
                  }, 0))}
                </div>
                <div className="text-lg font-semibold text-blue-700">Annual Revenue {selectedYear}</div>
              </div>

              <div className="bg-orange-50 rounded-xl p-6 border border-orange-200 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {formatCurrency(cpfCost.annualCPFCost)}
                </div>
                <div className="text-lg font-semibold text-orange-700">Annual CPF Cost</div>
                <div className="text-sm text-orange-600 mt-1">
                  {cpfCost.milkProducingBuffaloesWithCPF} buffaloes × ₹13,000
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

              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {formatCurrency(cumulativeNetRevenue)}
                </div>
                <div className="text-lg font-semibold text-purple-700">Cumulative Net Until {selectedYear}</div>
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

        {/* Dynamic Calculation Note */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-100 rounded-xl p-5 mt-6 border border-blue-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">⚡</div>
            <div className="text-lg font-bold text-blue-800">Dynamic Revenue Calculation</div>
          </div>
          <p className="text-blue-700 text-sm">
            These revenue figures are calculated <span className="font-semibold">dynamically</span> based on:
            <span className="block mt-1 ml-4">
              1. Each buffalo's specific age and production cycle<br/>
              2. Natural reproduction patterns<br/>
              3. CPF costs that vary with age<br/>
              4. Realistic monthly production variations
            </span>
          </p>
        </div>
      </div>
    );
  };

  // Revenue Break-Even Analysis Component - UPDATED FOR BOTH WITH AND WITHOUT CPF
  const RevenueBreakEvenAnalysis = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    // Calculate months to break-even
    const calculateMonthsToBreakEven = (breakEvenDate) => {
      if (!breakEvenDate) return null;
      
      const startDate = new Date(treeData.startYear, treeData.startMonth, treeData.startDay || 1);
      const yearsDiff = breakEvenDate.getFullYear() - startDate.getFullYear();
      const monthsDiff = breakEvenDate.getMonth() - startDate.getMonth();
      
      return yearsDiff * 12 + monthsDiff;
    };

    const monthsToBreakEvenWithoutCPF = calculateMonthsToBreakEven(breakEvenAnalysis.exactBreakEvenDateWithoutCPF);
    const monthsToBreakEvenWithCPF = calculateMonthsToBreakEven(breakEvenAnalysis.exactBreakEvenDateWithCPF);
    
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-3xl p-10 shadow-2xl border border-purple-200 mb-16">
        <h2 className="text-4xl font-bold text-purple-800 mb-10 text-center flex items-center justify-center gap-4">
          <span className="text-5xl">💰</span>
          Revenue Break-Even Analysis (With & Without CPF)
        </h2>

        {/* CPF Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-4 border border-purple-300">
            <div className="text-lg font-semibold text-purple-700 mb-2 text-center">Select CPF Mode:</div>
            <div className="flex gap-4">
              <button
                onClick={() => setCpfToggle("withCPF")}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${cpfToggle === "withCPF" ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                With CPF
              </button>
              <button
                onClick={() => setCpfToggle("withoutCPF")}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${cpfToggle === "withoutCPF" ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Without CPF
              </button>
            </div>
          </div>
        </div>

        {/* Initial Investment Breakdown - CORRECTED */}
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
              <br />
              Total: 2 × ₹1.75L = ₹3.5L per unit
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-green-200 shadow-lg text-center">
            <div className="text-3xl font-bold text-green-600 mb-4">
              {formatCurrency(initialInvestment.cpfCost)}
            </div>
            <div className="text-lg font-semibold text-green-700">CPF Cost (One CPF per Unit)</div>
            <div className="text-sm text-gray-600 mt-2">
              {treeData.units} units × ₹13,000
              <br />
              One CPF covers both M1 and M2 in each unit
              <br />
              M1 has CPF, M2 gets free CPF coverage
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg text-center">
            <div className="text-3xl font-bold mb-4">
              {formatCurrency(initialInvestment.totalInvestment)}
            </div>
            <div className="text-lg font-semibold opacity-90">Total Initial Investment</div>
            <div className="text-sm opacity-80 mt-2">
              Includes {initialInvestment.totalBuffaloesAtStart} buffaloes (2 mothers + 2 calves per unit)
              <br />
              Plus one CPF coverage for each unit
            </div>
          </div>
        </div>

        {/* Starting Buffalo Summary */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white text-center shadow-2xl mb-8">
          <div className="text-2xl font-bold mb-4">Starting Buffaloes (Included in Initial Purchase)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold">{treeData.units}</div>
              <div className="text-lg font-semibold">CPF Coverage</div>
              <div className="text-sm opacity-90">One CPF per unit (covers M1 & M2)</div>
            </div>
          </div>
        </div>

        {/* CPF Offer Explanation */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-6 text-white text-center shadow-2xl mb-8">
          <div className="text-2xl font-bold mb-4">🎁 Special CPF Offer</div>
          <div className="text-lg opacity-90">
            For each unit (2 mother buffaloes), you get ONE CPF coverage (₹13,000) that covers both M1 and M2
          </div>
          <div className="text-sm opacity-80 mt-2">
            Regular price: 2 CPF × ₹13,000 = ₹26,000 | Our offer: ₹13,000 (Save ₹13,000!)
          </div>
        </div>

        {/* Break-Even Results - Show Both */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Without CPF Break-Even */}
          {breakEvenAnalysis.breakEvenYearWithoutCPF && breakEvenAnalysis.exactBreakEvenDateWithoutCPF && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white text-center shadow-2xl">
              <div className="text-3xl font-bold mb-4">📊 Break-Even WITHOUT CPF</div>
              <div className="text-2xl font-semibold mb-2">
                {breakEvenAnalysis.exactBreakEvenDateWithoutCPF.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-lg opacity-90 mb-4">
                📈 Cumulative Revenue: {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithoutCPF)}
              </div>
              <div className="text-sm opacity-80">
                Investment recovered in {monthsToBreakEvenWithoutCPF} months 
                ({Math.floor(monthsToBreakEvenWithoutCPF/12)} years {monthsToBreakEvenWithoutCPF%12} months)
              </div>
            </div>
          )}

          {/* With CPF Break-Even */}
          {breakEvenAnalysis.breakEvenYearWithCPF && breakEvenAnalysis.exactBreakEvenDateWithCPF && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center shadow-2xl">
              <div className="text-3xl font-bold mb-4">🎉 Break-Even WITH CPF</div>
              <div className="text-2xl font-semibold mb-2">
                {breakEvenAnalysis.exactBreakEvenDateWithCPF.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-lg opacity-90 mb-4">
                📈 Net Cumulative Revenue: {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
              </div>
              <div className="text-sm opacity-80">
                Investment recovered in {monthsToBreakEvenWithCPF} months 
                ({Math.floor(monthsToBreakEvenWithCPF/12)} years {monthsToBreakEvenWithCPF%12} months)
              </div>
            </div>
          )}
        </div>

        {/* Break-Even Timeline */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Break-Even Timeline {cpfToggle === "withCPF" ? "(With CPF)" : "(Without CPF)"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Year</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">
                    {cpfToggle === "withCPF" ? "Annual Revenue (Net)" : "Annual Revenue (Gross)"}
                  </th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">
                    {cpfToggle === "withCPF" ? "Cumulative (Net)" : "Cumulative (Gross)"}
                  </th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Investment Recovery</th>
                </tr>
              </thead>
              <tbody>
                {breakEvenAnalysis.breakEvenData.map((data, index) => {
                  const annualRevenue = cpfToggle === "withCPF" ? data.annualRevenueWithCPF : data.annualRevenueWithoutCPF;
                  const cumulativeRevenue = cpfToggle === "withCPF" ? data.cumulativeRevenueWithCPF : data.cumulativeRevenueWithoutCPF;
                  const recoveryPercentage = cpfToggle === "withCPF" ? data.recoveryPercentageWithCPF : data.recoveryPercentageWithoutCPF;
                  const status = cpfToggle === "withCPF" ? data.statusWithCPF : data.statusWithoutCPF;
                  const isBreakEven = cpfToggle === "withCPF" ? data.isBreakEvenWithCPF : data.isBreakEvenWithoutCPF;

                  return (
                    <tr key={data.year} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 border-b">
                        <div className="font-semibold text-gray-900">{data.year}</div>
                        <div className="text-sm text-gray-600">Year {index + 1}</div>
                      </td>
                      <td className="px-6 py-4 border-b font-semibold text-green-600">
                        {formatCurrency(annualRevenue)}
                        {cpfToggle === "withCPF" && (
                          <div className="text-xs text-gray-500">
                            CPF: -{formatCurrency(data.cpfCost)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 border-b font-semibold text-blue-600">
                        {formatCurrency(cumulativeRevenue)}
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
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold mt-2 inline-block
                          ${status.includes('Break-Even') ? 'bg-green-100 text-green-800' :
                            status.includes('75%') ? 'bg-yellow-100 text-yellow-800' :
                            status.includes('50%') ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-600'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Revenue Note */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 mt-8">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📊</div>
            <div>
              <h4 className="text-xl font-bold text-blue-800 mb-2">Dynamic Revenue Calculation</h4>
              <p className="text-blue-700">
                All revenue values are calculated <span className="font-semibold">dynamically</span> based on:
              </p>
              <ul className="list-disc pl-5 text-blue-600 mt-2 space-y-1">
                <li>Actual herd growth through natural reproduction</li>
                <li>Staggered birthing cycles (every 12 months)</li>
                <li>Age-based milk production (starts at 3 years)</li>
                <li>Seasonal production cycles (5 months high, 3 months medium, 4 months rest)</li>
                <li>Variable CPF costs based on buffalo age</li>
              </ul>
              <div className="bg-blue-100 rounded-lg p-4 mt-4">
                <div className="font-semibold text-blue-800">💡 Note:</div>
                <div className="text-blue-700 text-sm">
                  {cpfToggle === "withCPF" ? (
                    <>
                      The net cumulative revenue of {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)} at break-even 
                      represents <span className="font-bold">actual projected milk sales minus CPF costs</span>.
                    </>
                  ) : (
                    <>
                      The gross cumulative revenue of {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithoutCPF)} at break-even 
                      represents <span className="font-bold">total milk sales before CPF deductions</span>.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Asset Market Value Component - UPDATED to show only until 2035
  const AssetMarketValue = () => {
    const [selectedYear, setSelectedYear] = useState(treeData.startYear);
    const detailedAssetValue = calculateDetailedAssetValue(selectedYear);
    const selectedAssetValue = assetMarketValue.find(a => a.year === selectedYear) || assetMarketValue[0];

    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-3xl p-10 shadow-2xl border border-orange-200 mb-16">
        <h2 className="text-4xl font-bold text-orange-800 mb-10 text-center flex items-center justify-center gap-4">
          <span className="text-5xl">🏦</span>
          Asset Market Value Analysis (2026-2035)
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
              <br />
              Including {selectedAssetValue?.motherBuffaloes || 0} mother buffaloes (60+ months)
            </div>
          </div>
        </div>

        {/* Detailed Age Category Table */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Detailed Age-Based Asset Breakdown - {selectedYear}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
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

        {/* Current vs Final Asset Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-8 border border-blue-200 shadow-lg text-center">
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {formatCurrency(assetMarketValue[0]?.totalAssetValue || 0)}
            </div>
            <div className="text-lg font-semibold text-blue-700">Initial Asset Value (2026)</div>
            <div className="text-sm text-gray-600 mt-2">
              {assetMarketValue[0]?.totalBuffaloes || 0} buffaloes
              <br />
              {assetMarketValue[0]?.motherBuffaloes || 0} mother buffaloes (60+ months)
              <br />
              {assetMarketValue[0]?.ageCategories?.['0-6 months']?.count || 0} newborn calves
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-lg text-center">
            <div className="text-3xl font-bold mb-4">
              {formatCurrency(assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)}
            </div>
            <div className="text-lg font-semibold opacity-90">Final Asset Value (2035)</div>
            <div className="text-sm opacity-80 mt-2">
              {assetMarketValue[assetMarketValue.length - 1]?.totalBuffaloes || 0} buffaloes
              <br />
              {assetMarketValue[assetMarketValue.length - 1]?.motherBuffaloes || 0} mother buffaloes (60+ months)
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

        {/* Yearly Asset Value Table (2026-2035) */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Yearly Asset Market Value (2026-2035)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-orange-50">
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Year</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Total Buffaloes</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Mother Buffaloes (60+ months)</th>
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
                    <td className="px-6 py-4 border-b font-semibold text-red-600">
                      {formatNumber(data.motherBuffaloes)}
                    </td>
                    <td className="px-6 py-4 border-b font-semibold text-green-600">
                      {formatNumber(data.ageCategories?.['0-6 months']?.count || 0)}
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

        {/* Investment Recovery Status */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center shadow-2xl mt-8">
          <div className="text-3xl font-bold mb-4">🎯 Your Investment is Now Risk-Free!</div>
          <div className="text-xl opacity-90 mb-6">
            At break-even point, your initial investment is fully recovered
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-2xl font-bold mb-2">
                {formatCurrency(initialInvestment.totalInvestment)}
              </div>
              <div className="text-lg">Initial Investment</div>
            </div>
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-2xl font-bold mb-2">
                {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
              </div>
              <div className="text-lg">Net Cumulative Revenue at Break-Even</div>
            </div>
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-2xl font-bold mb-2">
                {formatCurrency(assetMarketValue[assetMarketValue.length - 1]?.totalAssetValue || 0)}
              </div>
              <div className="text-lg">Final Asset Value (2035)</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Break-Even Timeline Component with Exact Date Calculation - UPDATED FOR BOTH WITH AND WITHOUT CPF
  const BreakEvenTimeline = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    // Calculate months to break-even
    const calculateMonthsToBreakEven = (breakEvenDate) => {
      if (!breakEvenDate) return null;
      
      const startDate = new Date(treeData.startYear, treeData.startMonth, treeData.startDay || 1);
      const yearsDiff = breakEvenDate.getFullYear() - startDate.getFullYear();
      const monthsDiff = breakEvenDate.getMonth() - startDate.getMonth();
      
      return yearsDiff * 12 + monthsDiff;
    };

    const monthsToBreakEvenWithoutCPF = calculateMonthsToBreakEven(breakEvenAnalysis.exactBreakEvenDateWithoutCPF);
    const monthsToBreakEvenWithCPF = calculateMonthsToBreakEven(breakEvenAnalysis.exactBreakEvenDateWithCPF);

    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-10 shadow-2xl border border-green-200 mb-16">
        <h2 className="text-4xl font-bold text-green-800 mb-10 text-center flex items-center justify-center gap-4">
          <span className="text-5xl">🎯</span>
          Break-Even Timeline Analysis (2026-2035)
        </h2>

        {/* CPF Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-4 border border-purple-300">
            <div className="text-lg font-semibold text-purple-700 mb-2 text-center">Select CPF Mode:</div>
            <div className="flex gap-4">
              <button
                onClick={() => setCpfToggle("withCPF")}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${cpfToggle === "withCPF" ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                With CPF
              </button>
              <button
                onClick={() => setCpfToggle("withoutCPF")}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${cpfToggle === "withoutCPF" ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Without CPF
              </button>
            </div>
          </div>
        </div>

        {/* Initial Investment Summary */}
        <div className="bg-white rounded-2xl p-8 border border-green-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">Start Date</div>
              <div className="text-3xl font-bold text-green-600">
                {monthNames[treeData.startMonth]} {treeData.startDay || 1}, {treeData.startYear}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">Initial Investment</div>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(breakEvenAnalysis.initialInvestment)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">Units</div>
              <div className="text-3xl font-bold text-blue-600">{treeData.units}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">Projection Period</div>
              <div className="text-3xl font-bold text-purple-600">2026-2035</div>
            </div>
          </div>
        </div>

        {/* CPF Offer Explanation */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-6 text-white text-center shadow-2xl mb-8">
          <div className="text-xl font-bold mb-2">💰 Special CPF Offer</div>
          <div className="text-lg opacity-90">
            Each unit (2 mother buffaloes) comes with ONE CPF coverage (₹13,000) that covers both buffaloes
          </div>
          <div className="text-sm opacity-80 mt-2">
            Regular: ₹26,000 (2 × ₹13,000) | Our offer: ₹13,000 (Save 50%!)
          </div>
        </div>

        {/* Break-Even Achievement - Show Based on Toggle */}
        {cpfToggle === "withCPF" ? (
          // With CPF Break-Even
          breakEvenAnalysis.exactBreakEvenDateWithCPF && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-10 text-white text-center shadow-2xl mb-8">
              <div className="text-5xl mb-6">🎉</div>
              <div className="text-4xl font-bold mb-4">Your Investment is Now Risk-Free!</div>
              <div className="text-2xl font-semibold mb-6">
                Break-Even WITH CPF Achieved on {breakEvenAnalysis.exactBreakEvenDateWithCPF.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              
              <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm mb-6">
                <div className="text-3xl font-bold mb-2">
                  In Just {monthsToBreakEvenWithCPF} Months
                </div>
                <div className="text-xl opacity-90">
                  ({Math.floor(monthsToBreakEvenWithCPF/12)} years and {monthsToBreakEvenWithCPF%12} months)
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-lg font-semibold mb-2">Investment Cycle</div>
                  <div className="text-2xl font-bold">
                    Year {breakEvenAnalysis.exactBreakEvenDateWithCPF.getFullYear() - treeData.startYear + 1}
                  </div>
                  <div className="text-sm opacity-90">Month {breakEvenAnalysis.breakEvenMonthWithCPF + 1}</div>
                </div>
                
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-lg font-semibold mb-2">Net Cumulative Revenue</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
                  </div>
                  <div className="text-sm opacity-90">Total net milk sales to date</div>
                </div>
                
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-lg font-semibold mb-2">Initial Investment</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(breakEvenAnalysis.initialInvestment)}
                  </div>
                  <div className="text-sm opacity-90">Fully recovered!</div>
                </div>
              </div>
              
              <div className="text-lg opacity-90 bg-black/20 rounded-xl p-4">
                🎯 <span className="font-semibold">What this means:</span> From this date forward, all future revenue is pure profit. 
                Your initial investment of {formatCurrency(breakEvenAnalysis.initialInvestment)} has been completely recovered 
                through milk sales after CPF deductions. The buffalo herd you own now represents 100% net asset value.
              </div>
            </div>
          )
        ) : (
          // Without CPF Break-Even
          breakEvenAnalysis.exactBreakEvenDateWithoutCPF && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-10 text-white text-center shadow-2xl mb-8">
              <div className="text-5xl mb-6">📊</div>
              <div className="text-4xl font-bold mb-4">Break-Even WITHOUT CPF</div>
              <div className="text-2xl font-semibold mb-6">
                Achieved on {breakEvenAnalysis.exactBreakEvenDateWithoutCPF.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              
              <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm mb-6">
                <div className="text-3xl font-bold mb-2">
                  In Just {monthsToBreakEvenWithoutCPF} Months
                </div>
                <div className="text-xl opacity-90">
                  ({Math.floor(monthsToBreakEvenWithoutCPF/12)} years and {monthsToBreakEvenWithoutCPF%12} months)
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-lg font-semibold mb-2">Investment Cycle</div>
                  <div className="text-2xl font-bold">
                    Year {breakEvenAnalysis.exactBreakEvenDateWithoutCPF.getFullYear() - treeData.startYear + 1}
                  </div>
                  <div className="text-sm opacity-90">Month {breakEvenAnalysis.breakEvenMonthWithoutCPF + 1}</div>
                </div>
                
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-lg font-semibold mb-2">Gross Cumulative Revenue</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithoutCPF)}
                  </div>
                  <div className="text-sm opacity-90">Total milk sales before CPF</div>
                </div>
                
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-lg font-semibold mb-2">Initial Investment</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(breakEvenAnalysis.initialInvestment)}
                  </div>
                  <div className="text-sm opacity-90">Fully recovered!</div>
                </div>
              </div>
              
              <div className="text-lg opacity-90 bg-black/20 rounded-xl p-4">
                🎯 <span className="font-semibold">What this means:</span> From this date forward, all future revenue exceeds your initial investment. 
                Your initial investment of {formatCurrency(breakEvenAnalysis.initialInvestment)} has been completely recovered 
                through milk sales alone (before CPF deductions).
              </div>
            </div>
          )
        )}

        {/* Break-Even Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center">Break-Even Timeline</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Start Date:</span>
                <span className="text-xl font-bold text-blue-600">
                  {monthNames[treeData.startMonth]} {treeData.startDay || 1}, {treeData.startYear}
                </span>
              </div>
              {cpfToggle === "withCPF" ? (
                breakEvenAnalysis.exactBreakEvenDateWithCPF && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Break-Even Date (With CPF):</span>
                      <span className="text-xl font-bold text-green-600">
                        {breakEvenAnalysis.exactBreakEvenDateWithCPF.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Time to Break-Even:</span>
                      <span className="text-xl font-bold text-purple-600">
                        {monthsToBreakEvenWithCPF} months ({Math.floor(monthsToBreakEvenWithCPF/12)} years {monthsToBreakEvenWithCPF%12} months)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Net Cumulative Revenue at Break-Even:</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}
                      </span>
                    </div>
                  </>
                )
              ) : (
                breakEvenAnalysis.exactBreakEvenDateWithoutCPF && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Break-Even Date (Without CPF):</span>
                      <span className="text-xl font-bold text-green-600">
                        {breakEvenAnalysis.exactBreakEvenDateWithoutCPF.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Time to Break-Even:</span>
                      <span className="text-xl font-bold text-purple-600">
                        {monthsToBreakEvenWithoutCPF} months ({Math.floor(monthsToBreakEvenWithoutCPF/12)} years {monthsToBreakEvenWithoutCPF%12} months)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Gross Cumulative Revenue at Break-Even:</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithoutCPF)}
                      </span>
                    </div>
                  </>
                )
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-purple-200">
            <h3 className="text-2xl font-bold text-purple-700 mb-6 text-center">Investment Recovery Progress</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-700">Initial Investment:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(breakEvenAnalysis.initialInvestment)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-red-500 h-4 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              {cpfToggle === "withCPF" ? (
                breakEvenAnalysis.exactBreakEvenDateWithCPF && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">Recovered at Break-Even (Net):</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(breakEvenAnalysis.initialInvestment)} (100%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-green-500 h-4 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                )
              ) : (
                breakEvenAnalysis.exactBreakEvenDateWithoutCPF && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">Recovered at Break-Even (Gross):</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(breakEvenAnalysis.initialInvestment)} (100%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-blue-500 h-4 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                )
              )}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-700">Final Cumulative Revenue:</span>
                  <span className="font-bold text-purple-600">
                    {formatCurrency(cpfToggle === "withCPF" ? breakEvenAnalysis.finalCumulativeRevenueWithCPF : breakEvenAnalysis.finalCumulativeRevenueWithoutCPF)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-purple-500 h-4 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, ((cpfToggle === "withCPF" ? breakEvenAnalysis.finalCumulativeRevenueWithCPF : breakEvenAnalysis.finalCumulativeRevenueWithoutCPF) / breakEvenAnalysis.initialInvestment) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Break-Even Timeline Table (Matching Screenshot) */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Break-Even Timeline (2026-2035) - {cpfToggle === "withCPF" ? "With CPF" : "Without CPF"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-green-50">
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Year</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">
                    {cpfToggle === "withCPF" ? "Annual Revenue (Net)" : "Annual Revenue (Gross)"}
                  </th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">
                    {cpfToggle === "withCPF" ? "Cumulative (Net)" : "Cumulative (Gross)"}
                  </th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 border-b">Investment Recovery</th>
                </tr>
              </thead>
              <tbody>
                {breakEvenAnalysis.breakEvenData.map((data, index) => {
                  const annualRevenue = cpfToggle === "withCPF" ? data.annualRevenueWithCPF : data.annualRevenueWithoutCPF;
                  const cumulativeRevenue = cpfToggle === "withCPF" ? data.cumulativeRevenueWithCPF : data.cumulativeRevenueWithoutCPF;
                  const recoveryPercentage = cpfToggle === "withCPF" ? data.recoveryPercentageWithCPF : data.recoveryPercentageWithoutCPF;
                  const status = cpfToggle === "withCPF" ? data.statusWithCPF : data.statusWithoutCPF;
                  const isBreakEven = cpfToggle === "withCPF" ? data.isBreakEvenWithCPF : data.isBreakEvenWithoutCPF;

                  // Format year display
                  const yearDisplay = data.year === treeData.startYear 
                    ? `${data.year}\nYear 1` 
                    : `${data.year}\nYear ${index + 1}`;

                  return (
                    <tr key={data.year} className="hover:bg-green-50 transition-colors">
                      <td className="px-6 py-4 border-b">
                        <div className="font-semibold text-gray-900 whitespace-pre-line">{yearDisplay}</div>
                      </td>
                      <td className="px-6 py-4 border-b font-semibold text-green-600">
                        {formatCurrency(annualRevenue)}
                        {cpfToggle === "withCPF" && (
                          <div className="text-xs text-gray-500">
                            CPF: -{formatCurrency(data.cpfCost)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 border-b font-semibold text-blue-600">
                        {formatCurrency(cumulativeRevenue)}
                      </td>
                      <td className="px-6 py-4 border-b">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-full bg-gray-200 rounded-sm h-4">
                            <div
                              className={`h-4 rounded-full ${recoveryPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(recoveryPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-sm font-semibold text-gray-600 min-w-[60px]">
                            {recoveryPercentage.toFixed(1)}%
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block
                          ${status.includes('Break-Even') ? 'bg-green-100 text-green-800' :
                            status.includes('75%') ? 'bg-yellow-100 text-yellow-800' :
                            status.includes('50%') ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-600'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cumulative Revenue Explanation */}
        <div className="bg-white rounded-2xl p-6 border border-purple-200 mt-8">
          <h4 className="text-2xl font-bold text-purple-800 mb-4">Understanding Your Cumulative Revenue</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 rounded-xl p-5">
              <div className="text-lg font-semibold text-purple-700 mb-2">💰 Dynamic Calculation</div>
              <p className="text-purple-600 text-sm">
                Your {cpfToggle === "withCPF" ? "net" : "gross"} cumulative revenue of <span className="font-bold">
                  {formatCurrency(cpfToggle === "withCPF" ? breakEvenAnalysis.finalCumulativeRevenueWithCPF : breakEvenAnalysis.finalCumulativeRevenueWithoutCPF)}
                </span> 
                is calculated dynamically based on:
              </p>
              <ul className="list-disc pl-5 text-purple-600 text-sm mt-2 space-y-1">
                <li>Realistic herd growth patterns</li>
                <li>Natural breeding cycles</li>
                <li>Age-based milk production</li>
                <li>Variable monthly revenue (₹9,000/₹6,000/₹0 cycles)</li>
                {cpfToggle === "withCPF" && <li>Age-based CPF costs (₹13,000 per buffalo aged 3+ years)</li>}
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-xl p-5">
              <div className="text-lg font-semibold text-green-700 mb-2">📈 What This Means</div>
              <p className="text-green-600 text-sm">
                The break-even timeline shows when your <span className="font-bold">
                  {cpfToggle === "withCPF" ? "net milk sales revenue (after CPF)" : "gross milk sales revenue (before CPF)"}
                </span> 
                equals your initial investment. This is based on conservative, realistic projections of:
              </p>
              <ul className="list-disc pl-5 text-green-600 text-sm mt-2 space-y-1">
                <li>Each buffalo's natural reproductive cycle</li>
                <li>Realistic milk production patterns</li>
                <li>Gradual herd expansion over time</li>
                <li>Market-based buffalo valuation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Projection Summary */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white text-center mt-8">
          <h3 className="text-2xl font-bold mb-6">Projection Summary (2026-2035)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold">{treeData.units}</div>
              <div className="text-lg">Starting Units</div>
            </div>
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold">10</div>
              <div className="text-lg">Projection Years</div>
            </div>
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold">
                {cpfToggle === "withCPF" 
                  ? (breakEvenAnalysis.exactBreakEvenDateWithCPF ? 
                      (breakEvenAnalysis.exactBreakEvenDateWithCPF.getFullYear() - treeData.startYear + 1) : 'N/A')
                  : (breakEvenAnalysis.exactBreakEvenDateWithoutCPF ? 
                      (breakEvenAnalysis.exactBreakEvenDateWithoutCPF.getFullYear() - treeData.startYear + 1) : 'N/A')}
              </div>
              <div className="text-lg">Years to Break-Even</div>
            </div>
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold">
                {cpfToggle === "withCPF" ? monthsToBreakEvenWithCPF || 'N/A' : monthsToBreakEvenWithoutCPF || 'N/A'}
              </div>
              <div className="text-lg">Months to Break-Even</div>
            </div>
          </div>
          <div className="mt-6 text-lg opacity-90">
            Projection Period: {treeData.startYear} to 2035 (10 years) | Mode: {cpfToggle === "withCPF" ? "With CPF" : "Without CPF"}
          </div>
        </div>
      </div>
    );
  };

  // Summary Cards Component
  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 xl:mb-5  xl:flex xl:justify-center xl:items-center">
      <div className="bg-cyan-50 rounded-3xl p-8 xl:p-3 xl:w-50 xl:h-40 shadow-2xl border border-gray-200 text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-5xl font-bold text-gray-600 mb-4 xl:text-2xl xl:mb-1">{treeData.units}</div>
        <div className="text-lg font-semibold text-gray-600 uppercase tracking-wide xl:text-lg">Starting Units</div>
        <div className="text-sm text-gray-700 mt-2 ">
          {herdStats.startingBuffaloes} buffaloes total
          <br />
          ({herdStats.motherBuffaloes} mothers + {herdStats.initialCalves} calves)
        </div>
        <div className="w-16 h-2 bg-blue-500 mx-auto mt-4 rounded-full xl:my-2"></div>
      </div>

      <div className="bg-cyan-50 rounded-3xl p-8 xl:p-3 xl:w-50 xl:h-40 shadow-2xl border border-green-100 text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-5xl font-bold text-gray-600 mb-4 xl:text-2xl xl:mb-1">10</div>
        <div className="text-lg font-semibold text-gray-600 uppercase tracking-wide xl:text-lg">Simulation Years</div>
        <div className="text-sm text-gray-700 mt-2">2026 to 2035</div>
        <div className="w-16 h-2 bg-green-500 mx-auto mt-4  rounded-full"></div>
      </div>

      <div className="bg-cyan-50 rounded-3xl p-8 xl:p-3 xl:w-50 xl:h-40 shadow-2xl border border-purple-100 text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-5xl font-bold text-gray-600 mb-4 xl:text-2xl xl:mb-1">{treeData.totalBuffaloes}</div>
        <div className="text-lg font-semibold text-gray-600 uppercase tracking-wide">Final Herd Size</div>
        <div className="text-sm text-gray-700 mt-2">{herdStats.growthMultiple.toFixed(1)}x growth</div>
        <div className="w-16 h-2 bg-purple-500 mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="bg-cyan-300 xl:p-3 xl:w-50 xl:h-40 rounded-3xl p-8 shadow-2xl text-gray-600 text-center transform hover:scale-105 transition-transform duration-300">
        <div className="text-4xl font-bold mb-4 xl:text-2xl xl:mb-2">{formatCurrency(totalRevenue)}</div>
        <div className="text-lg font-bold  uppercase tracking-wide">Total Revenue</div>
        <div className="text-sm text-gray-700 mt-2">From entire herd growth</div>
        <div className="w-16 h-2 bg-white opacity-50 mx-auto mt-3 rounded-full"></div>
      </div>
    </div>
  );

  // Updated RevenueTable Component with CPF toggle
  const RevenueTable = () => {
    // Find asset market value for each year
    const getAssetValueForYear = (year) => {
      const asset = assetMarketValue.find(a => a.year === year);
      return asset ? asset.totalAssetValue : 0;
    };

    return (
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-16">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-10 text-white">
          <div className="h-10"></div>
          <h2 className="text-4xl font-bold mb-4 flex items-center gap-4">
            <span className="text-5xl">💰</span>
            Annual Herd Revenue Breakdown (2026-2035)
          </h2>
          <p className="text-blue-100 text-xl">Detailed year-by-year financial analysis based on actual herd growth with staggered cycles</p>
          
          {/* CPF Toggle */}
          <div className="mt-6 flex justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <div className="text-lg font-semibold mb-2 text-center">Select CPF Mode:</div>
              <div className="flex gap-4">
                <button
                  onClick={() => setCpfToggle("withCPF")}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${cpfToggle === "withCPF" ? 'bg-green-500 text-white' : 'bg-white/30 text-white hover:bg-white/40'}`}
                >
                  With CPF
                </button>
                <button
                  onClick={() => setCpfToggle("withoutCPF")}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${cpfToggle === "withoutCPF" ? 'bg-blue-500 text-white' : 'bg-white/30 text-white hover:bg-white/40'}`}
                >
                  Without CPF
                </button>
              </div>
            </div>
          </div>
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
                  <div className="text-xl">Annual Revenue</div>
                  <div className="text-base font-normal text-gray-500">
                    {cpfToggle === "withCPF" ? "With CPF Deduction" : "Without CPF Deduction"}
                  </div>
                </th>
                <th className="px-10 py-8 text-left text-lg font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  <div className="text-xl">Asset Market Value</div>
                  <div className="text-base font-normal text-gray-500">Based on Age</div>
                </th>
                <th className="px-10 py-8 text-left text-lg font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  <div className="text-xl">Combined Value</div>
                  <div className="text-base font-normal text-gray-500">Revenue + Assets</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cumulativeYearlyData.map((data, index) => {
                const annualRevenue = cpfToggle === "withCPF" ? data.revenueWithCPF : data.revenueWithoutCPF;
                const assetValue = getAssetValueForYear(data.year);
                const combinedValue = annualRevenue + assetValue;
                
                const growthRate = index > 0
                  ? ((annualRevenue - cumulativeYearlyData[index - 1][cpfToggle === "withCPF" ? "revenueWithCPF" : "revenueWithoutCPF"]) / 
                     cumulativeYearlyData[index - 1][cpfToggle === "withCPF" ? "revenueWithCPF" : "revenueWithoutCPF"] * 100).toFixed(1)
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
                      <div className="text-3xl font-bold text-green-600">
                        {formatCurrency(annualRevenue)}
                      </div>
                      {cpfToggle === "withCPF" && (
                        <div className="text-base text-orange-600 font-semibold mt-2">
                          CPF Cost: -{formatCurrency(data.cpfCost)}
                        </div>
                      )}
                      {growthRate > 0 && (
                        <div className="text-base text-green-500 font-semibold mt-2 flex items-center gap-2">
                          <span className="text-xl">↑</span>
                          {growthRate}% growth
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-8 whitespace-nowrap">
                      <div className="text-3xl font-bold text-orange-600">
                        {formatCurrency(assetValue)}
                      </div>
                      <div className="text-base text-gray-500 mt-2">
                        Age-based valuation
                      </div>
                    </td>
                    <td className="px-10 py-8 whitespace-nowrap">
                      <div className="text-3xl font-bold text-indigo-600">
                        {formatCurrency(combinedValue)}
                      </div>
                      <div className="text-base text-gray-500 mt-2">
                        {annualRevenue > 0 ? ((assetValue / combinedValue * 100).toFixed(1)) : '100'}% assets
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
                  <div className="text-base opacity-80">10 Years (2026-2035)</div>
                </td>
                <td className="px-10 py-8">
                  <div className="text-2xl font-bold">
                    {formatNumber(yearlyData[yearlyData.length - 1]?.totalBuffaloes || 0)}
                  </div>
                  <div className="text-base opacity-80">final herd size</div>
                </td>
                <td className="px-10 py-8">
                  <div className="text-2xl font-bold">
                    {formatCurrency(cpfToggle === "withCPF" 
                      ? cumulativeYearlyData.reduce((sum, data) => sum + data.revenueWithCPF, 0)
                      : cumulativeYearlyData.reduce((sum, data) => sum + data.revenueWithoutCPF, 0)
                    )}
                  </div>
                  <div className="text-base opacity-80">total {cpfToggle === "withCPF" ? "net" : "gross"} revenue</div>
                </td>
                <td className="px-10 py-8">
                  <div className="text-2xl font-bold">
                    {formatCurrency(assetMarketValue.reduce((sum, asset) => sum + asset.totalAssetValue, 0))}
                  </div>
                  <div className="text-base opacity-80">total asset value</div>
                </td>
                <td className="px-10 py-8">
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      (cpfToggle === "withCPF" 
                        ? cumulativeYearlyData.reduce((sum, data) => sum + data.revenueWithCPF, 0)
                        : cumulativeYearlyData.reduce((sum, data) => sum + data.revenueWithoutCPF, 0)
                      ) + assetMarketValue.reduce((sum, asset) => sum + asset.totalAssetValue, 0)
                    )}
                  </div>
                  <div className="text-base opacity-80">total combined value</div>
                </td>
              </tr>
              <div className="h-10"></div>
            </tfoot>
          </table>
        </div>

        {/* Explanation Section */}
        <div className="p-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-blue-200">
              <div className="text-lg font-bold text-blue-700 mb-2">Annual Revenue</div>
              <div className="text-sm text-gray-600">
                {cpfToggle === "withCPF" 
                  ? "Net revenue from milk sales after deducting CPF costs (₹13,000 per buffalo aged 3+ years)"
                  : "Gross revenue from milk sales before CPF deductions"
                }
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-orange-200">
              <div className="text-lg font-bold text-orange-700 mb-2">Asset Market Value</div>
              <div className="text-sm text-gray-600">
                Market value of your buffalo herd based on age-based pricing (₹3,000 for calves to ₹1,75,000 for mother buffaloes)
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-indigo-200">
              <div className="text-lg font-bold text-indigo-700 mb-2">Combined Value</div>
              <div className="text-sm text-gray-600">
                Total value = Annual Revenue + Asset Market Value. Represents the complete financial position for each year.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-8xl mx-auto">
          <div className="h-5"></div>
          {/* Header */}
          <div className="text-center mb-16 xl:mb-7">
            <div className="inline-block  bg-gray-500 text-white px-12 py-8 rounded-2xl shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300 xl:px-5 xl:py-2 xl:my-5 xl:w-11/12">
              <h1 className="text-5xl font-bold mb-4 xl:text-3xl xl:mb-2">Buffalo Herd Investment Analysis (2026-2035)</h1>
              <h2 className="text-3xl font-semibold opacity-90 xl:text-lg">2 Mother Buffaloes (60 months) + 2 Calves per Unit | Complete Financial Projection</h2>
            </div>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed xl:text-lg">
              Comprehensive financial analysis for {treeData.units} starting unit{treeData.units > 1 ? 's' : ''} over 10 years (2026-2035)
              <br />
              <span className="text-lg text-gray-500 xl:text-[0.8rem]">
                Each unit: 2 mother buffaloes (₹1.75L each) + 2 newborn calves + ONE CPF coverage (₹13,000) for both mothers
              </span>
            </p>
          </div>
          <div className="h-5 xl:h-0"></div>

          <SummaryCards />
          <div className='w-full flex items-center justify-center text-white mb-8 flex-wrap gap-2'>
            <button 
              onClick={() => SetActiveTab("Monthly Revenue Break")} 
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${
                activeTab === "Monthly Revenue Break" 
                  ? 'bg-green-500 text-black shadow-lg transform scale-105' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Monthly Revenue Break
            </button>
           
            <button 
              onClick={() => SetActiveTab("Revenue Break Even")} 
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${
                activeTab === "Revenue Break Even" 
                  ? 'bg-green-500 text-black shadow-lg transform scale-105' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Revenue Break Even
            </button>
            <button 
              onClick={() => SetActiveTab("Asset Market Value")} 
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${
                activeTab === "Asset Market Value" 
                  ? 'bg-green-500 text-black shadow-lg transform scale-105' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Asset Market Value
            </button>
            <button 
              onClick={() => SetActiveTab("Herd Performance")} 
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${
                activeTab === "Herd Performance" 
                  ? 'bg-green-500 text-black shadow-lg transform scale-105' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Herd Performance
            </button>
            <button 
              onClick={() => SetActiveTab("Annual Herd Revenue")} 
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${
                activeTab === "Annual Herd Revenue" 
                  ? 'bg-green-500 text-black shadow-lg transform scale-105' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Annual Herd Revenue
            </button>
             <button 
              onClick={() => SetActiveTab("Break Even Timeline")} 
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${
                activeTab === "Break Even Timeline" 
                  ? 'bg-green-500 text-black shadow-lg transform scale-105' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Break Even Timeline
            </button>
          </div>
          <div className='w-full'>
            {activeTab === "Monthly Revenue Break" &&
              <div>
                {/* Detailed Monthly Revenue Components */}
                <DetailedMonthlyRevenueBreakdown />
              </div>}
            {activeTab === "Break Even Timeline" &&
              <div>
                {/* Break-Even Timeline Component */}
                <BreakEvenTimeline />
              </div>}
            {activeTab === "Revenue Break Even" &&
              <div>
                {/* Revenue Break-Even Analysis */}
                <RevenueBreakEvenAnalysis />
              </div>}
            {activeTab === "Asset Market Value" &&
              <div>
                {/* Buffalo Value By Age Component */}
                <BuffaloValueByAge />
                {/* Asset Market Value */}
                <AssetMarketValue />
              </div>}
            {activeTab === "Herd Performance" &&
              <div>
                {/* Enhanced GRAPHS SECTION */}
                <div className="mb-16">
                  <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100">
                    <div className="pt-16 pb-8">
                      <div className="h-5"></div>
                      <h2 className="text-5xl font-bold text-gray-800 text-center flex items-center justify-center gap-6">
                        Herd Performance Analytics (2026-2035)
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
                              ? `bg-gradient-to-r from-${button.color}-500 to-${button.color === 'green' ? 'emerald' :
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
              </div>}
            {activeTab === "Annual Herd Revenue" &&
              <div>
                <RevenueTable />
              </div>}
          </div>
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