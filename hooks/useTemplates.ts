"use client"

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchTemplates,
  fetchTemplateDetail,
  fetchKPIInfo,
  selectTemplate,
  setSelectedTemplateFromDefault
} from '@/store/slices/templatesSlice';
import {
  selectTemplates,
  selectSelectedTemplate,
  selectSelectedTemplateDetail,
  selectKPIInfo,
  selectTemplatesLoading,
  selectTemplatesErrors
} from '@/store/selectors';

export function useTemplates() {
  const dispatch = useAppDispatch();
  
  // Selectors
  const templates = useAppSelector(selectTemplates);
  const selectedTemplate = useAppSelector(selectSelectedTemplate);
  const templateDetail = useAppSelector(selectSelectedTemplateDetail);
  const kpiInfo = useAppSelector(selectKPIInfo);
  const loading = useAppSelector(selectTemplatesLoading);
  const errors = useAppSelector(selectTemplatesErrors);

  // Initialize data on mount
  useEffect(() => {
    // Fetch templates and KPI info if not already loaded
    if (templates.length === 0) {
      dispatch(fetchTemplates());
    }
    
    if (kpiInfo.length === 0) {
      dispatch(fetchKPIInfo());
    }
  }, [dispatch, templates.length, kpiInfo.length]);

  // Auto-select default template
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      dispatch(setSelectedTemplateFromDefault());
    }
  }, [dispatch, templates, selectedTemplate]);

  // Fetch template detail when selected template changes
  useEffect(() => {
    if (selectedTemplate && !templateDetail) {
      dispatch(fetchTemplateDetail(selectedTemplate.id));
    }
  }, [dispatch, selectedTemplate, templateDetail]);

  const selectTemplateById = (templateId: string) => {
    dispatch(selectTemplate(templateId));
    // Fetch detail if not already cached
    dispatch(fetchTemplateDetail(templateId));
  };

  const refreshTemplates = () => {
    dispatch(fetchTemplates());
  };

  const refreshKPIInfo = () => {
    dispatch(fetchKPIInfo());
  };

  return {
    templates,
    selectedTemplate,
    templateDetail,
    kpiInfo,
    loading: loading.templates || loading.kpiInfo,
    error: errors.templates || errors.kpiInfo,
    selectTemplate: selectTemplateById,
    refreshTemplates,
    refreshKPIInfo,
  };
}