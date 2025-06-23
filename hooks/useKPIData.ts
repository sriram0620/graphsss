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

    // Validate and provide default date range
    let validDateRange = dateRange;
    if (!validDateRange?.from || !validDateRange?.to) {
      validDateRange = {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date()
      };
    }

    // Ensure dates are valid Date objects
    const fromDate = validDateRange.from instanceof Date ? validDateRange.from : new Date(validDateRange.from);
    const toDate = validDateRange.to instanceof Date ? validDateRange.to : new Date(validDateRange.to);

    // Validate that dates are not invalid
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      console.error('Invalid date range provided to useKPIData');
      return;
    }

    dispatch(fetchKPIData({
      chartId,
      kpiIds,
      kpiInfo,
      dateRange: {
        from: fromDate,
        to: toDate
      }
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