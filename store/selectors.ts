import { createSelector } from 'reselect';
import { RootState } from './index';

// Templates selectors
export const selectTemplatesState = (state: RootState) => state.templates;
export const selectKPIDataState = (state: RootState) => state.kpiData;
export const selectUIState = (state: RootState) => state.ui;

// Memoized selectors
export const selectTemplates = createSelector(
  [selectTemplatesState],
  (templatesState) => templatesState.templates
);

export const selectSelectedTemplate = createSelector(
  [selectTemplatesState],
  (templatesState) => {
    if (!templatesState.selectedTemplateId) return null;
    return templatesState.templates.find(t => t.id === templatesState.selectedTemplateId) || null;
  }
);

export const selectSelectedTemplateDetail = createSelector(
  [selectTemplatesState],
  (templatesState) => {
    if (!templatesState.selectedTemplateId) return null;
    return templatesState.templateDetails[templatesState.selectedTemplateId] || null;
  }
);

export const selectKPIInfo = createSelector(
  [selectTemplatesState],
  (templatesState) => templatesState.kpiInfo
);

export const selectTemplatesLoading = createSelector(
  [selectTemplatesState],
  (templatesState) => templatesState.loading
);

export const selectTemplatesErrors = createSelector(
  [selectTemplatesState],
  (templatesState) => templatesState.errors
);

// KPI Data selectors
export const selectChartData = createSelector(
  [selectKPIDataState, (state: RootState, chartId: string) => chartId],
  (kpiDataState, chartId) => kpiDataState.data[chartId] || []
);

export const selectChartLoading = createSelector(
  [selectKPIDataState, (state: RootState, chartId: string) => chartId],
  (kpiDataState, chartId) => Boolean(kpiDataState.loading[chartId]) // Changed from Set.has to object property check
);

export const selectChartError = createSelector(
  [selectKPIDataState, (state: RootState, chartId: string) => chartId],
  (kpiDataState, chartId) => kpiDataState.errors[chartId] || null
);

export const selectAllLoadingCharts = createSelector(
  [selectKPIDataState],
  (kpiDataState) => Object.keys(kpiDataState.loading).filter(chartId => kpiDataState.loading[chartId]) // Changed from Array.from(Set) to Object.keys with filter
);

export const selectCacheStats = createSelector(
  [selectKPIDataState],
  (kpiDataState) => {
    const totalEntries = Object.keys(kpiDataState.cache).length;
    const expiredEntries = Object.values(kpiDataState.cache).filter(
      entry => entry.expiresAt <= Date.now()
    ).length;
    
    return {
      total: totalEntries,
      expired: expiredEntries,
      active: totalEntries - expiredEntries
    };
  }
);

// UI selectors
export const selectGlobalDateRange = createSelector(
  [selectUIState],
  (uiState) => uiState.globalDateRange
);

export const selectSelectedTheme = createSelector(
  [selectUIState],
  (uiState) => uiState.selectedTheme
);

export const selectResolution = createSelector(
  [selectUIState],
  (uiState) => uiState.resolution
);

export const selectAutoRefresh = createSelector(
  [selectUIState],
  (uiState) => uiState.autoRefresh
);

export const selectSidebarExpanded = createSelector(
  [selectUIState],
  (uiState) => uiState.sidebarExpanded
);

// Combined selectors
export const selectDashboardData = createSelector(
  [selectSelectedTemplate, selectSelectedTemplateDetail, selectKPIInfo],
  (selectedTemplate, templateDetail, kpiInfo) => ({
    selectedTemplate,
    templateDetail,
    kpiInfo,
    hasData: !!(selectedTemplate && templateDetail && kpiInfo.length > 0)
  })
);

export const selectTemplateStats = createSelector(
  [selectSelectedTemplateDetail],
  (templateDetail) => {
    if (!templateDetail) return null;
    
    return {
      totalGraphs: templateDetail.graphs.length,
      totalSystems: templateDetail.systems.length,
      frequency: templateDetail.frequency,
      resolution: templateDetail.resolution
    };
  }
);