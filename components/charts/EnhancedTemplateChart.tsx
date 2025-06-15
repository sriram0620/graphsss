"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, BarChart2, LineChart, RefreshCw, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KPIInfo } from '@/lib/api';
import OptimizedChartContainer, { ChartRef } from './OptimizedChartContainer';
import { DataPoint } from '@/types';
import { DateRange } from 'react-day-picker';
import { useChart } from '@/contexts/chart-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnhancedTemplateChartProps {
  graphId: string;
  graphName: string;
  primaryKpiId: string;
  secondaryKpis: Array<{ kpi_id: string }>;
  graphType: 'line' | 'bar';
  kpiInfo: KPIInfo[];
  dateRange?: DateRange;
  className?: string;
  theme?: {
    name: string;
    colors: string[];
  };
}

export const EnhancedTemplateChart: React.FC<EnhancedTemplateChartProps> = ({
  graphId,
  graphName,
  primaryKpiId,
  secondaryKpis,
  graphType,
  kpiInfo,
  dateRange,
  className,
  theme
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localChartType, setLocalChartType] = useState(graphType);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const chartRef = useRef<ChartRef>(null);
  
  const {
    fetchChartData,
    getChartData,
    isLoading,
    getError,
    clearChart,
    updateGlobalSettings
  } = useChart();

  // Get all KPI IDs
  const allKpiIds = useMemo(() => {
    return [primaryKpiId, ...secondaryKpis.map(kpi => kpi.kpi_id)];
  }, [primaryKpiId, secondaryKpis]);

  // Get active KPIs set
  const activeKPIs = useMemo(() => {
    return new Set(allKpiIds);
  }, [allKpiIds]);

  // Generate KPI colors
  const kpiColors = useMemo(() => {
    const colors: Record<string, { color: string; name: string }> = {};
    const defaultColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
    
    allKpiIds.forEach((kpiId, index) => {
      colors[kpiId] = {
        color: theme?.colors?.[index % theme.colors.length] || defaultColors[index % defaultColors.length],
        name: kpiId.replace(/_/g, ' ').toUpperCase()
      };
    });
    
    return colors;
  }, [allKpiIds, theme]);

  // Get chart data from context
  const chartData = getChartData(graphId);
  const loading = isLoading(graphId);
  const error = getError(graphId);

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    if (allKpiIds.length > 0) {
      fetchChartData(graphId, allKpiIds, kpiInfo, dateRange);
    }

    return () => {
      // Cleanup when component unmounts
      clearChart(graphId);
    };
  }, [graphId, allKpiIds, kpiInfo, dateRange, fetchChartData, clearChart]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchChartData(graphId, allKpiIds, kpiInfo, dateRange);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Minimum refresh animation time
    }
  }, [graphId, allKpiIds, kpiInfo, dateRange, fetchChartData, isRefreshing]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle chart type toggle
  const toggleChartType = useCallback(() => {
    setLocalChartType(prev => prev === 'line' ? 'bar' : 'line');
  }, []);

  // Handle chart interactions
  const handleChartInteraction = useCallback((type: string, data: any) => {
    console.log(`Chart interaction: ${type}`, data);
    // You can add custom interaction handling here
  }, []);

  // Handle export
  const handleExport = useCallback((format: 'png' | 'svg' | 'pdf') => {
    chartRef.current?.exportChart(format);
  }, []);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    chartRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    chartRef.current?.zoomOut();
  }, []);

  const handleResetZoom = useCallback(() => {
    chartRef.current?.resetZoom();
  }, []);

  if (loading && !chartData) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading {graphName}...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading chart</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-40"
            onClick={toggleFullscreen}
          />
        )}
      </AnimatePresence>

      <motion.div
        className={`relative ${isFullscreen ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Card className={`h-full overflow-hidden bg-card/90 backdrop-blur-sm border-border/40 shadow-xl ${isFullscreen ? 'z-50' : ''}`}>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-card/95 backdrop-blur-sm border-b border-border/40 px-3 flex items-center justify-between z-30">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground/90 truncate">{graphName}</h3>
              {(loading || isRefreshing) && (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {/* Zoom Controls */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="h-3 w-3 text-muted-foreground" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="h-3 w-3 text-muted-foreground" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleResetZoom}
                title="Reset Zoom"
              >
                <RotateCcw className="h-3 w-3 text-muted-foreground" />
              </Button>

              {/* Chart Type Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleChartType}
                title="Toggle Chart Type"
              >
                {localChartType === 'line' ? (
                  <BarChart2 className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <LineChart className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>

              {/* Refresh */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh Data"
              >
                <RefreshCw className={`h-3 w-3 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>

              {/* Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Export Chart"
                  >
                    <Download className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('png')}>
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('svg')}>
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleFullscreen}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Maximize2 className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Chart Content */}
          <div className="h-full pt-10 pb-12">
            {chartData && chartData.data.length > 0 ? (
              <OptimizedChartContainer
                ref={chartRef}
                chartId={graphId}
                data={chartData.data}
                type={localChartType}
                title={graphName}
                activeKPIs={activeKPIs}
                kpiColors={kpiColors}
                dateRange={dateRange}
                theme={theme}
                className="h-full"
                onInteraction={handleChartInteraction}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">No data available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    KPIs: {allKpiIds.join(', ')}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="mt-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* KPI Parameters Footer */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 px-3 py-2 bg-card/95 backdrop-blur-sm border-t border-border/40">
            {allKpiIds.map((kpiId) => {
              const kpiGroup = kpiInfo.find(kpi => kpi.kpi_name === kpiId)?.kpi_group || 'unknown';
              return (
                <div
                  key={kpiId}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent/70 text-accent-foreground text-xs"
                  style={{ color: kpiColors[kpiId]?.color }}
                  title={`Group: ${kpiGroup.toUpperCase()}`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: kpiColors[kpiId]?.color }}
                  />
                  <span className="font-medium whitespace-nowrap">
                    {kpiId.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-[10px] opacity-60">
                    ({kpiGroup.toUpperCase()})
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </>
  );
};

export default EnhancedTemplateChart;