"use client"

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
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
  theme?: {
    name: string;
    colors: string[];
  };
}

export function DynamicLayout({ 
  charts, 
  activeKPIs, 
  kpiColors, 
  globalDateRange,
  theme 
}: DynamicLayoutProps) {
  const [layouts, setLayouts] = useState({});
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [mounted, setMounted] = useState(false);
  const initTimeoutRef = useRef<NodeJS.Timeout>();
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  const layoutTimeoutRef = useRef<NodeJS.Timeout>();

  const generateLayout = useCallback(() => {
    const numCharts = charts.length;
    let layout;

    switch (numCharts) {
      case 1:
        layout = [{
          i: charts[0].id,
          x: 0,
          y: 0,
          w: 12,
          h: 12,
          minW: 6,
          maxW: 12,
          minH: 6,
          maxH: 12,
          isDraggable: true,
          isResizable: true
        }];
        break;

      case 2:
        layout = charts.map((chart, i) => ({
          i: chart.id,
          x: 0,
          y: i * 6,
          w: 12,
          h: 6,
          minW: 6,
          maxW: 12,
          minH: 4,
          maxH: 8,
          isDraggable: true,
          isResizable: true
        }));
        break;

      case 3:
        layout = charts.map((chart, i) => ({
          i: chart.id,
          x: 0,
          y: i * 4,
          w: 12,
          h: 4,
          minW: 6,
          maxW: 12,
          minH: 4,
          maxH: 8,
          isDraggable: true,
          isResizable: true
        }));
        break;

      case 4:
        layout = charts.map((chart, i) => ({
          i: chart.id,
          x: (i % 2) * 6,
          y: Math.floor(i / 2) * 6,
          w: 6,
          h: 6,
          minW: 4,
          maxW: 12,
          minH: 4,
          maxH: 8,
          isDraggable: true,
          isResizable: true
        }));
        break;

      case 5:
      case 6:
        layout = charts.map((chart, i) => ({
          i: chart.id,
          x: (i % 2) * 6,
          y: Math.floor(i / 2) * 4,
          w: 6,
          h: 4,
          minW: 4,
          maxW: 12,
          minH: 4,
          maxH: 8,
          isDraggable: true,
          isResizable: true
        }));
        break;

      default:
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

    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    initTimeoutRef.current = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      triggerChartResize();
    }, 100);

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [generateLayout]);

  useEffect(() => {
    const newLayout = generateLayout();
    setLayouts(prev => ({
      ...prev,
      [currentBreakpoint]: newLayout
    }));

    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }

    layoutTimeoutRef.current = setTimeout(() => {
      triggerChartResize();
    }, 100);

    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, [charts.length, generateLayout, currentBreakpoint]);

  const triggerChartResize = () => {
    const chartElements = document.querySelectorAll('.echarts-for-react');
    chartElements.forEach((chart: any) => {
      if (chart && chart.getEchartsInstance) {
        const instance = chart.getEchartsInstance();
        instance?.resize();
      }
    });
  };

  useEffect(() => {
    if (!mounted) return;

    const handleResize = _.debounce(() => {
      triggerChartResize();
    }, 100);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, [mounted]);

  const handleLayoutChange = (layout: Layout[], layouts: any) => {
    setLayouts(layouts);
    
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      triggerChartResize();
    }, 50);
  };

  const handleBreakpointChange = (breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
    setTimeout(triggerChartResize, 100);
  };

  const handleResizeStop = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout) => {
    setLayouts(prevLayouts => ({
      ...prevLayouts,
      [currentBreakpoint]: layout
    }));

    setTimeout(triggerChartResize, 50);
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
            theme={theme}
            className="h-full"
          />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}