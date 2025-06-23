"use client"

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, BarChart2, LineChart, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { KPIInfo } from '@/lib/api';
import ChartContainer from './ChartContainer';
import { DateRange } from 'react-day-picker';
import { useKPIData } from '@/hooks/useKPIData';
import { useAppSelector } from '@/store/hooks';
import { selectAutoRefresh } from '@/store/selectors';

interface ReduxTemplateChartProps {
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

export const ReduxTemplateChart: React.FC<ReduxTemplateChartProps> = ({
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
  
  // Get auto-refresh setting from Redux
  const autoRefresh = useAppSelector(selectAutoRefresh);

  // Get all KPI IDs (primary + secondary) - handle undefined secondaryKpis
  const allKpiIds = useMemo(() => {
    return [primaryKpiId, ...(secondaryKpis || []).map(kpi => kpi.kpi_id)]; // Added null check with fallback to empty array
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

  // Use KPI data hook
  const { data, loading, error, refresh } = useKPIData({
    chartId: graphId,
    kpiIds: allKpiIds,
    kpiInfo,
    dateRange,
    autoRefresh,
    refreshInterval: 30000
  });

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRefresh = () => {
    refresh();
  };

  if (loading && data.length === 0) {
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
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        className={`relative ${isFullscreen ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}
        layout
        transition={{ duration: 0.3 }}
      >
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-40"
            onClick={toggleFullscreen}
          />
        )}

        <Card className={`h-full overflow-hidden bg-card/90 backdrop-blur-sm border-border/40 shadow-xl ${isFullscreen ? 'z-50' : ''}`}>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-card/95 backdrop-blur-sm border-b border-border/40 px-3 flex items-center justify-between z-30">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground/90 truncate">{graphName}</h3>
              {loading && (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setLocalChartType(prev => prev === 'line' ? 'bar' : 'line')}
                title="Toggle Chart Type"
              >
                {localChartType === 'line' ? (
                  <BarChart2 className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <LineChart className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh Data"
              >
                <RefreshCw className={`h-3 w-3 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
              </Button>

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
            {data.length > 0 ? (
              <ChartContainer
                data={data}
                type={localChartType}
                title={graphName}
                activeKPIs={activeKPIs}
                kpiColors={kpiColors}
                dateRange={dateRange}
                theme={theme}
                className="h-full"
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

export default ReduxTemplateChart;