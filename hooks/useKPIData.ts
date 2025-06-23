"use client"

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchKPIData, clearKPIData, invalidateCache } from '@/store/slices/kpiDataSlice';
import { selectChartData, selectChartLoading, selectChartError } from '@/store/selectors';
import { KPIInfo } from '@/lib/api';
import { DateRange } from 'react-day-picker';

interface UseKPIDataParams {
  chartId: string;
  kpiIds: string[];
  kpiInfo: KPIInfo[];
  dateRange?: DateRange;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useKPIData({
  chartId,
  kpiIds,
  kpiInfo,
  dateRange,
  autoRefresh = false,
  refreshInterval = 30000
}: UseKPIDataParams) {
  const dispatch = useAppDispatch();
  
  // Selectors
  const data = useAppSelector(state => selectChartData(state, chartId));
  const loading = useAppSelector(state => selectChartLoading(state, chartId));
  const error = useAppSelector(state => selectChartError(state, chartId));

  // Fetch data function
  const fetchData = useCallback(() => {
    if (kpiIds.length === 0 || kpiInfo.length === 0) return;

    const defaultDateRange = {
      from: new Date(new Date().setDate(new Date().getDate() - 7)),
      to: new Date()
    };

    dispatch(fetchKPIData({
      chartId,
      kpiIds,
      kpiInfo,
      dateRange: dateRange || defaultDateRange
    }));
  }, [dispatch, chartId, kpiIds, kpiInfo, dateRange]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearKPIData(chartId));
    };
  }, [dispatch, chartId]);

  const refresh = useCallback(() => {
    // Invalidate cache for this chart's KPIs
    kpiIds.forEach(kpiId => {
      dispatch(invalidateCache(kpiId));
    });
    fetchData();
  }, [dispatch, kpiIds, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    fetchData
  };
}