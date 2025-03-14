"use client"

import React, { useCallback, useEffect, useState } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'; // Add Layout to imports
import { DraggableChart } from './DraggableChart';
import { DataPoint } from '@/types';
import _ from 'lodash';
import { DateRange } from 'react-day-picker';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ChartConfig {
  id: string;
  data: DataPoint[];
  type: 'line' | 'bar';
  title: string;
  width: number;
  height: number;
}

interface DynamicLayoutProps {
  charts: ChartConfig[];
  activeKPIs: Set<string>;
  kpiColors: Record<string, { color: string; name: string; icon: any }>;
  globalDateRange: DateRange | undefined;
}

export function DynamicLayout({ charts, activeKPIs, kpiColors, globalDateRange }: DynamicLayoutProps) {
  const [layouts, setLayouts] = useState({});
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [mounted, setMounted] = useState(false);

  // Generate layout based on number of charts
  const generateLayout = useCallback(() => {
    const numCharts = charts.length;
    let layout;

    switch (numCharts) {
      case 1:
        // Single chart takes full space
        layout = [{
          i: charts[0].id,
          x: 0,
          y: 0,
          w: 12,
          h: 12,
          minW: 3,
          maxW: 12,
          minH: 3,
          maxH: 12,
          isDraggable: true,
          isResizable: true
        }];
        break;

      case 2:
        // Two charts stacked vertically
        layout = charts.map((chart, i) => ({
          i: chart.id,
          x: 0,
          y: i * 6,
          w: 12,
          h: 6,
          minW: 3,
          maxW: 12,
          minH: 3,
          maxH: 8,
          isDraggable: true,
          isResizable: true
        }));
        break;

      case 3:
        // Three charts stacked vertically
        layout = charts.map((chart, i) => ({
          i: chart.id,
          x: 0,
          y: i * 4,
          w: 12,
          h: 4,
          minW: 3,
          maxW: 12,
          minH: 3,
          maxH: 8,
          isDraggable: true,
          isResizable: true
        }));
        break;

      case 4:
        // Four charts in 2x2 grid
        layout = charts.map((chart, i) => ({
          i: chart.id,
          x: (i % 2) * 6,
          y: Math.floor(i / 2) * 6,
          w: 6,
          h: 6,
          minW: 3,
          maxW: 12,
          minH: 3,
          maxH: 8,
          isDraggable: true,
          isResizable: true
        }));
        break;

      case 5:
      case 6:
        // 5-6 charts in 2x3 grid
        layout = charts.map((chart, i) => ({
          i: chart.id,
          x: (i % 2) * 6,
          y: Math.floor(i / 2) * 4,
          w: 6,
          h: 4,
          minW: 3,
          maxW: 12,
          minH: 3,
          maxH: 8,
          isDraggable: true,
          isResizable: true
        }));
        break;

      default:
        // 7-9 charts in 3x3 grid
        layout = charts.map((chart, i) => ({
          i: chart.id,
          x: (i % 3) * 4,
          y: Math.floor(i / 3) * 4,
          w: 4,
          h: 4,
          minW: 3,
          maxW: 12,
          minH: 3,
          maxH: 8,
          isDraggable: true,
          isResizable: true
        }));
        break;
    }

    return layout;
  }, [charts]);

  // Initialize layout on mount
  useEffect(() => {
    const initialLayout = generateLayout();
    const initialLayouts = {
      lg: initialLayout,
      md: initialLayout,
      sm: initialLayout,
      xs: initialLayout,
      xxs: initialLayout,
    };
    setLayouts(initialLayouts);
    setMounted(true);

    // Trigger resize event after a short delay to ensure proper rendering
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);

    return () => clearTimeout(timer);
  }, [generateLayout]);

  useEffect(() => {
    const newLayout = generateLayout();
    setLayouts(prev => ({
      ...prev,
      [currentBreakpoint]: newLayout
    }));
  }, [charts.length, generateLayout, currentBreakpoint]);

  const handleLayoutChange = (layout: any, layouts: any) => {
    setLayouts(layouts);
  };

  const handleBreakpointChange = (breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
  };

  const handleResizeStop = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout) => {
    setLayouts(prevLayouts => ({
      ...prevLayouts,
      [currentBreakpoint]: layout
    }));

    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }, [currentBreakpoint]);

  if (!mounted) return null;

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100}
      margin={[16, 16]}
      containerPadding={[16, 16]}
      onLayoutChange={handleLayoutChange}
      onBreakpointChange={handleBreakpointChange}
      onResizeStop={handleResizeStop}
      useCSSTransforms={true}
      isResizable={true}
      isDraggable={true}
      draggableHandle=".cursor-grab"
      compactType="vertical"
      preventCollision={false}
      resizeHandle={
        <div className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute right-1 bottom-1 w-2 h-2 border-r-2 border-b-2 border-border dark:border-border-dark" />
        </div>
      }
    >
      {charts.map(chart => (
        <div key={chart.id} className="chart-wrapper">
          <DraggableChart
            id={chart.id}
            data={chart.data}
            type={chart.type}
            title={chart.title}
            width={chart.width}
            height={chart.height}
            activeKPIs={activeKPIs}
            kpiColors={kpiColors}
            globalDateRange={globalDateRange}
            className="h-full"
          />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}