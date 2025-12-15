import React, { useState, useEffect } from 'react';
import { Move, Maximize, Minimize, Scan, LayoutGrid } from "lucide-react";
import { useXarrow, Xwrapper } from "react-xarrows";
import { BuffaloNode, TreeBranch, formatCurrency } from './CommonComponents';

const TreeVisualization = ({
  treeData,
  zoom,
  containerRef,
  treeContainerRef,
  isFullScreen,
  toggleFullScreen,
  handleFitToScreen,
}) => {
  const updateXarrow = useXarrow();
  const [activeFounderId, setActiveFounderId] = useState("all");

  // Reset to "all" when treeData changes (new simulation)
  useEffect(() => {
    if (treeData) {
      setActiveFounderId("all");
    }
  }, [treeData]);

  if (!treeData) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-14 shadow-2xl border border-gray-200 text-center max-w-4xl">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Buffalo Family Tree Simulator
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Simulate the growth of your buffalo herd over time. Watch as your founding buffalos
            create generations of offspring in this interactive family tree visualization.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="text-center p-6">
              <h3 className="font-bold text-xl mb-3">Configure</h3>
              <p className="text-base text-gray-600">Set your starting units and simulation period</p>
            </div>
            <div className="text-center p-6">
              <h3 className="font-bold text-xl mb-3">Simulate</h3>
              <p className="text-base text-gray-600">Run the simulation to generate your herd</p>
            </div>
            <div className="text-center p-6">
              <h3 className="font-bold text-xl mb-3">Explore</h3>
              <p className="text-base text-gray-600">Navigate through the interactive family tree</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Function to get buffalo display name (A1, A2, etc.)
  const getBuffaloDisplayName = (buffalo) => {
    return buffalo.id;
  };

  // Determine current stats based on selection
  const filteredBuffaloes = activeFounderId === "all"
    ? treeData.buffaloes
    : treeData.buffaloes.filter(b => b.rootId === activeFounderId || b.id === activeFounderId);

  const stats = {
    count: filteredBuffaloes.length,
    revenue: filteredBuffaloes.reduce((sum, b) => sum + (b.lifetimeRevenue || 0), 0),
    netRevenue: activeFounderId === "all" && treeData.summaryStats ? treeData.summaryStats.totalNetRevenue : filteredBuffaloes.reduce((sum, b) => sum + (b.lifetimeNet || 0), 0),
    assetValue: filteredBuffaloes.reduce((sum, b) => sum + (b.currentAssetValue || 0), 0),
    producing: filteredBuffaloes.filter(b => b.ageInMonths >= 36).length,
    nonProducing: filteredBuffaloes.filter(b => b.ageInMonths < 36).length
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Fixed Header Section - Responsive Layout */}
      <div className="flex-none bg-white/95 backdrop-blur-md shadow-sm z-20 px-4 py-3 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto no-scrollbar md:overflow-visible">

        {/* Left Side: Controls & Tabs */}
        <div className="flex items-center gap-4 flex-shrink-0 w-full md:w-auto overflow-x-auto no-scrollbar">
          {/* View Controls */}
          <button
            onClick={toggleFullScreen}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? <Minimize size={14} /> : <Maximize size={14} />}
            <span className="whitespace-nowrap hidden sm:inline">{isFullScreen ? "Exit" : "Expand"}</span>
          </button>

          {/* Unit Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFounderId("all")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeFounderId === "all"
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <LayoutGrid size={14} />
              All Units
            </button>
            {treeData.lineages && Object.values(treeData.lineages).map((lineage) => (
              <button
                key={lineage.id}
                onClick={() => setActiveFounderId(lineage.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeFounderId === lineage.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <span>Unit {lineage.unit} - {lineage.id}</span>
                <span className="bg-black/10 px-1.5 rounded text-[10px]">{lineage.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Stats Cards (Responsive Grid/Scroll) */}
        <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {/* Buffaloes */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 min-w-[100px] shadow-sm flex-shrink-0">
            <div className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider">Buffaloes</div>
            <div className="text-base font-black text-gray-800">{stats.count}</div>
          </div>

          {/* Revenue -> Cumulative Net */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 min-w-[110px] shadow-sm flex-shrink-0">
            <div className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider">Cumulative Net</div>
            <div className="text-base font-black text-green-600">
              {stats.netRevenue > 100000
                ? `${(stats.netRevenue / 100000).toFixed(2)}L`
                : formatCurrency(stats.netRevenue)}
            </div>
          </div>

          {/* Asset Value */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 min-w-[110px] shadow-sm flex-shrink-0">
            <div className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider">Asset Value</div>
            <div className="text-base font-black text-indigo-600">
              {stats.assetValue > 100000
                ? `${(stats.assetValue / 100000).toFixed(2)}L`
                : formatCurrency(stats.assetValue)}
            </div>
          </div>

          {/* Producing */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 min-w-[90px] shadow-sm flex-shrink-0">
            <div className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider">Producing</div>
            <div className="text-base font-black text-teal-700">{stats.producing}</div>
          </div>

          {/* Non-Producing */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 min-w-[100px] shadow-sm flex-shrink-0">
            <div className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider">Non-Producing</div>
            <div className="text-base font-black text-amber-700">{stats.nonProducing}</div>
          </div>
        </div>
      </div>

      {/* Scrollable Tree Container */}
      <div
        ref={containerRef}
        onScroll={updateXarrow}
        className="flex-1 overflow-auto relative bg-gradient-to-br from-blue-50 to-indigo-50"
      >
        <Xwrapper>
          <div
            ref={treeContainerRef}
            className="inline-block p-10 min-w-full min-h-full transition-transform duration-300 ease-out" /* Reverted to inline-block for expansion */
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              width: 'max-content',
              height: 'max-content'
            }}
          >
            {/* flex-col to stack roots vertically (A on top of B) */}
            <div className="flex flex-col gap-24 items-start">
              {treeData.buffaloes
                .filter((b) => b.parentId === null) // Founders
                .filter((b) => activeFounderId === "all" || b.id === activeFounderId) // Filter by tab
                .map((founder) => (
                  <div
                    key={founder.id}
                    className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-gray-200 flex-shrink-0"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-xl font-bold text-gray-800 mb-2">
                        Unit {founder.unit} - {getBuffaloDisplayName(founder)}
                      </h2>
                      <div className="text-sm text-gray-600 mb-2">
                        Started: {founder.startedAt}
                      </div>
                      <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="flex flex-col items-center">
                      <BuffaloNode
                        data={founder}
                        founder
                        displayName={getBuffaloDisplayName(founder)}
                        elementId={`buffalo-${founder.id}`}
                      />
                      <TreeBranch
                        parent={founder}
                        all={treeData.buffaloes}
                        getDisplayName={getBuffaloDisplayName}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Xwrapper>
      </div>
    </div>
  );
};

export default TreeVisualization;