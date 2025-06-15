"use client"

import React, { useEffect, useRef, memo, useState, useCallback, useImperativeHandle } from 'react';
import * as echarts from 'echarts';
import { ChartType, DataPoint } from '@/types';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import type { EChartsOption, ECharts } from 'echarts';
import { useChart } from '@/contexts/chart-context';

interface OptimizedChartContainerProps {
  chartId: string;
  data: DataPoint[];
  type: ChartType;
  title: string;
  activeKPIs: Set<string>;
  kpiColors: Record<string, { color: string; name: string }>;
  dateRange?: DateRange;
  className?: string;
  theme?: {
    name: string;
    colors: string[];
  };
  onInteraction?: (type: string, data: any) => void;
}

export interface ChartRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  exportChart: (format: 'png' | 'svg' | 'pdf') => void;
  getChartInstance: () => ECharts | null;
}

const OptimizedChartContainer = memo(React.forwardRef<ChartRef, OptimizedChartContainerProps>((props, ref) => {
  const {
    chartId,
    data,
    type,
    title,
    activeKPIs,
    kpiColors,
    dateRange,
    className,
    theme,
    onInteraction
  } = props;

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);
  const [mounted, setMounted] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { state } = useChart();

  // Memoized filtered data
  const filteredData = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return data;
    
    return data.filter(item => {
      const itemDate = dayjs(item.date);
      const fromDate = dayjs(dateRange.from);
      const toDate = dayjs(dateRange.to);
      return itemDate.isAfter(fromDate) && itemDate.isBefore(toDate);
    });
  }, [data, dateRange]);

  // Memoized chart options
  const chartOptions = React.useMemo((): EChartsOption => {
    const categories = Array.from(new Set(filteredData.map(item => item.category)))
      .filter(category => activeKPIs.has(category));
    const dates = Array.from(new Set(filteredData.map(item => item.date))).sort();

    if (categories.length === 0 || dates.length === 0) {
      return {};
    }

    return {
      animation: true,
      animationDuration: 300,
      animationEasing: 'cubicOut',
      
      grid: {
        top: 10,
        right: '3%',
        bottom: 35,
        left: '3%',
        containLabel: true
      },

      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: (params: any) => {
          const date = params[0].axisValue;
          let html = `<div style="font-weight: bold">${dayjs(date).format('MMM D, YYYY HH:mm')}</div>`;
          params.forEach((param: any) => {
            const kpiId = param.seriesName;
            const color = kpiColors[kpiId]?.color || param.color;
            html += `
              <div style="color: ${color}">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; margin-right: 5px;"></span>
                ${param.seriesName}: ${param.value.toLocaleString()}
              </div>`;
          });
          return html;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        textStyle: {
          fontSize: 12
        }
      },

      xAxis: {
        type: 'category',
        boundaryGap: type === 'bar',
        data: dates,
        axisLabel: {
          formatter: (value: string) => dayjs(value).format('HH:mm'),
          interval: Math.ceil(dates.length / 8),
          rotate: 0,
          margin: 8,
          color: '#666',
          fontSize: 10
        },
        axisTick: {
          alignWithLabel: true
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        }
      },

      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => 
            value >= 1000000 
              ? `${(value / 1000000).toFixed(1)}M` 
              : value >= 1000 
                ? `${(value / 1000).toFixed(0)}K` 
                : value.toString(),
          color: '#666',
          fontSize: 10,
          margin: 4
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        }
      },

      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          throttle: 50
        },
        {
          show: true,
          type: 'slider',
          bottom: 5,
          height: 12,
          borderColor: 'transparent',
          backgroundColor: 'rgba(200,200,200,0.15)',
          fillerColor: 'rgba(144,197,237,0.1)',
          handleStyle: {
            color: '#fff',
            shadowBlur: 2,
            shadowColor: 'rgba(0,0,0,0.2)',
            shadowOffsetX: 0,
            shadowOffsetY: 1
          },
          textStyle: {
            fontSize: 10,
            color: '#666'
          }
        }
      ],

      series: categories.map((category, index) => ({
        name: category,
        type,
        data: dates.map(date => {
          const point = filteredData.find(item => 
            item.date === date && item.category === category
          );
          return point ? point.value : null;
        }),
        smooth: type === 'line',
        symbolSize: 4,
        showSymbol: false,
        emphasis: {
          focus: 'series',
          scale: 1.2
        },
        itemStyle: {
          color: theme?.colors?.[index % theme.colors.length] || kpiColors[category]?.color
        },
        lineStyle: type === 'line' ? {
          width: 2
        } : undefined,
        ...(type === 'line' && {
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { 
                offset: 0, 
                color: (theme?.colors?.[index % theme.colors.length] || kpiColors[category]?.color) + '40'
              },
              { 
                offset: 1, 
                color: (theme?.colors?.[index % theme.colors.length] || kpiColors[category]?.color) + '00'
              }
            ])
          }
        })
      }))
    };
  }, [filteredData, type, activeKPIs, kpiColors, theme]);

  // Initialize chart
  const initChart = useCallback(() => {
    if (!chartRef.current || chartInstance.current) return;

    chartInstance.current = echarts.init(chartRef.current, undefined, {
      renderer: 'canvas',
      useDirtyRect: true,
      devicePixelRatio: window.devicePixelRatio
    });

    // Add interaction listeners
    chartInstance.current.on('click', (params) => {
      onInteraction?.('click', params);
    });

    chartInstance.current.on('datazoom', (params) => {
      onInteraction?.('zoom', params);
    });

    setMounted(true);

    // Set up resize observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        if (chartInstance.current && chartRef.current) {
          chartInstance.current.resize();
        }
      });
    });

    if (chartRef.current) {
      resizeObserverRef.current.observe(chartRef.current);
    }
  }, [onInteraction]);

  // Update chart options
  const updateChart = useCallback(() => {
    if (!chartInstance.current || !mounted) return;

    if (Object.keys(chartOptions).length === 0) {
      chartInstance.current.clear();
      return;
    }

    requestAnimationFrame(() => {
      if (chartInstance.current) {
        chartInstance.current.setOption(chartOptions, { 
          notMerge: true,
          lazyUpdate: true
        });
      }
    });
  }, [chartOptions, mounted]);

  // Chart control methods
  const zoomIn = useCallback(() => {
    if (!chartInstance.current) return;
    const option = chartInstance.current.getOption() as EChartsOption;
    const dataZoom = (option.dataZoom as any)?.[0];
    if (!dataZoom) return;

    const range = dataZoom.end - dataZoom.start;
    const center = (dataZoom.start + dataZoom.end) / 2;
    const newRange = Math.max(range * 0.5, 10);
    const newStart = Math.max(0, center - newRange / 2);
    const newEnd = Math.min(100, center + newRange / 2);

    chartInstance.current.dispatchAction({
      type: 'dataZoom',
      start: newStart,
      end: newEnd
    });
  }, []);

  const zoomOut = useCallback(() => {
    if (!chartInstance.current) return;
    const option = chartInstance.current.getOption() as EChartsOption;
    const dataZoom = (option.dataZoom as any)?.[0];
    if (!dataZoom) return;

    const range = dataZoom.end - dataZoom.start;
    const center = (dataZoom.start + dataZoom.end) / 2;
    const newRange = Math.min(range * 2, 100);
    const newStart = Math.max(0, center - newRange / 2);
    const newEnd = Math.min(100, center + newRange / 2);

    chartInstance.current.dispatchAction({
      type: 'dataZoom',
      start: newStart,
      end: newEnd
    });
  }, []);

  const resetZoom = useCallback(() => {
    if (!chartInstance.current) return;
    chartInstance.current.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: 100
    });
  }, []);

  const exportChart = useCallback((format: 'png' | 'svg' | 'pdf') => {
    if (!chartInstance.current) return;

    const url = chartInstance.current.getDataURL({
      type: format === 'pdf' ? 'png' : format,
      pixelRatio: 2,
      backgroundColor: '#fff'
    });

    const link = document.createElement('a');
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
    link.href = url;
    link.click();
  }, [title]);

  const getChartInstance = useCallback(() => {
    return chartInstance.current;
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut,
    resetZoom,
    exportChart,
    getChartInstance
  }));

  // Effects
  useEffect(() => {
    initChart();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [initChart]);

  useEffect(() => {
    updateChart();
  }, [updateChart]);

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      <div ref={chartRef} className="w-full h-full" />
      {!mounted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}));

OptimizedChartContainer.displayName = 'OptimizedChartContainer';

export default OptimizedChartContainer;