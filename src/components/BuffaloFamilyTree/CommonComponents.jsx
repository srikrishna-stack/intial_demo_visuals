import React from 'react';

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

// Build tree function
export const buildTree = (root, all) => {
  return all.filter((b) => b.parentId === root.id);
};

// Buffalo Node Component
export const BuffaloNode = ({ data, founder }) => (
  <div className="flex flex-col items-center group relative">
    <div
      className={`${
        colors[data.generation % colors.length]
      } rounded-full w-16 h-16 flex flex-col justify-center items-center text-white shadow-lg transform transition-all duration-200 hover:scale-110 border-2 border-white`}
    >
      <div className="text-sm font-bold">
        {founder ? `B${data.id}` : data.birthYear}
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
          Parent: B{data.parentId}
        </div>
      )}
    </div>
  </div>
);

// Curved Arrow Component
export const CurvedArrow = ({ flip, hasSiblings, index }) => {
  const strokeColor = "#4F46E5";
  const strokeWidth = 2;
  
  return (
    <div className={`relative ${hasSiblings ? (index === 0 ? "-mr-3" : "-ml-3") : ""}`}>
      <svg
        width="60"
        height="30"
        viewBox="0 0 60 30"
        className={flip ? "scale-x-[-1]" : ""}
      >
        <path
          d="M10 25 C 30 5, 30 5, 50 25"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={hasSiblings ? "3,3" : "0"}
          markerEnd={hasSiblings ? "url(#arrowhead-dashed)" : "url(#arrowhead)"}
        />
        <defs>
          <marker
            id="arrowhead"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 4 2, 0 4" fill={strokeColor} />
          </marker>
          <marker
            id="arrowhead-dashed"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 4 2, 0 4" fill={strokeColor} />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

// Tree Branch Component
export const TreeBranch = ({ parent, all, level = 0 }) => {
  const kids = buildTree(parent, all);
  if (kids.length === 0) return null;

  return (
    <div className="flex flex-col items-center mt-4">
      {kids.length === 1 ? (
        <div className="flex flex-col items-center">
          <CurvedArrow flip={false} hasSiblings={false} />
          <div className="mt-1">
            <BuffaloNode data={kids[0]} />
          </div>
          <TreeBranch parent={kids[0]} all={all} level={level + 1} />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <div className="absolute top-0 left-2 right-2 h-0.5 bg-indigo-400 transform -translate-y-full"></div>
          </div>
          <div className="flex gap-4 justify-center">
            {kids.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center">
                <CurvedArrow 
                  flip={i === kids.length - 1} 
                  hasSiblings={kids.length > 1}
                  index={i}
                />
                <div className="mt-1">
                  <BuffaloNode data={child} />
                </div>
                <TreeBranch parent={child} all={all} level={level + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};