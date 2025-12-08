import React, { useState, useRef, useEffect } from "react";
import HeaderControls from './HeaderControls';
import TreeVisualization from './TreeVisualization';
import { formatCurrency, formatNumber } from './CommonComponents';
import CostEstimationTable from "../CostEstimation/CostEstimationTable";

export default function BuffaloFamilyTree() {
  const [units, setUnits] = useState(1);
  const [years, setYears] = useState(10);
  const [startYear, setStartYear] = useState(2026);
  const [startMonth, setStartMonth] = useState(0);
  const [startDay, setStartDay] = useState(1);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeGraph, setActiveGraph] = useState("revenue");
  const [activeTab, setActiveTab] = useState("familyTree");

  const containerRef = useRef(null);
  const treeContainerRef = useRef(null);

  // Get days in month for day selection
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const [daysInMonth, setDaysInMonth] = useState(getDaysInMonth(startYear, startMonth));

  // Update days in month when year or month changes
  useEffect(() => {
    const days = getDaysInMonth(startYear, startMonth);
    setDaysInMonth(days);
    if (startDay > days) {
      setStartDay(1);
    }
  }, [startYear, startMonth]);

  // Staggered revenue configuration
  const revenueConfig = {
    landingPeriod: 2,
    highRevenuePhase: { months: 5, revenue: 9000 },
    mediumRevenuePhase: { months: 3, revenue: 6000 },
    restPeriod: { months: 4, revenue: 0 }
  };

  // Calculate monthly revenue for EACH buffalo based on its individual cycle
  const calculateMonthlyRevenueForBuffalo = (buffaloId, acquisitionMonth, currentYear, currentMonth) => {
    const monthsSinceAcquisition = (currentYear - startYear) * 12 + (currentMonth - acquisitionMonth);

    if (monthsSinceAcquisition < revenueConfig.landingPeriod) {
      return 0;
    }

    const productionMonths = monthsSinceAcquisition - revenueConfig.landingPeriod;
    const cyclePosition = productionMonths % 12;

    if (cyclePosition < revenueConfig.highRevenuePhase.months) {
      return revenueConfig.highRevenuePhase.revenue;
    } else if (cyclePosition < revenueConfig.highRevenuePhase.months + revenueConfig.mediumRevenuePhase.months) {
      return revenueConfig.mediumRevenuePhase.revenue;
    } else {
      return revenueConfig.restPeriod.revenue;
    }
  };

  // Calculate annual revenue for ALL mature buffaloes with individual cycles
  const calculateAnnualRevenueForHerd = (herd, startYear, startMonth, currentYear) => {
    let annualRevenue = 0;

    const matureBuffaloes = herd.filter(buffalo => {
      const ageInCurrentYear = currentYear - buffalo.birthYear;
      return ageInCurrentYear >= 3;
    });

    matureBuffaloes.forEach((buffalo) => {
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

  // Calculate total revenue data based on ACTUAL herd growth with staggered cycles
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
        startDay: startDay,
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

  // Simulation logic with staggered acquisition months
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
          acquisitionMonth: startMonth,
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
          acquisitionMonth: (startMonth + 6) % 12,
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
            acquisitionMonth: parent.acquisitionMonth,
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
        startDay,
        totalBuffaloes: herd.length,
        buffaloes: herd,
        revenueData: revenueData
      });

      setLoading(false);
      setActiveTab("familyTree");
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
    setStartDay(1);
    setActiveTab("familyTree");
    setZoom(1);
    setPosition({ x: 0, y: 0 });
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

  // Fit to screen functionality
  const handleFitToScreen = () => {
    if (!containerRef.current || !treeContainerRef.current) return;

    // Reset zoom/position first to get accurate measurements without transform
    // We'll calculate based on the current content size

    const container = containerRef.current;

    // We need to access the inner content wrapper (the one with flex-wrap)
    // The treeContainerRef might be the wrapper that has the transform
    // So we look for the first child which contains the actual nodes
    const content = treeContainerRef.current.firstElementChild;

    if (!content) return;

    const containerRect = container.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    // Calculate scale needed to fit width and height with some padding
    const padding = 40;

    // We use the UN-SCALED dimensions for calculation if possible, 
    // but since we might be zoomed in, we reverse the current zoom calculation
    // effectiveWidth = currentRectWidth / currentZoom
    const currentZoom = zoom;
    const effectiveContentWidth = contentRect.width / currentZoom;
    const effectiveContentHeight = contentRect.height / currentZoom;

    const scaleX = (containerRect.width - padding * 2) / effectiveContentWidth;
    const scaleY = (containerRect.height - padding * 2) / effectiveContentHeight;

    // Use the smaller scale to ensure it fits both dimensions, but cap it at 1 (don't zoom in too much for small trees)
    // Also set a minimum zoom to avoid making it too tiny
    const newZoom = Math.min(Math.min(scaleX, scaleY), 1.5); // Allow slight zoom in for small trees
    const constrainedZoom = Math.max(newZoom, 0.2); // Don't go below 0.2

    // Center the content
    // The content will be centered by the parent flex/grid if it's smaller, 
    // but for our transform logic, let's reset position to 0,0 or calculate center if needed.
    // Our CSS transformOrigin is '0 0', so we need to translate to center it.

    const scaledContentWidth = effectiveContentWidth * constrainedZoom;
    const scaledContentHeight = effectiveContentHeight * constrainedZoom;

    const x = (containerRect.width - scaledContentWidth) / 2;
    const y = (containerRect.height - scaledContentHeight) / 2;

    setZoom(constrainedZoom);
    setPosition({ x: x > 0 ? x : 0, y: y > 0 ? y : 0 }); // If negative (shouldn't be if we fit), clamp to 0
  };

  // Auto-fit on initial data load
  useEffect(() => {
    if (treeData) {
      // Small timeout to allow DOM to render
      setTimeout(handleFitToScreen, 100);
    }
  }, [treeData]);

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

  // Toggle Full Screen
  const [isFullScreen, setIsFullScreen] = useState(false);
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600 mb-6"></div>
        <div className="text-2xl text-gray-700 font-semibold">Growing Buffalo Herd...</div>
        <div className="text-base text-gray-500 mt-3">Simulating {units} unit{units > 1 ? 's' : ''} over {years} years</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col overflow-hidden">
      {!isFullScreen && (
        <HeaderControls
          units={units}
          setUnits={setUnits}
          years={years}
          setYears={setYears}
          startYear={startYear}
          setStartYear={setStartYear}
          startMonth={startMonth}
          setStartMonth={setStartMonth}
          startDay={startDay}
          setStartDay={setStartDay}
          daysInMonth={daysInMonth}
          runSimulation={runSimulation}
          treeData={treeData}
          resetSimulation={resetSimulation}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleResetView={handleResetView}
          zoom={zoom}
        />
      )}

      {/* Tab Navigation */}
      {!isFullScreen && treeData && (
        <div className="my-5">
          <div className="flex justify-center items-center gap-6 ">
            <button
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${activeTab === "familyTree"
                ? 'bg-green-500 text-black shadow-lg transform scale-105'
                : 'bg-black text-white hover:bg-gray-800'
                }`}
              onClick={() => setActiveTab("familyTree")}
            >
              Family Tree
            </button>
            <button
              className={`font-bold rounded-xl p-3 text-sm transition-all duration-300 ${activeTab === "costEstimation"
                ? 'bg-green-500 text-black shadow-lg transform scale-105'
                : 'bg-black text-white hover:bg-gray-800'
                }`}
              onClick={() => setActiveTab("costEstimation")}
            >
              Price Estimation
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "familyTree" ? (
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
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
            handleFitToScreen={handleFitToScreen}
          />
        ) : treeData ? (
          <div className="h-full overflow-auto bg-gradient-to-br from-blue-50 to-indigo-50">
            <CostEstimationTable
              treeData={treeData}
              activeGraph={activeGraph}
              setActiveGraph={setActiveGraph}
              onBack={() => setActiveTab("familyTree")}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Price Estimation</h2>
              <p className="text-gray-600">Run a simulation first to see price estimation data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}