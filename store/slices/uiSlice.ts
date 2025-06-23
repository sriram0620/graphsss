import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Serializable date range interface
interface SerializableDateRange {
  from?: string; // ISO string instead of Date object
  to?: string;   // ISO string instead of Date object
}

interface UIState {
  globalDateRange: SerializableDateRange | undefined;
  selectedTheme: string;
  resolution: string;
  autoRefresh: boolean;
  refreshInterval: number;
  sidebarExpanded: boolean;
  fullscreenChart: string | null;
}

const initialState: UIState = {
  globalDateRange: {
    from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    to: new Date().toISOString()
  },
  selectedTheme: 'default',
  resolution: 'auto',
  autoRefresh: false,
  refreshInterval: 30000, // 30 seconds
  sidebarExpanded: true,
  fullscreenChart: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setGlobalDateRange: (state, action: PayloadAction<SerializableDateRange | undefined>) => {
      state.globalDateRange = action.payload;
    },
    setSelectedTheme: (state, action: PayloadAction<string>) => {
      state.selectedTheme = action.payload;
    },
    setResolution: (state, action: PayloadAction<string>) => {
      state.resolution = action.payload;
    },
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefresh = action.payload;
    },
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
    },
    setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
      state.sidebarExpanded = action.payload;
    },
    setFullscreenChart: (state, action: PayloadAction<string | null>) => {
      state.fullscreenChart = action.payload;
    },
    resetUISettings: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setGlobalDateRange,
  setSelectedTheme,
  setResolution,
  setAutoRefresh,
  setRefreshInterval,
  setSidebarExpanded,
  setFullscreenChart,
  resetUISettings,
} = uiSlice.actions;

export default uiSlice.reducer;