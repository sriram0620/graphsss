"use client"

import React from 'react';
import { ChartToolbar } from './charts/ChartToolbar';
import type { ECharts } from 'echarts';
// Make sure all other component imports are correct
// Import any UI components you're using

interface DraggableChartProps {
  chartInstance: ECharts | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onBoxSelect: () => void;
  onLassoSelect: () => void;
  onClearSelection: () => void;
  data: any[];
  title: string;
  children: React.ReactNode;
}

export function DraggableChart({
  chartInstance,
  onZoomIn,
  onZoomOut,
  onBoxSelect,
  onLassoSelect,
  onClearSelection,
  data,
  title,
  children
}: DraggableChartProps) {
  // Your component logic

  return (
    <div className="relative w-full h-full">
      {/* Make sure ChartToolbar receives all required props */}
      <ChartToolbar
        chartInstance={chartInstance}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onBoxSelect={onBoxSelect}
        onLassoSelect={onLassoSelect}
        onClearSelection={onClearSelection}
        data={data}
        title={title}
      />
      {children}
      {/* Rest of your component JSX */}
    </div>
  );
} 