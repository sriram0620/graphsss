"use client"

import React, { useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { TemplateChart } from './TemplateChart';
import { TemplateDetail, KPIInfo } from '@/lib/api';
import { DateRange } from 'react-day-picker';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface TemplateDynamicLayoutProps {
  templateDetail: TemplateDetail;
  kpiInfo: KPIInfo[];
  dateRange?: DateRange;
  theme?: {
    name: string;
    colors: string[];
  };
}

export function TemplateDynamicLayout({ 
  templateDetail, 
  kpiInfo, 
  dateRange,
  theme 
}: TemplateDynamicLayoutProps) {
  const layouts = useMemo(() => {
    const numGraphs = templateDetail.graphs.length;
    
    const getChartSize = (total: number) => {
      switch (total) {
        case 1: return { w: 12, h: 8 };
        case 2: return { w: 6, h: 8 };
        case 3: return { w: 4, h: 6 };
        case 4: return { w: 6, h: 6 };
        case 6: return { w: 4, h: 6 };
        case 9: return { w: 4, h: 4 };
        default: return { w: 4, h: 5 };
      }
    };

    const size = getChartSize(numGraphs);
    
    const layout = templateDetail.graphs.map((graph, i) => {
      const row = Math.floor(i / Math.ceil(12 / size.w));
      const col = (i * size.w) % 12;
      
      return {
        i: graph.graph_id,
        x: col,
        y: row * size.h,
        w: size.w,
        h: size.h,
        minW: 3,
        maxW: 12,
        minH: 3,
        maxH: 12,
        isDraggable: true,
        isResizable: true
      };
    });

    return {
      lg: layout,
      md: layout.map(item => ({ ...item, w: Math.min(12, item.w * 2) })),
      sm: layout.map(item => ({ ...item, w: 12, x: 0 })),
      xs: layout.map(item => ({ ...item, w: 12, x: 0 })),
      xxs: layout.map(item => ({ ...item, w: 12, x: 0 }))
    };
  }, [templateDetail.graphs]);

  return (
    <div className="relative w-full h-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
        rowHeight={60}
        margin={[12, 12]}
        containerPadding={[12, 12]}
        useCSSTransforms={true}
        isResizable={true}
        isDraggable={true}
        compactType="vertical"
        preventCollision={false}
      >
        {templateDetail.graphs.map(graph => (
          <div 
            key={graph.graph_id} 
            className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
          >
            <TemplateChart
              graphId={graph.graph_id}
              graphName={graph.graph_name}
              primaryKpiId={graph.primary_kpi_id}
              secondaryKpis={graph.secondary_kpis}
              graphType={graph.graph_type}
              kpiInfo={kpiInfo}
              dateRange={dateRange}
              theme={theme}
              className="h-full"
            />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}