import React, { useEffect, useState } from 'react';
import Xarrow from "react-xarrows";

const lineColors = [
  "#ff9800", // gen 0 → 1
  "#3f51b5",
  "#009688",
  "#e91e63",
  "#f44336",
  "#9c27b0",
  "#4caf50"
];

// Colors array for different generations
export const colors = [
  "bg-gradient-to-br from-amber-400 to-amber-600",
  "bg-gradient-to-br from-indigo-400 to-indigo-600",
  "bg-gradient-to-br from-teal-400 to-teal-600",
  "bg-gradient-to-br from-pink-400 to-pink-600",
  "bg-gradient-to-br from-red-400 to-red-600",
  "bg-gradient-to-br from-purple-400 to-purple-600",
  "bg-gradient-to-br from-green-400 to-green-600",
];

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Format number
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// Calculate Age in Months
export const calculateAgeInMonths = (buffalo, targetYear, targetMonth = 0) => {
  const birthYear = buffalo.birthYear;
  // Use birthMonth if available, fall back to acquisitionMonth or 0
  const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
  const totalMonths = (targetYear - birthYear) * 12 + (targetMonth - birthMonth);
  return Math.max(0, totalMonths);
};

// Get Buffalo Value by Age
export const getBuffaloValueByAge = (ageInMonths) => {
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

// Build tree function
export const buildTree = (root, all) => {
  return all.filter((b) => b.parentId === root.id);
};

// Buffalo Node Component - Updated to accept elementId and parentDisplayName AND show tooltip
export const BuffaloNode = ({ data, founder, displayName, elementId, parentDisplayName }) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const birthMonthName = monthNames[data.acquisitionMonth] || "Jan";

  return (
    <div id={elementId} className="flex flex-col items-center group relative z-10 hover:z-50">
      {/* Tooltip - Positioned to the RIGHT */}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:block z-50 w-64">
        <div className="bg-gray-900/95 backdrop-blur text-white text-xs rounded-xl py-3 px-4 shadow-2xl border border-gray-700 relative">
          <div className="font-bold text-base mb-2 border-b border-gray-700 pb-1 text-blue-300">
            {displayName} Details
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-400">Grandparent:</span>
              <span className="font-medium text-gray-200">{data.grandParentId || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Parent:</span>
              <span className="font-medium text-gray-200">{parentDisplayName || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Born:</span>
              <span className="font-medium text-gray-200">{birthMonthName} {data.birthYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Age:</span>
              <span className="font-medium text-gray-200">{data.ageDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lifetime Revenue:</span>
              <span className="font-medium text-green-400">{formatCurrency(data.lifetimeRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cumulative Net:</span>
              <span className="font-medium text-emerald-400">{formatCurrency(data.lifetimeNet)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Asset Value:</span>
              <span className="font-medium text-blue-400">{formatCurrency(data.currentAssetValue)}</span>
            </div>
          </div>

          {/* Arrow pointing Left (towards the node) */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-gray-900/95"></div>
        </div>
      </div>

      <div
        className={`${colors[data.generation % colors.length]}
          rounded-full w-16 h-16 flex flex-col justify-center items-center
          text-white shadow-lg transform transition-all duration-200
          hover:scale-110 border-2 border-white cursor-help relative`}
      >
        {/* Producing Indicator */}


        <div className="text-sm font-bold">
          {displayName}
        </div>
        <div className="text-[9px] opacity-90 bg-black bg-opacity-20 px-1 rounded">
          Gen {data.generation}
        </div>
      </div>

      <div className="bg-white px-2 py-1 mt-1 rounded-lg shadow text-center border border-gray-200 min-w-[100px]">
        <div className="text-xs font-semibold text-gray-700">
          {founder ? `Founder` : `Born ${data.birthYear}`}
        </div>
        {!founder && (
          <div className="text-[9px] text-gray-500 mt-0.5">
            Parent: {parentDisplayName}
          </div>
        )}
      </div>
    </div>
  );
};

// Tree Branch Component with Xarrow - FIXED VERSION
export const TreeBranch = ({ parent, all, level = 0, getDisplayName, zoom = 1 }) => {
  const kids = buildTree(parent, all);
  const [forceUpdate, setForceUpdate] = useState(0);

  if (kids.length === 0) return null;

  // Force update arrows when zoom changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 50);
    return () => clearTimeout(timer);
  }, [zoom]);

  return (
    <div className="flex flex-col items-center mt-6">
      {/* Connecting line from parent */}
      <div className="h-10 w-0.5 bg-gradient-to-b from-gray-300 to-gray-400"></div>

      <div className="flex flex-wrap gap-6 justify-center items-start relative">
        {kids.map((child, index) => {
          const parentId = `buffalo-${parent.id}`;
          const childId = `buffalo-${child.id}`;

          return (
            <div key={`${child.id}-${forceUpdate}`} className="flex flex-col items-center relative">
              {/* Child Node */}
              <BuffaloNode
                data={child}
                displayName={getDisplayName(child)}
                parentDisplayName={getDisplayName(parent)}
                elementId={childId}
              />

              {/* Recursive children */}
              <TreeBranch
                parent={child}
                all={all}
                level={level + 1}
                getDisplayName={getDisplayName}
                zoom={zoom}
              />

              {/* Line between parent → child - Force update on zoom */}
              <Xarrow
                key={`arrow-${parent.id}-${child.id}-${forceUpdate}`}
                start={parentId}
                end={childId}
                color={lineColors[parent.generation % lineColors.length]}
                strokeWidth={2.5}
                curveness={0.6}
                showHead={true}
                headSize={4}
                path="smooth"
                dashness={false}
                startAnchor="bottom"
                endAnchor="top"
                zIndex={10}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};