import React from 'react';
import { Move, Maximize, Minimize, Scan } from "lucide-react";
import { BuffaloNode, TreeBranch } from './CommonComponents';

const TreeVisualization = ({
  treeData,
  zoom,
  position,
  isDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  containerRef,
  treeContainerRef,
  isFullScreen,
  toggleFullScreen,
  handleFitToScreen, // New prop
}) => {
  if (!treeData) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-14 shadow-2xl border border-gray-200 text-center max-w-4xl">
          <div className="text-7xl mb-8">🐃</div>
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Buffalo Family Tree Simulator
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Simulate the growth of your buffalo herd over time. Watch as your founding buffalos
            create generations of offspring in this interactive family tree visualization.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-xl mb-3">Configure</h3>
              <p className="text-base text-gray-600">Set your starting units and simulation period</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-bold text-xl mb-3">Simulate</h3>
              <p className="text-base text-gray-600">Run the simulation to generate your herd</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🌳</div>
              <h3 className="font-bold text-xl mb-3">Explore</h3>
              <p className="text-base text-gray-600">Navigate through the interactive family tree</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-6 rounded-2xl font-bold text-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-2xl inline-flex items-center gap-3"
          >
            Start Your First Simulation
          </button>
        </div>
      </div>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Function to get buffalo display name (A1, A2, etc.)
  const getBuffaloDisplayName = (buffalo) => {
    return `A${buffalo.id}`;
  };

  return (
    <div
      className="flex-1 relative overflow-auto"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      {/* Controls Info */}
      <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-200">
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
          <Move size={16} />
          <span>Drag to pan | Scroll to zoom</span>
        </div>
        <div className="text-sm text-gray-600 mb-3">Use buttons to reset zoom</div>

        {/* Helper Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            onClick={handleFitToScreen}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors justify-center"
            title="Fit to Screen"
          >
            <Scan size={14} />
            <span>Fit View</span>
          </button>
          <button
            onClick={toggleFullScreen}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors justify-center"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? (
              <>
                <Minimize size={14} />
                <span>Exit</span>
              </>
            ) : (
              <>
                <Maximize size={14} />
                <span>Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="absolute top-6 right-6 z-10 flex gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-5 shadow-xl text-white min-w-[160px]">
          <div className="text-2xl font-bold">{treeData.totalBuffaloes}</div>
          <div className="text-sm opacity-90">Total Buffaloes</div>
        </div>

        {/* Revenue Display */}
        {treeData.revenueData && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-5 shadow-xl text-white min-w-[160px]">
            <div className="text-2xl font-bold">₹{Math.round(treeData.revenueData.totalRevenue / 100000)}L+</div>
            <div className="text-sm opacity-90">Total Revenue</div>
          </div>
        )}
      </div>

      {/* Tree Visualization Container */}
      <div
        ref={treeContainerRef}
        className="w-full h-full p-10"
        style={{
          transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease',
          minWidth: `${100 * zoom}%`,
          minHeight: `${100 * zoom}%`,
          transformOrigin: '0 0'
        }}
      >
        {/* flex-nowrap to prevent wrapping, min-w-max to ensure full width */}
        <div className="flex flex-wrap gap-10 justify-center">
          {treeData.buffaloes
            .filter((b) => b.parentId === null)
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
                    Started: {monthNames[treeData.startMonth]} {treeData.startDay}, {treeData.startYear}
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
    </div>
  );
};

export default TreeVisualization;