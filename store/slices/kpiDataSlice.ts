import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiService, KPIData, KPIInfo } from '@/lib/api';
import { DataPoint } from '@/types';

// Interfaces
interface KPIDataState {
  data: Record<string, DataPoint[]>; // chartId -> data points
  loading: Set<string>; // chart IDs currently loading
  errors: Record<string, string>; // chartId -> error message
  cache: Record<string, CachedKPIData>; // cache key -> cached data
  lastUpdated: Record<string, number>; // chartId -> timestamp
}

interface CachedKPIData {
  data: DataPoint[];
  timestamp: number;
  expiresAt: number;
}

interface FetchKPIDataParams {
  chartId: string;
  kpiIds: string[];
  kpiInfo: KPIInfo[];
  dateRange: {
    from: Date;
    to: Date;
  };
  aggregation?: string;
}

// Initial state
const initialState: KPIDataState = {
  data: {},
  loading: new Set(),
  errors: {},
  cache: {},
  lastUpdated: {},
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Helper functions
const getCacheKey = (kpiId: string, from: string, to: string, aggregation: string): string => {
  return `${kpiId}-${from}-${to}-${aggregation}`;
};

const isDataStale = (timestamp: number, maxAge: number = CACHE_DURATION): boolean => {
  return Date.now() - timestamp > maxAge;
};

// Async thunk for fetching KPI data
export const fetchKPIData = createAsyncThunk(
  'kpiData/fetchKPIData',
  async (params: FetchKPIDataParams, { getState, rejectWithValue }) => {
    try {
      const { chartId, kpiIds, kpiInfo, dateRange, aggregation } = params;
      const state = getState() as any;
      const cache = state.kpiData.cache;

      const fromStr = dateRange.from.toISOString().slice(0, 19);
      const toStr = dateRange.to.toISOString().slice(0, 19);

      const allData: DataPoint[] = [];

      // Process each KPI
      for (const kpiId of kpiIds) {
        // Determine KPI group
        let kpiGroup = ApiService.getKPIGroup(kpiId, kpiInfo);
        if (!kpiInfo.find(kpi => kpi.kpi_name === kpiId)) {
          kpiGroup = await ApiService.getKPIGroupDynamic(kpiId);
        }

        // Set appropriate aggregation based on KPI group
        const kpiAggregation = aggregation || (kpiGroup === 'jobs' ? '10m' : '60s');
        const cacheKey = getCacheKey(kpiId, fromStr, toStr, kpiAggregation);

        // Check cache first
        const cachedData = cache[cacheKey];
        if (cachedData && !isDataStale(cachedData.timestamp)) {
          allData.push(...cachedData.data);
          continue;
        }

        // Fetch fresh data
        const rawData = await ApiService.fetchKPIData(kpiId, kpiGroup, fromStr, toStr, kpiAggregation);
        
        const processedData: DataPoint[] = rawData.map((item: KPIData) => ({
          date: item.timestamp,
          category: kpiId,
          value: item.kpi_value || item.job_count || 0
        }));

        allData.push(...processedData);

        // Cache the processed data
        const cacheEntry: CachedKPIData = {
          data: processedData,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION,
        };

        // Update cache in the next action
        setTimeout(() => {
          // This will be handled by the fulfilled case
        }, 0);
      }

      return {
        chartId,
        data: allData,
        cacheUpdates: kpiIds.map(kpiId => {
          const kpiGroup = ApiService.getKPIGroup(kpiId, kpiInfo);
          const kpiAggregation = aggregation || (kpiGroup === 'jobs' ? '10m' : '60s');
          const cacheKey = getCacheKey(kpiId, fromStr, toStr, kpiAggregation);
          const kpiData = allData.filter(d => d.category === kpiId);
          
          return {
            key: cacheKey,
            data: {
              data: kpiData,
              timestamp: Date.now(),
              expiresAt: Date.now() + CACHE_DURATION,
            }
          };
        })
      };
    } catch (error) {
      return rejectWithValue({
        chartId: params.chartId,
        error: error instanceof Error ? error.message : 'Failed to fetch KPI data'
      });
    }
  }
);

// Batch fetch for multiple charts
export const fetchMultipleKPIData = createAsyncThunk(
  'kpiData/fetchMultipleKPIData',
  async (requests: FetchKPIDataParams[], { dispatch }) => {
    const results = await Promise.allSettled(
      requests.map(request => dispatch(fetchKPIData(request)))
    );
    
    return results.map((result, index) => ({
      chartId: requests[index].chartId,
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason : null
    }));
  }
);

// Slice
const kpiDataSlice = createSlice({
  name: 'kpiData',
  initialState,
  reducers: {
    clearKPIData: (state, action: PayloadAction<string>) => {
      const chartId = action.payload;
      delete state.data[chartId];
      delete state.errors[chartId];
      delete state.lastUpdated[chartId];
      state.loading.delete(chartId);
    },
    clearAllKPIData: (state) => {
      state.data = {};
      state.errors = {};
      state.lastUpdated = {};
      state.loading.clear();
    },
    invalidateCache: (state, action: PayloadAction<string | undefined>) => {
      const pattern = action.payload;
      if (pattern) {
        // Remove cache entries matching pattern
        Object.keys(state.cache).forEach(key => {
          if (key.includes(pattern)) {
            delete state.cache[key];
          }
        });
      } else {
        // Clear all cache
        state.cache = {};
      }
    },
    cleanExpiredCache: (state) => {
      const now = Date.now();
      Object.keys(state.cache).forEach(key => {
        if (state.cache[key].expiresAt <= now) {
          delete state.cache[key];
        }
      });
    },
    setLoadingState: (state, action: PayloadAction<{ chartId: string; loading: boolean }>) => {
      const { chartId, loading } = action.payload;
      if (loading) {
        state.loading.add(chartId);
      } else {
        state.loading.delete(chartId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKPIData.pending, (state, action) => {
        const chartId = action.meta.arg.chartId;
        state.loading.add(chartId);
        delete state.errors[chartId];
      })
      .addCase(fetchKPIData.fulfilled, (state, action) => {
        const { chartId, data, cacheUpdates } = action.payload;
        
        state.loading.delete(chartId);
        state.data[chartId] = data;
        state.lastUpdated[chartId] = Date.now();
        delete state.errors[chartId];

        // Update cache
        cacheUpdates.forEach(update => {
          state.cache[update.key] = update.data;
        });
      })
      .addCase(fetchKPIData.rejected, (state, action) => {
        const payload = action.payload as { chartId: string; error: string };
        
        state.loading.delete(payload.chartId);
        state.errors[payload.chartId] = payload.error;
      });
  },
});

export const { 
  clearKPIData, 
  clearAllKPIData, 
  invalidateCache, 
  cleanExpiredCache,
  setLoadingState 
} = kpiDataSlice.actions;

export default kpiDataSlice.reducer;