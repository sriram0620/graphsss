import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiService, Template, TemplateDetail, KPIInfo } from '@/lib/api';

// Processed template interface
export interface ProcessedTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isFavorite: boolean;
}

// State interface
interface TemplatesState {
  templates: ProcessedTemplate[];
  selectedTemplateId: string | null;
  templateDetails: Record<string, TemplateDetail>;
  kpiInfo: KPIInfo[];
  loading: {
    templates: boolean;
    templateDetail: boolean;
    kpiInfo: boolean;
  };
  errors: {
    templates: string | null;
    templateDetail: string | null;
    kpiInfo: string | null;
  };
  lastFetched: {
    templates: number | null;
    kpiInfo: number | null;
  };
}

// Initial state
const initialState: TemplatesState = {
  templates: [],
  selectedTemplateId: null,
  templateDetails: {},
  kpiInfo: [],
  loading: {
    templates: false,
    templateDetail: false,
    kpiInfo: false,
  },
  errors: {
    templates: null,
    templateDetail: null,
    kpiInfo: null,
  },
  lastFetched: {
    templates: null,
    kpiInfo: null,
  },
};

// Async thunks
export const fetchTemplates = createAsyncThunk(
  'templates/fetchTemplates',
  async (userId: string = 'USER_TEST_1', { rejectWithValue }) => {
    try {
      const templatesData = await ApiService.fetchTemplates(userId);
      
      // Process templates data
      const processedTemplates: ProcessedTemplate[] = templatesData.map(template => ({
        id: template.template_id[0],
        name: template.template_name[0],
        description: template.template_desc[0],
        isDefault: template.default[0],
        isFavorite: template.favorite[0],
      }));

      return processedTemplates;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch templates');
    }
  }
);

export const fetchTemplateDetail = createAsyncThunk(
  'templates/fetchTemplateDetail',
  async (templateId: string, { rejectWithValue }) => {
    try {
      const detailData = await ApiService.fetchTemplateDetail(templateId);
      if (detailData && detailData.length > 0) {
        return { templateId, detail: detailData[0] };
      }
      throw new Error('No template detail found');
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch template detail');
    }
  }
);

export const fetchKPIInfo = createAsyncThunk(
  'templates/fetchKPIInfo',
  async (_, { rejectWithValue }) => {
    try {
      const kpiInfoData = await ApiService.fetchAllKPIInfo();
      return kpiInfoData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch KPI info');
    }
  }
);

// Slice
const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    selectTemplate: (state, action: PayloadAction<string>) => {
      state.selectedTemplateId = action.payload;
    },
    clearTemplateErrors: (state) => {
      state.errors.templates = null;
      state.errors.templateDetail = null;
      state.errors.kpiInfo = null;
    },
    setSelectedTemplateFromDefault: (state) => {
      if (!state.selectedTemplateId && state.templates.length > 0) {
        // Find default template or use first one
        const defaultTemplate = state.templates.find(t => t.isDefault);
        state.selectedTemplateId = defaultTemplate ? defaultTemplate.id : state.templates[0].id;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch templates
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.loading.templates = true;
        state.errors.templates = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading.templates = false;
        state.templates = action.payload;
        state.lastFetched.templates = Date.now();
        
        // Auto-select default template if none selected
        if (!state.selectedTemplateId && action.payload.length > 0) {
          const defaultTemplate = action.payload.find(t => t.isDefault);
          state.selectedTemplateId = defaultTemplate ? defaultTemplate.id : action.payload[0].id;
        }
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading.templates = false;
        state.errors.templates = action.payload as string;
      });

    // Fetch template detail
    builder
      .addCase(fetchTemplateDetail.pending, (state) => {
        state.loading.templateDetail = true;
        state.errors.templateDetail = null;
      })
      .addCase(fetchTemplateDetail.fulfilled, (state, action) => {
        state.loading.templateDetail = false;
        state.templateDetails[action.payload.templateId] = action.payload.detail;
      })
      .addCase(fetchTemplateDetail.rejected, (state, action) => {
        state.loading.templateDetail = false;
        state.errors.templateDetail = action.payload as string;
      });

    // Fetch KPI info
    builder
      .addCase(fetchKPIInfo.pending, (state) => {
        state.loading.kpiInfo = true;
        state.errors.kpiInfo = null;
      })
      .addCase(fetchKPIInfo.fulfilled, (state, action) => {
        state.loading.kpiInfo = false;
        state.kpiInfo = action.payload;
        state.lastFetched.kpiInfo = Date.now();
      })
      .addCase(fetchKPIInfo.rejected, (state, action) => {
        state.loading.kpiInfo = false;
        state.errors.kpiInfo = action.payload as string;
      });
  },
});

export const { selectTemplate, clearTemplateErrors, setSelectedTemplateFromDefault } = templatesSlice.actions;
export default templatesSlice.reducer;