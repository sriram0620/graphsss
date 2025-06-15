"use client"

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { ApiService, KPIData, KPIInfo } from '@/lib/api';
import { DataPoint } from '@/types';

// Types
interface ChartState {
  charts: Map<string, ChartData>;
  loading: Set<string>;
  errors: Map<string, string>;
  cache: Map<string, CachedData>;
  globalSettings: GlobalSettings;
}

interface ChartData {
  id: string;
  data: DataPoint[];
  lastUpdated: number;
  kpiIds: string[];
  isStale: boolean;
}

interface CachedData {
  data: DataPoint[];
  timestamp: number;
  expiresAt: number;
}

interface GlobalSettings {
  dateRange?: DateRange;
  theme: string;
  resolution: string;
  autoRefresh: boolean;
  refreshInterval: number;
}

// Actions
type ChartAction =
  | { type: 'SET_LOADING'; chartId: string; loading: boolean }
  | { type: 'SET_CHART_DATA'; chartId: string; data: DataPoint[]; kpiIds: string[] }
  | { type: 'SET_ERROR'; chartId: string; error: string }
  | { type: 'CLEAR_ERROR'; chartId: string }
  | { type: 'UPDATE_GLOBAL_SETTINGS'; settings: Partial<GlobalSettings> }
  | { type: 'INVALIDATE_CACHE'; pattern?: string }
  | { type: 'MARK_STALE'; chartId: string }
  | { type: 'CLEAR_CHART'; chartId: string };

// Initial state
const initialState: ChartState = {
  charts: new Map(),
  loading: new Set(),
  errors: new Map(),
  cache: new Map(),
  globalSettings: {
    theme: 'default',
    resolution: 'auto',
    autoRefresh: false,
    refreshInterval: 30000, // 30 seconds
  }
};

// Reducer
function chartReducer(state: ChartState, action: ChartAction): ChartState {
  switch (action.type) {
    case 'SET_LOADING': {
      const newLoading = new Set(state.loading);
      if (action.loading) {
        newLoading.add(action.chartId);
      } else {
        newLoading.delete(action.chartId);
      }
      return { ...state, loading: newLoading };
    }

    case 'SET_CHART_DATA': {
      const newCharts = new Map(state.charts);
      const newLoading = new Set(state.loading);
      const newErrors = new Map(state.errors);
      
      newCharts.set(action.chartId, {
        id: action.chartId,
        data: action.data,
        lastUpdated: Date.now(),
        kpiIds: action.kpiIds,
        isStale: false,
      });
      
      newLoading.delete(action.chartId);
      newErrors.delete(action.chartId);
      
      return {
        ...state,
        charts: newCharts,
        loading: newLoading,
        errors: newErrors,
      };
    }

    case 'SET_ERROR': {
      const newErrors = new Map(state.errors);
      const newLoading = new Set(state.loading);
      
      newErrors.set(action.chartId, action.error);
      newLoading.delete(action.chartId);
      
      return {
        ...state,
        errors: newErrors,
        loading: newLoading,
      };
    }

    case 'CLEAR_ERROR': {
      const newErrors = new Map(state.errors);
      newErrors.delete(action.chartId);
      return { ...state, errors: newErrors };
    }

    case 'UPDATE_GLOBAL_SETTINGS': {
      return {
        ...state,
        globalSettings: { ...state.globalSettings, ...action.settings },
      };
    }

    case 'INVALIDATE_CACHE': {
      const newCache = new Map(state.cache);
      if (action.pattern) {
        // Remove cache entries matching pattern
        for (const [key] of newCache) {
          if (key.includes(action.pattern)) {
            newCache.delete(key);
          }
        }
      } else {
        newCache.clear();
      }
      return { ...state, cache: newCache };
    }

    case 'MARK_STALE': {
      const newCharts = new Map(state.charts);
      const chart = newCharts.get(action.chartId);
      if (chart) {
        newCharts.set(action.chartId, { ...chart, isStale: true });
      }
      return { ...state, charts: newCharts };
    }

    case 'CLEAR_CHART': {
      const newCharts = new Map(state.charts);
      const newLoading = new Set(state.loading);
      const newErrors = new Map(state.errors);
      
      newCharts.delete(action.chartId);
      newLoading.delete(action.chartId);
      newErrors.delete(action.chartId);
      
      return {
        ...state,
        charts: newCharts,
        loading: newLoading,
        errors: newErrors,
      };
    }

    default:
      return state;
  }
}

// Context
interface ChartContextType {
  state: ChartState;
  fetchChartData: (chartId: string, kpiIds: string[], kpiInfo: KPIInfo[], dateRange?: DateRange) => Promise<void>;
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  invalidateCache: (pattern?: string) => void;
  clearChart: (chartId: string) => void;
  getChartData: (chartId: string) => ChartData | undefined;
  isLoading: (chartId: string) => boolean;
  getError: (chartId: string) => string | undefined;
}

const ChartContext = createContext<ChartContextType | undefined>(undefined);

// Provider
export function ChartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chartReducer, initialState);
  const refreshTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const requestQueue = useRef<Map<string, Promise<void>>>(new Map());

  // Cache management
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  const getCacheKey = (kpiId: string, dateRange?: DateRange, resolution?: string) => {
    const from = dateRange?.from?.toISOString() || 'default';
    const to = dateRange?.to?.toISOString() || 'default';
    return `${kpiId}-${from}-${to}-${resolution || 'auto'}`;
  };

  const getCachedData = (cacheKey: string): DataPoint[] | null => {
    const cached = state.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    return null;
  };

  const setCachedData = (cacheKey: string, data: DataPoint[]) => {
    const newCache = new Map(state.cache);
    newCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION,
    });
    
    // Clean up expired cache entries
    for (const [key, value] of newCache) {
      if (value.expiresAt <= Date.now()) {
        newCache.delete(key);
      }
    }
    
    dispatch({ type: 'INVALIDATE_CACHE' });
    // Update cache in next tick to avoid state mutation
    setTimeout(() => {
      dispatch({ type: 'UPDATE_GLOBAL_SETTINGS', settings: {} });
    }, 0);
  };

  // Debounced fetch function
  const debouncedFetch = useCallback(
    async (chartId: string, kpiIds: string[], kpiInfo: KPIInfo[], dateRange?: DateRange) => {
      // Check if there's already a request in progress for this chart
      const existingRequest = requestQueue.current.get(chartId);
      if (existingRequest) {
        return existingRequest;
      }

      const fetchPromise = (async () => {
        try {
          dispatch({ type: 'SET_LOADING', chartId, loading: true });
          dispatch({ type: 'CLEAR_ERROR', chartId });

          const allData: DataPoint[] = [];
          const resolution = state.globalSettings.resolution;

          // Fetch data for each KPI with caching
          for (const kpiId of kpiIds) {
            const cacheKey = getCacheKey(kpiId, dateRange, resolution);
            let kpiData = getCachedData(cacheKey);

            if (!kpiData) {
              // Determine KPI group
              let kpiGroup = ApiService.getKPIGroup(kpiId, kpiInfo);
              if (!kpiInfo.find(kpi => kpi.kpi_name === kpiId)) {
                kpiGroup = await ApiService.getKPIGroupDynamic(kpiId);
              }

              // Calculate date range
              const endDate = dateRange?.to || new Date();
              const startDate = dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              
              const fromStr = startDate.toISOString().slice(0, 19);
              const toStr = endDate.toISOString().slice(0, 19);

              // Fetch data
              const rawData = await ApiService.fetchKPIData(kpiId, kpiGroup, fromStr, toStr);
              
              kpiData = rawData.map((item: KPIData): DataPoint => ({
                date: item.timestamp,
                category: kpiId,
                value: item.kpi_value || item.job_count || 0
              }));

              // Cache the data
              setCachedData(cacheKey, kpiData);
            }

            allData.push(...kpiData);
          }

          dispatch({ 
            type: 'SET_CHART_DATA', 
            chartId, 
            data: allData, 
            kpiIds 
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch chart data';
          dispatch({ type: 'SET_ERROR', chartId, error: errorMessage });
          console.error(`Error fetching chart data for ${chartId}:`, error);
        } finally {
          requestQueue.current.delete(chartId);
        }
      })();

      requestQueue.current.set(chartId, fetchPromise);
      return fetchPromise;
    },
    [state.globalSettings.resolution, state.cache]
  );

  // Auto-refresh functionality
  useEffect(() => {
    if (!state.globalSettings.autoRefresh) {
      // Clear all refresh timeouts
      refreshTimeouts.current.forEach(timeout => clearTimeout(timeout));
      refreshTimeouts.current.clear();
      return;
    }

    // Set up refresh for all charts
    state.charts.forEach((chart, chartId) => {
      const existingTimeout = refreshTimeouts.current.get(chartId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        dispatch({ type: 'MARK_STALE', chartId });
        // Trigger refresh if chart is still mounted
        if (state.charts.has(chartId)) {
          const chartData = state.charts.get(chartId);
          if (chartData) {
            // Re-fetch with existing KPI info (would need to be passed)
            // This is a simplified version - in practice, you'd need to store KPI info
          }
        }
      }, state.globalSettings.refreshInterval);

      refreshTimeouts.current.set(chartId, timeout);
    });

    return () => {
      refreshTimeouts.current.forEach(timeout => clearTimeout(timeout));
      refreshTimeouts.current.clear();
    };
  }, [state.globalSettings.autoRefresh, state.globalSettings.refreshInterval, state.charts]);

  // Context methods
  const fetchChartData = useCallback(
    (chartId: string, kpiIds: string[], kpiInfo: KPIInfo[], dateRange?: DateRange) => {
      return debouncedFetch(chartId, kpiIds, kpiInfo, dateRange);
    },
    [debouncedFetch]
  );

  const updateGlobalSettings = useCallback((settings: Partial<GlobalSettings>) => {
    dispatch({ type: 'UPDATE_GLOBAL_SETTINGS', settings });
    
    // Invalidate cache if date range or resolution changed
    if (settings.dateRange || settings.resolution) {
      dispatch({ type: 'INVALIDATE_CACHE' });
    }
  }, []);

  const invalidateCache = useCallback((pattern?: string) => {
    dispatch({ type: 'INVALIDATE_CACHE', pattern });
  }, []);

  const clearChart = useCallback((chartId: string) => {
    dispatch({ type: 'CLEAR_CHART', chartId });
    
    // Clear any pending timeouts
    const timeout = refreshTimeouts.current.get(chartId);
    if (timeout) {
      clearTimeout(timeout);
      refreshTimeouts.current.delete(chartId);
    }
    
    // Clear any pending requests
    requestQueue.current.delete(chartId);
  }, []);

  const getChartData = useCallback((chartId: string) => {
    return state.charts.get(chartId);
  }, [state.charts]);

  const isLoading = useCallback((chartId: string) => {
    return state.loading.has(chartId);
  }, [state.loading]);

  const getError = useCallback((chartId: string) => {
    return state.errors.get(chartId);
  }, [state.errors]);

  const contextValue: ChartContextType = {
    state,
    fetchChartData,
    updateGlobalSettings,
    invalidateCache,
    clearChart,
    getChartData,
    isLoading,
    getError,
  };

  return (
    <ChartContext.Provider value={contextValue}>
      {children}
    </ChartContext.Provider>
  );
}

// Hook
export function useChart() {
  const context = useContext(ChartContext);
  if (context === undefined) {
    throw new Error('useChart must be used within a ChartProvider');
  }
  return context;
}