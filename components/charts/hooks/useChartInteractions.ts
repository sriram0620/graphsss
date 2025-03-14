"use client"

import { useCallback } from 'react';
import type { ECharts } from 'echarts';

// Update interface to match ECharts event parameter types
interface BrushSelectedParams {
  batch: Array<{
    selected: any[];
    [key: string]: any;
  }>;
  type: string;
  areas: any[];
}

interface DataZoomParams {
  type: string;
  batch: Array<{
    start: number;
    end: number;
    [key: string]: any;
  }>;
}

interface UseChartInteractionsProps {
  chartInstance: React.RefObject<ECharts | null>;
  onBrushSelected?: (selected: any[]) => void;
  onDataZoom?: (params: { start: number; end: number }) => void;
}

export const useChartInteractions = ({
  chartInstance,
  onBrushSelected,
  onDataZoom
}: UseChartInteractionsProps) => {
  const setupEventListeners = useCallback(() => {
    if (!chartInstance.current) return;

    // Use type assertion to handle ECharts event parameters
    chartInstance.current.on('brushSelected', ((params: unknown) => {
      const brushParams = params as BrushSelectedParams;
      const brushComponent = brushParams.batch[0];
      if (brushComponent?.selected?.length > 0) {
        onBrushSelected?.(brushComponent.selected);
      }
    }) as any);

    chartInstance.current.on('datazoom', ((params: unknown) => {
      const zoomParams = params as DataZoomParams;
      if (zoomParams.batch?.[0]) {
        const { start, end } = zoomParams.batch[0];
        onDataZoom?.({ start, end });
      }
    }) as any);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.off('brushSelected');
        chartInstance.current.off('datazoom');
      }
    };
  }, [chartInstance, onBrushSelected, onDataZoom]);

  return { setupEventListeners };
};