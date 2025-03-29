"use client"

import React, { useEffect, useRef, memo, useState, useCallback, useImperativeHandle } from 'react';
import * as echarts from 'echarts';
import { ChartType, DataPoint } from '@/types';
import { ChartToolbar } from './ChartToolbar';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import type { EChartsOption, ECharts } from 'echarts';

interface ChartContainerProps {
  data: DataPoint[];
  type: ChartType;
  title: string;
  activeKPIs: Set<string>;
  kpiColors: Record<string, { color: string; name: string }>;
  dateRange?: DateRange;
  className?: string;
  options?: echarts.EChartsOption;
  theme?: {
    name: string;
    colors: string[];
  };
}

// Add React.forwardRef wrapper and define ref type
const ChartContainer = memo(React.forwardRef<{
  zoomIn: () => void;
  zoomOut: () => void;
  boxSelect: () => void;
  lassoSelect: () => void;
  clearSelection: () => void;
  download: (format: 'png' | 'svg' | 'pdf' | 'csv' | 'json') => void;
}, ChartContainerProps>((props, ref) => {
  const {
    data,
    type,
    title,
    activeKPIs,
    kpiColors,
    dateRange,
    className,
    options: externalOptions,
    theme
  } = props;

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'box' | 'lasso' | null>(null);
  const [mounted, setMounted] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const filteredData = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return data;
    
    return data.filter(item => {
      const itemDate = dayjs(item.date);
      const fromDate = dayjs(dateRange.from);
      const toDate = dayjs(dateRange.to);
      return itemDate.isAfter(fromDate) && itemDate.isBefore(toDate);
    });
  }, [data, dateRange]);

  const initChart = useCallback(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);
    setMounted(true);

    // Set up resize observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver(entries => {
      if (chartInstance.current) {
        requestAnimationFrame(() => {
          chartInstance.current?.resize();
        });
      }
    });

    resizeObserverRef.current.observe(chartRef.current);
  }, []);

  useEffect(() => {
    initChart();

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [initChart]);

  const updateChart = useCallback(() => {
    if (!chartInstance.current) return;

    const categories = Array.from(new Set(filteredData.map(item => item.category)))
      .filter(category => activeKPIs.has(category.toLowerCase()));
    const dates = Array.from(new Set(filteredData.map(item => item.date)));

    const options: echarts.EChartsOption = {
      animation: true,
      animationDuration: 300,
      animationEasing: 'cubicOut',
      
      grid: {
        top: 10,         // Reduced from 25 to minimize space below title
        right: '3%',
        bottom: 35,      // Reduced from 45
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
            const kpiId = param.seriesName.toLowerCase();
            const color = kpiColors[kpiId]?.color || param.color;
            html += `
              <div style="color: ${color}">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${color};  margin-right: 5px;"></span>
                ${param.seriesName}: ${param.value.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}
              </div>`;
          });
          return html;
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
          margin: 8,      // Reduced from 12
          color: '#666',
          fontSize: 10    // Reduced from 11
        },
        axisTick: {
          alignWithLabel: true
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'                        // Lighter axis line
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
          fontSize: 10,   // Reduced from 11
          margin: 4       // Added smaller margin
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'                     // Lighter grid lines
          }
        },
        axisLine: {
          show: false                            // Hide y-axis line for cleaner look
        },
        axisTick: {
          show: false                            // Hide y-axis ticks
        }
      },

      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          show: true,
          type: 'slider',
          bottom: 30,     // Adjusted position to be above parameters
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
            fontSize: '0.7em',  // Make font size relative
            color: '#666',
            margin: 2
          },
          moveHandleStyle: {
            opacity: 0.3
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
        smooth: true,
        symbolSize: 4,    // Reduced from 6
        showSymbol: false,
        emphasis: {
          focus: 'series',
          scale: 1.5      // Reduced from 2
        },
        itemStyle: {
          color: theme?.colors?.[index % theme.colors.length]
        },
        ...(type === 'line' && {
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { 
                offset: 0, 
                color: theme?.colors?.[index % theme.colors.length] + '40' || 
                       kpiColors[category.toLowerCase()]?.color + '40'
              },
              { 
                offset: 1, 
                color: theme?.colors?.[index % theme.colors.length] + '00' || 
                       kpiColors[category.toLowerCase()]?.color + '00'
              }
            ])
          }
        })
      }))
    };

    requestAnimationFrame(() => {
      chartInstance.current?.setOption(options, { notMerge: true });
    });
  }, [filteredData, type, activeKPIs, kpiColors, theme]);

  useEffect(() => {
    if (!mounted || !chartInstance.current) return;
    
    if (externalOptions) {
      chartInstance.current?.setOption(externalOptions, { notMerge: true });
    } else {
      updateChart();
    }
  }, [mounted, updateChart, externalOptions]);

  const handleZoomIn = useCallback(() => {
    if (!chartInstance.current) return;
    const option = chartInstance.current.getOption() as EChartsOption;
    const dataZoom = (option.dataZoom as any)?.[0] as { start: number; end: number };
    if (!dataZoom) return;

    const range = dataZoom.end - dataZoom.start;
    const center = (dataZoom.start + dataZoom.end) / 2;
    const newRange = Math.max(range * 0.5, 10);
    const newStart = Math.max(0, center - newRange / 2);
    const newEnd = Math.min(100, center + newRange / 2);

    requestAnimationFrame(() => {
      chartInstance.current?.dispatchAction({
        type: 'dataZoom',
        start: newStart,
        end: newEnd
      });
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!chartInstance.current) return;
    const option = chartInstance.current.getOption() as EChartsOption;
    const dataZoom = (option.dataZoom as any)?.[0] as { start: number; end: number };
    if (!dataZoom) return;

    const range = dataZoom.end - dataZoom.start;
    const center = (dataZoom.start + dataZoom.end) / 2;
    const newRange = Math.min(range * 2, 100);
    const newStart = Math.max(0, center - newRange / 2);
    const newEnd = Math.min(100, center + newRange / 2);

    requestAnimationFrame(() => {
      chartInstance.current?.dispatchAction({
        type: 'dataZoom',
        start: newStart,
        end: newEnd
      });
    });
  }, []);

  const handleDownload = useCallback((format: 'png' | 'svg' | 'pdf' | 'csv' | 'json') => {
    if (!chartInstance.current) return;

    switch (format) {
      case 'png': {
        const url = chartInstance.current.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff'
        });
        const link = document.createElement('a');
        link.download = `chart-${title}.png`;
        link.href = url;
        link.click();
        break;
      }
      case 'json': {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `chart-${title}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        break;
      }
      // ... implement other formats similarly
    }
  }, [chartInstance, data, title]);

  const handleBoxSelect = useCallback(() => {
    if (!chartInstance.current) return;
    setSelectedTool('box');
    setIsSelecting(true);
    
    requestAnimationFrame(() => {
      if (!chartInstance.current) return;
      
      chartInstance.current.setOption({
        brush: {
          toolbox: ['rect'],
          xAxisIndex: 0,
          brushMode: 'single',
          brushStyle: {
            borderWidth: 1,
            color: 'rgba(120, 140, 180, 0.2)',
            borderColor: 'rgba(120, 140, 180, 0.8)'
          },
          transformable: true,
          throttleType: 'debounce',
          throttleDelay: 300
        }
      }, { replaceMerge: ['brush'] });

      chartInstance.current.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: {
          brushType: 'rect',
          brushMode: 'single'
        }
      });
    });
  }, []);

  const handleLassoSelect = useCallback(() => {
    if (!chartInstance.current) return;
    setSelectedTool('lasso');
    setIsSelecting(true);
    
    requestAnimationFrame(() => {
      if (!chartInstance.current) return;
      
      chartInstance.current.setOption({
        brush: {
          toolbox: ['polygon'],
          xAxisIndex: 0,
          brushMode: 'single',
          brushStyle: {
            borderWidth: 1,
            color: 'rgba(120, 140, 180, 0.2)',
            borderColor: 'rgba(120, 140, 180, 0.8)'
          },
          transformable: true,
          throttleType: 'debounce',
          throttleDelay: 300
        }
      }, { replaceMerge: ['brush'] });

      chartInstance.current.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: {
          brushType: 'polygon',
          brushMode: 'single'
        }
      });
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    if (!chartInstance.current) return;
    setSelectedTool(null);
    setIsSelecting(false);
    
    requestAnimationFrame(() => {
      if (!chartInstance.current) return;
      
      chartInstance.current.setOption({
        brush: undefined
      }, { replaceMerge: ['brush'] });

      chartInstance.current.dispatchAction({
        type: 'brush',
        command: 'clear'
      });
    });
  }, []);

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    boxSelect: handleBoxSelect,
    lassoSelect: handleLassoSelect,
    clearSelection: handleClearSelection,
    download: handleDownload
  }));

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      <div ref={chartRef} className="w-full h-full pt-1" /> {/* Reduced padding-top from 2 to 1 */}
    </div>
  );
}));

// Add display name
ChartContainer.displayName = 'ChartContainer';

// Change to default export
export default ChartContainer;