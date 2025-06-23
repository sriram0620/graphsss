"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Calendar, BarChart2, LineChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { ApiService, KPIData, KPIInfo } from '@/lib/api';
import ChartContainer from './ChartContainer';
import { DataPoint } from '@/types';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';

interface TemplateChartProps {
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

export const TemplateChart: React.FC<TemplateChartProps> = ({
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
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localChartType, setLocalChartType] = useState(graphType);

  // Get all KPI IDs (primary + secondary)
  const allKpiIds = useMemo(() => {
    return [primaryKpiId, ...secondaryKpis.map(kpi => kpi.kpi_id)];
  }, [primaryKpiId, secondaryKpis]);

  // Get active KPIs set
  const activeKPIs = useMemo(() => {
    return new Set(allKpiIds);
  }, [allKpiIds]);

  // Generate KPI colors
  const kpiColors = useMemo(() => {
    const colors: Record<string, { color: string; name: string; icon: any }> = {};
    const defaultColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
    
    allKpiIds.forEach((kpiId, index) => {
      colors[kpiId] = {
        color: theme?.colors?.[index % theme.colors.length] || defaultColors[index % defaultColors.length],
        name: kpiId.replace(/_/g, ' ').toUpperCase(),
        icon: BarChart2
      };
    });
    
    return colors;
  }, [allKpiIds, theme]);

  // Fetch KPI data
  useEffect(() => {
    const fetchKPIData = async () => {
      if (allKpiIds.length === 0) return;

      try {
        setLoading(true);
        setError(null);

        // Calculate date range
        const endDate = dateRange?.to || new Date();
        const startDate = dateRange?.from || subDays(endDate, 7);
        
        const fromStr = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
        const toStr = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");

        // Fetch data for all KPIs
        const kpiDataPromises = allKpiIds.map(async (kpiId) => {
          const kpiGroup = ApiService.getKPIGroup(kpiId, kpiInfo);
          const data = await ApiService.fetchKPIData(kpiId, kpiGroup, fromStr, toStr);
          
          return data.map((item: KPIData): DataPoint => ({
            date: item.timestamp,
            category: kpiId,
            value: item.kpi_value || item.job_count || 0
          }));
        });

        const allKpiData = await Promise.all(kpiDataPromises);
        const combinedData = allKpiData.flat();
        
        setChartData(combinedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch KPI data');
        console.error('Error fetching KPI data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIData();
  }, [allKpiIds, kpiInfo, dateRange]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading chart</p>
          <p className="text-sm text-muted-foreground">{error}</p>
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
          <div className="absolute top-0 left-0 right-0 h-8 bg-card/95 backdrop-blur-sm border-b border-border/40 px-2 flex items-center justify-between z-30">
            <h3 className="text-xs font-medium text-foreground/90 truncate">{graphName}</h3>
            
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setLocalChartType(prev => prev === 'line' ? 'bar' : 'line')}
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
                className="h-6 w-6"
                onClick={toggleFullscreen}
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
          <div className="h-full pt-8 pb-12">
            <ChartContainer
              data={chartData}
              type={localChartType}
              title={graphName}
              activeKPIs={activeKPIs}
              kpiColors={kpiColors}
              dateRange={dateRange}
              theme={theme}
              className="h-full"
            />
          </div>

          {/* KPI Parameters Footer */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 px-3 py-2 bg-card/95 backdrop-blur-sm border-t border-border/40">
            {allKpiIds.map((kpiId) => (
              <div
                key={kpiId}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent/70 text-accent-foreground text-xs"
                style={{ color: kpiColors[kpiId]?.color }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: kpiColors[kpiId]?.color }}
                />
                <span className="font-medium whitespace-nowrap">
                  {kpiId.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </>
  );
};

export default TemplateChart;