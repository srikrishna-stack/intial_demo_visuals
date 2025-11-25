import React, { useState, useRef, useEffect } from "react";
import HeaderControls from './HeaderControls';
import TreeVisualization from './TreeVisualization';
import CostEstimationTable from './CostEstimationTable';
import { formatCurrency, formatNumber } from './CommonComponents';

export default function BuffaloFamilyTree() {
  const [units, setUnits] = useState(1);
  const [years, setYears] = useState(10);
  const [startYear, setStartYear] = useState(2026);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCostEstimation, setShowCostEstimation] = useState(false);
  const [activeGraph, setActiveGraph] = useState("revenue");
  
  const containerRef = useRef(null);
  const treeContainerRef = useRef(null);

  // Milk production configuration
  const milkConfig = {
    pricePerLiter: 100,
    productionSchedule: {
      highProduction: { months: 5, litersPerDay: 10 },
      mediumProduction: { months: 3, litersPerDay: 5 },
      restPeriod: { months: 4, litersPerDay: 0 }
    }
  };

  // Calculate milk production for a single buffalo in a year
  const calculateYearlyMilkProduction = (buffalo, year) => {
    if (buffalo.age < 3) return 0;
    
    const birthYear = buffalo.birthYear;
    const buffaloAgeInYear = year - birthYear;
    
    if (buffaloAgeInYear < 3) return 0;
    
    const gaveBirthThisYear = buffaloAgeInYear >= 3;
    
    if (!gaveBirthThisYear) return 0;
    
    const { highProduction, mediumProduction } = milkConfig.productionSchedule;
    
    const highProductionLiters = highProduction.months * 30 * highProduction.litersPerDay;
    const mediumProductionLiters = mediumProduction.months * 30 * mediumProduction.litersPerDay;
    
    return highProductionLiters + mediumProductionLiters;
  };

  // Calculate total milk production and revenue
  const calculateMilkProduction = (herd, startYear, totalYears) => {
    const yearlyData = [];
    let totalRevenue = 0;
    let totalLiters = 0;

    for (let year = startYear; year < startYear + totalYears; year++) {
      let yearLiters = 0;
      let producingBuffaloes = 0;
      let totalBuffaloesInYear = 0;

      herd.forEach(buffalo => {
        const milkProduction = calculateYearlyMilkProduction(buffalo, year);
        yearLiters += milkProduction;
        if (milkProduction > 0) producingBuffaloes++;
        if (buffalo.birthYear <= year) {
          totalBuffaloesInYear++;
        }
      });

      const yearRevenue = yearLiters * milkConfig.pricePerLiter;
      totalRevenue += yearRevenue;
      totalLiters += yearLiters;

      yearlyData.push({
        year,
        producingBuffaloes,
        nonProducingBuffaloes: totalBuffaloesInYear - producingBuffaloes,
        totalBuffaloes: totalBuffaloesInYear,
        liters: yearLiters,
        revenue: yearRevenue
      });
    }

    return {
      yearlyData,
      totalRevenue,
      totalLiters,
      averageAnnualRevenue: totalRevenue / totalYears
    };
  };

  // Simulation logic with milk production
  const runSimulation = () => {
    setLoading(true);
    setTimeout(() => {
      const totalYears = Number(years);
      const herd = [];
      let nextId = 1;

      for (let u = 0; u < units; u++) {
        herd.push({
          id: nextId++,
          age: 3,
          mature: true,
          parentId: null,
          generation: 0,
          birthYear: startYear - 3,
          unit: u + 1,
        });

        herd.push({
          id: nextId++,
          age: 3,
          mature: true,
          parentId: null,
          generation: 0,
          birthYear: startYear - 3,
          unit: u + 1,
        });
      }

      for (let year = 1; year <= totalYears; year++) {
        const currentYear = startYear + (year - 1);
        const moms = herd.filter((b) => b.age >= 3);

        moms.forEach((mom) => {
          herd.push({
            id: nextId++,
            age: 0,
            mature: false,
            parentId: mom.id,
            birthYear: currentYear,
            generation: mom.generation + 1,
            unit: mom.unit,
          });
        });

        herd.forEach((b) => {
          b.age++;
          if (b.age >= 3) b.mature = true;
        });
      }

      // Calculate milk production
      const milkProductionData = calculateMilkProduction(herd, startYear, totalYears);

      setTreeData({
        units,
        years,
        startYear,
        totalBuffaloes: herd.length,
        buffaloes: herd,
        milkData: milkProductionData
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
        <div className="text-2xl text-gray-700 font-semibold">Simulating Buffalo Herd...</div>
        <div className="text-base text-gray-500 mt-3">This may take a moment</div>
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
      />
    </div>
  );
}