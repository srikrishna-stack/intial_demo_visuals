import React, { useState, useRef, useEffect } from "react";
import HeaderControls from './HeaderControls';
import TreeVisualization from './TreeVisualization';
import CostEstimationTable from './CostEstimationTable';
import { formatCurrency, formatNumber } from './CommonComponents';

export default function BuffaloFamilyTree() {
  const [units, setUnits] = useState(1);
  const [years, setYears] = useState(10);
  const [startYear, setStartYear] = useState(2026);
  const [startMonth, setStartMonth] = useState(0); // 0 = January
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCostEstimation, setShowCostEstimation] = useState(false);
  const [activeGraph, setActiveGraph] = useState("revenue");
  
  const containerRef = useRef(null);
  const treeContainerRef = useRef(null);

  // NEW: Staggered revenue configuration
  const revenueConfig = {
    landingPeriod: 2, // months for each buffalo
    highRevenuePhase: { months: 5, revenue: 9000 }, // 5 months of high revenue
    mediumRevenuePhase: { months: 3, revenue: 6000 }, // 3 months of medium revenue
    restPeriod: { months: 4, revenue: 0 } // 4 months rest
  };

  // NEW: Calculate monthly revenue for EACH buffalo based on its individual cycle
  const calculateMonthlyRevenueForBuffalo = (buffaloId, acquisitionMonth, currentYear, currentMonth) => {
    // Each buffalo starts its cycle from its acquisition month
    const monthsSinceAcquisition = (currentYear - startYear) * 12 + (currentMonth - acquisitionMonth);
    
    // First 2 months after acquisition are landing/rest
    if (monthsSinceAcquisition < revenueConfig.landingPeriod) {
      return 0;
    }
    
    const productionMonths = monthsSinceAcquisition - revenueConfig.landingPeriod;
    const cyclePosition = productionMonths % 12; // 12-month cycle
    
    if (cyclePosition < revenueConfig.highRevenuePhase.months) {
      return revenueConfig.highRevenuePhase.revenue;
    } else if (cyclePosition < revenueConfig.highRevenuePhase.months + revenueConfig.mediumRevenuePhase.months) {
      return revenueConfig.mediumRevenuePhase.revenue;
    } else {
      return revenueConfig.restPeriod.revenue;
    }
  };

  // UPDATED: Calculate annual revenue for ALL mature buffaloes with individual cycles
  const calculateAnnualRevenueForHerd = (herd, startYear, startMonth, currentYear) => {
    let annualRevenue = 0;
    
    // Count mature buffaloes (age >= 3) in current year
    const matureBuffaloes = herd.filter(buffalo => {
      const ageInCurrentYear = currentYear - buffalo.birthYear;
      return ageInCurrentYear >= 3;
    });

    // Calculate revenue for each mature buffalo with its individual cycle
    matureBuffaloes.forEach((buffalo, index) => {
      // Stagger acquisition: first buffalo in Jan (0), second in July (6)
      const acquisitionMonth = buffalo.acquisitionMonth;
      
      for (let month = 0; month < 12; month++) {
        annualRevenue += calculateMonthlyRevenueForBuffalo(
          buffalo.id, 
          acquisitionMonth, 
          currentYear, 
          month
        );
      }
    });

    return {
      annualRevenue,
      matureBuffaloes: matureBuffaloes.length,
      totalBuffaloes: herd.filter(buffalo => buffalo.birthYear <= currentYear).length
    };
  };

  // UPDATED: Calculate total revenue data based on ACTUAL herd growth with staggered cycles
  const calculateRevenueData = (herd, startYear, startMonth, totalYears) => {
    const yearlyData = [];
    let totalRevenue = 0;
    let totalMatureBuffaloYears = 0;

    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];

    for (let yearOffset = 0; yearOffset < totalYears; yearOffset++) {
      const currentYear = startYear + yearOffset;
      
      const { annualRevenue, matureBuffaloes, totalBuffaloes } = 
        calculateAnnualRevenueForHerd(herd, startYear, startMonth, currentYear);

      totalRevenue += annualRevenue;
      totalMatureBuffaloYears += matureBuffaloes;

      const monthlyRevenuePerBuffalo = matureBuffaloes > 0 ? annualRevenue / (matureBuffaloes * 12) : 0;

      yearlyData.push({
        year: currentYear,
        activeUnits: Math.ceil(totalBuffaloes / 2),
        monthlyRevenue: monthlyRevenuePerBuffalo,
        revenue: annualRevenue,
        totalBuffaloes: totalBuffaloes,
        producingBuffaloes: matureBuffaloes,
        nonProducingBuffaloes: totalBuffaloes - matureBuffaloes,
        startMonth: monthNames[startMonth],
        startYear: startYear,
        matureBuffaloes: matureBuffaloes
      });
    }

    return {
      yearlyData,
      totalRevenue,
      totalUnits: totalMatureBuffaloYears / totalYears,
      averageAnnualRevenue: totalRevenue / totalYears,
      revenueConfig,
      totalMatureBuffaloYears
    };
  };

  // UPDATED: Simulation logic with staggered acquisition months
  const runSimulation = () => {
    setLoading(true);
    setTimeout(() => {
      const totalYears = Number(years);
      const herd = [];
      let nextId = 1;

      // Create initial buffaloes (2 per unit) with staggered acquisition
      for (let u = 0; u < units; u++) {
        // First buffalo - acquired in January
        herd.push({
          id: nextId++,
          age: 3,
          mature: true,
          parentId: null,
          generation: 0,
          birthYear: startYear - 3,
          acquisitionMonth: startMonth, // January (0)
          unit: u + 1,
        });

        // Second buffalo - acquired in July (6 months later)
        herd.push({
          id: nextId++,
          age: 3,
          mature: true,
          parentId: null,
          generation: 0,
          birthYear: startYear - 3,
          acquisitionMonth: (startMonth + 6) % 12, // July (6)
          unit: u + 1,
        });
      }

      // Simulate years
      for (let year = 1; year <= totalYears; year++) {
        const currentYear = startYear + (year - 1);
        const matureBuffaloes = herd.filter((b) => b.age >= 3);

        // Each mature buffalo gives birth to one offspring per year
        matureBuffaloes.forEach((parent) => {
          herd.push({
            id: nextId++,
            age: 0,
            mature: false,
            parentId: parent.id,
            birthYear: currentYear,
            acquisitionMonth: parent.acquisitionMonth, // Inherit parent's cycle
            generation: parent.generation + 1,
            unit: parent.unit,
          });
        });

        // Age all buffaloes
        herd.forEach((b) => {
          b.age++;
          if (b.age >= 3) b.mature = true;
        });
      }

      // Calculate revenue data based on ACTUAL herd growth with staggered cycles
      const revenueData = calculateRevenueData(herd, startYear, startMonth, totalYears);

      setTreeData({
        units,
        years,
        startYear,
        startMonth,
        totalBuffaloes: herd.length,
        buffaloes: herd,
        revenueData: revenueData
      });

      setLoading(false);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }, 300);
  };

  // Reset function
  const resetSimulation = () => {
    setTreeData(null);
    setUnits(1);
    setYears(10);
    setStartYear(2026);
    setStartMonth(0);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setShowCostEstimation(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Drag to pan functionality
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600 mb-6"></div>
        <div className="text-2xl text-gray-700 font-semibold">Growing Buffalo Herd...</div>
        <div className="text-base text-gray-500 mt-3">Simulating {units} unit{units > 1 ? 's' : ''} over {years} years</div>
      </div>
    );
  }

  if (showCostEstimation) {
    return (
      <CostEstimationTable 
        treeData={treeData}
        activeGraph={activeGraph}
        setActiveGraph={setActiveGraph}
        setShowCostEstimation={setShowCostEstimation}
      />
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col overflow-hidden">
      <HeaderControls
        units={units}
        setUnits={setUnits}
        years={years}
        setYears={setYears}
        startYear={startYear}
        setStartYear={setStartYear}
        startMonth={startMonth}
        setStartMonth={setStartMonth}
        runSimulation={runSimulation}
        treeData={treeData}
        resetSimulation={resetSimulation}
        setShowCostEstimation={setShowCostEstimation}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleResetView={handleResetView}
        zoom={zoom}
      />
      
      <TreeVisualization
        treeData={treeData}
        zoom={zoom}
        position={position}
        isDragging={isDragging}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        containerRef={containerRef}
        treeContainerRef={treeContainerRef}
        onShowCostEstimation={() => setShowCostEstimation(true)}
      />
    </div>
  );
}