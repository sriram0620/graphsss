"use client"

import { useState, useEffect } from 'react';
import { ApiService, Template, TemplateDetail, KPIInfo } from '@/lib/api';

export interface ProcessedTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isFavorite: boolean;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<ProcessedTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessedTemplate | null>(null);
  const [templateDetail, setTemplateDetail] = useState<TemplateDetail | null>(null);
  const [kpiInfo, setKpiInfo] = useState<KPIInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates and KPI info on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all KPI info (both OS and Jobs)
        const kpiInfoData = await ApiService.fetchAllKPIInfo();
        setKpiInfo(kpiInfoData);

        // Fetch templates
        const templatesData = await ApiService.fetchTemplates();
        
        // Process templates data
        const processedTemplates: ProcessedTemplate[] = templatesData.map(template => ({
          id: template.template_id[0],
          name: template.template_name[0],
          description: template.template_desc[0],
          isDefault: template.default[0],
          isFavorite: template.favorite[0],
        }));

        setTemplates(processedTemplates);

        // Set default template as selected
        const defaultTemplate = processedTemplates.find(t => t.isDefault);
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate);
        } else if (processedTemplates.length > 0) {
          setSelectedTemplate(processedTemplates[0]);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch templates');
        console.error('Error fetching initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch template detail when selected template changes
  useEffect(() => {
    const fetchTemplateDetail = async () => {
      if (!selectedTemplate) return;

      try {
        setError(null);
        const detailData = await ApiService.fetchTemplateDetail(selectedTemplate.id);
        if (detailData && detailData.length > 0) {
          setTemplateDetail(detailData[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch template detail');
        console.error('Error fetching template detail:', err);
      }
    };

    fetchTemplateDetail();
  }, [selectedTemplate]);

  const selectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
  };

  return {
    templates,
    selectedTemplate,
    templateDetail,
    kpiInfo,
    loading,
    error,
    selectTemplate,
  };
}