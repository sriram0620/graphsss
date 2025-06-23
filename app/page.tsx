"use client"

import { motion } from "framer-motion"
import { Activity, TrendingUp, Users, DollarSign } from "lucide-react"
import { Card } from "@/components/ui/card"
import Sidebar from "@/components/sidebar"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { DateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"
import { useSidebar } from "@/contexts/sidebar-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useTemplates } from "@/hooks/useTemplates"
import { ReduxTemplateDynamicLayout } from "@/components/charts/ReduxTemplateDynamicLayout"
import { Button } from "@/components/ui/button"
import { RefreshCw, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { 
  setGlobalDateRange, 
  setSelectedTheme, 
  setResolution, 
  setAutoRefresh 
} from "@/store/slices/uiSlice"
import { invalidateCache, cleanExpiredCache } from "@/store/slices/kpiDataSlice"
import {
  selectGlobalDateRange,
  selectSelectedTheme,
  selectResolution,
  selectAutoRefresh,
  selectTemplateStats,
  selectAllLoadingCharts,
  selectCacheStats
} from "@/store/selectors"

const chartThemes = {
  default: {
    name: 'Default',
    colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981']
  },
  ocean: {
    name: 'Ocean',
    colors: ['#0EA5E9', '#0D9488', '#0284C7', '#0369A1']
  },
  forest: {
    name: 'Forest',
    colors: ['#22C55E', '#15803D', '#84CC16', '#4D7C0F']
  },
  sunset: {
    name: 'Sunset',
    colors: ['#F97316', '#EA580C', '#DC2626', '#9F1239']
  }
};

const resolutionOptions = [
  { value: 'auto', label: 'Auto' },
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: '1 Day' }
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const { isExpanded } = useSidebar();
  
  // Redux hooks
  const dispatch = useAppDispatch();
  const globalDateRange = useAppSelector(selectGlobalDateRange);
  const selectedTheme = useAppSelector(selectSelectedTheme);
  const resolution = useAppSelector(selectResolution);
  const autoRefresh = useAppSelector(selectAutoRefresh);
  const templateStats = useAppSelector(selectTemplateStats);
  const loadingCharts = useAppSelector(selectAllLoadingCharts);
  const cacheStats = useAppSelector(selectCacheStats);

  const {
    templates,
    selectedTemplate,
    templateDetail,
    kpiInfo,
    loading,
    error,
    selectTemplate,
  } = useTemplates();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Clean expired cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(cleanExpiredCache());
    }, 60000); // Clean every minute

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleRefreshAll = () => {
    dispatch(invalidateCache());
  };

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    dispatch(setGlobalDateRange(dateRange));
  };

  const handleThemeChange = (theme: string) => {
    dispatch(setSelectedTheme(theme));
  };

  const handleResolutionChange = (resolution: string) => {
    dispatch(setResolution(resolution));
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    dispatch(setAutoRefresh(enabled));
  };

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background via-background/98 to-background/95">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background via-background/98 to-background/95">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Error Loading Templates</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background/98 to-background/95 overflow-hidden">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto transition-all duration-300`}>
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Analytics Dashboard
              </h1>
              {selectedTemplate && (
                <p className="text-muted-foreground/90 text-lg mt-2">
                  {selectedTemplate.name} - {selectedTemplate.description}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Select 
                value={selectedTemplate?.id || ''} 
                onValueChange={selectTemplate}
              >
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        {template.isDefault && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                        {template.isFavorite && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-1.5 py-0.5 rounded">
                            ★
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTheme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(chartThemes).map(([key, theme]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {theme.colors.map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="ml-2">{theme.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-4">
                <DateRangePicker
                  date={globalDateRange}
                  onDateChange={handleDateRangeChange}
                  className="w-[280px]"
                  showTime
                />

                <Select value={resolution} onValueChange={handleResolutionChange}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={handleAutoRefreshToggle}
                  />
                  <span className="text-sm text-muted-foreground">Auto Refresh</span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshAll}
                  title="Refresh All Charts"
                  disabled={loadingCharts.length > 0}
                >
                  <RefreshCw className={`h-4 w-4 ${loadingCharts.length > 0 ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Template Stats */}
          {templateStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <Card className="p-6 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Graphs</p>
                    <h3 className="text-2xl font-bold">{templateStats.totalGraphs}</h3>
                  </div>
                </div>
              </Card>

              <Card className="p-6 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Systems</p>
                    <h3 className="text-2xl font-bold">{templateStats.totalSystems}</h3>
                  </div>
                </div>
              </Card>

              <Card className="p-6 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <Users className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resolution</p>
                    <h3 className="text-lg font-bold">{templateStats.resolution}</h3>
                  </div>
                </div>
              </Card>

              <Card className="p-6 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-500/10">
                    <DollarSign className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cache</p>
                    <h3 className="text-lg font-bold">{cacheStats.active}/{cacheStats.total}</h3>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Dynamic Chart Layout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid gap-6"
          >
            {templateDetail ? (
              <ReduxTemplateDynamicLayout
                templateDetail={templateDetail}
                kpiInfo={kpiInfo}
                dateRange={globalDateRange}
                theme={chartThemes[selectedTheme as keyof typeof chartThemes]}
              />
            ) : (
              <Card className="p-12 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl text-center">
                <p className="text-muted-foreground text-lg">No template selected</p>
                <p className="text-sm text-muted-foreground/80 mt-1">
                  Please select a template from the dropdown above
                </p>
              </Card>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}