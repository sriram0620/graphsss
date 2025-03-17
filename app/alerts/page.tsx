"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Bell, Filter, Columns, ChevronDown, Maximize2, Minimize2 } from "lucide-react"
import Sidebar from "@/components/sidebar"
import { DateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"
import * as echarts from 'echarts';
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

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

interface AlertStats {
  total: number;
  critical1: number;
  critical2: number;
  critical3: number;
}

interface PieChartData {
  title: string;
  data: { name: string; value: number }[];
}

const PieChart = React.memo(({ data, selectedTheme, theme }: { 
  data: PieChartData;
  selectedTheme: string;
  theme?: string;
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const colors = chartThemes[selectedTheme as keyof typeof chartThemes].colors;
    
    chartInstance.current = echarts.init(chartRef.current, theme === 'dark' ? 'dark' : undefined);
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#000'
        }
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
        }
      },
      series: [
        {
          name: data.title,
          type: 'pie',
          radius: ['60%', '85%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: theme === 'dark' ? '#fff' : '#000'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          labelLine: {
            show: false
          },
          data: data.data.map((item, i) => ({
            ...item,
            itemStyle: { color: colors[i % colors.length] }
          }))
        }
      ]
    };

    chartInstance.current.setOption(option);
  }, [data, theme, selectedTheme]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleFullscreen = () => {
    setIsTransitioning(true);
    setIsFullscreen(!isFullscreen);
    
    setTimeout(() => {
      setIsTransitioning(false);
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    }, 300);
  };

  return (
    <>
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-40"
            onClick={toggleFullscreen}
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{
          layout: { duration: 0.3, ease: "easeInOut" }
        }}
        className={cn(
          "relative",
          isFullscreen && "fixed inset-4 z-50"
        )}
      >
        <Card className={cn(
          "col-span-1 p-6 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl transition-all duration-300 hover:shadow-2xl",
          theme === 'dark' && "bg-slate-900/90 hover:bg-slate-900/95",
          isFullscreen && "h-full rounded-xl flex flex-col"
        )}>
          {isTransitioning && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              {data.title}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-accent/40"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-accent/40"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div
            ref={chartRef}
            className={cn(
              "w-full transition-all duration-300",
              isFullscreen ? "h-[calc(100vh-10rem)]" : "h-[300px]"
            )}
          />
        </Card>
      </motion.div>
    </>
  );
});

PieChart.displayName = 'PieChart';

export default function AlertsPage() {
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const { theme } = useTheme();

  const alertStats: AlertStats = {
    total: 88017,
    critical1: 88017,
    critical2: 0,
    critical3: 0
  };

  const pieChartsData: PieChartData[] = [
    {
      title: "Alerts by Severity",
      data: [
        { name: "Critical", value: 88017 }
      ]
    },
    {
      title: "Alerts by Status",
      data: [
        { name: "Active", value: 44008 },
        { name: "Cleared", value: 44009 }
      ]
    },
    {
      title: "Alerts by Asset",
      data: [
        { name: "N/A", value: 86780 },
        { name: "pulse-171221445600", value: 1237 }
      ]
    },
    {
      title: "Alerts by Source",
      data: [
        { name: "Pulse", value: 86780 },
        { name: "Alert Group", value: 1237 }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background/98 to-background/95 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Alert Monitoring
              </h1>
              <p className="text-muted-foreground/90 text-lg mt-2">
                Monitor and manage all system alerts
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger className="w-[180px] bg-card/90 backdrop-blur-sm">
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

              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="w-[280px]"
                align="end"
              />

              <Button variant="outline" className="gap-2 bg-card/90 backdrop-blur-sm hover:bg-accent/40">
                Clear Filters
              </Button>

              <Button variant="outline" className="gap-2 bg-card/90 backdrop-blur-sm hover:bg-accent/40">
                Last 1 Hour
              </Button>

              <Button variant="outline" className="gap-2 bg-card/90 backdrop-blur-sm hover:bg-accent/40">
                1 Selected
                <ChevronDown className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-6 mb-8"
          >
            <Card className={cn(
              "p-6 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
              theme === 'dark' && "bg-slate-900/90 hover:bg-slate-900/95"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Alerts Count</p>
                  <h2 className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                    {alertStats.total}
                  </h2>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Bell className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </Card>

            <Card className={cn(
              "p-6 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
              theme === 'dark' && "bg-slate-900/90 hover:bg-slate-900/95"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Alert count (Level-1)</p>
                  <h2 className="text-3xl font-bold mt-2 bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                    {alertStats.critical1}
                  </h2>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Bell className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            </Card>

            <Card className={cn(
              "p-6 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
              theme === 'dark' && "bg-slate-900/90 hover:bg-slate-900/95"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Alert count (Level-2)</p>
                  <h2 className="text-3xl font-bold mt-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    {alertStats.critical2}
                  </h2>
                </div>
                <div className="p-3 rounded-full bg-orange-500/10">
                  <Bell className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </Card>

            <Card className={cn(
              "p-6 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
              theme === 'dark' && "bg-slate-900/90 hover:bg-slate-900/95"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Alert count (Level-3)</p>
                  <h2 className="text-3xl font-bold mt-2 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                    {alertStats.critical3}
                  </h2>
                </div>
                <div className="p-3 rounded-full bg-red-500/10">
                  <Bell className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-6 mb-8"
          >
            {pieChartsData.map((data, index) => (
              <PieChart 
                key={index}
                data={data}
                selectedTheme={selectedTheme}
                theme={theme}
              />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={cn(
              "backdrop-blur-sm bg-card/90 border-border/40 shadow-xl transition-all duration-300",
              theme === 'dark' && "bg-slate-900/90"
            )}>
              <div className="p-6 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    Alerts List
                  </h2>
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Filter through alerts..."
                      className="w-[300px] bg-card/90 backdrop-blur-sm"
                    />
                    <Button variant="outline" className="gap-2 bg-card/90 backdrop-blur-sm hover:bg-accent/40">
                      <Filter className="h-4 w-4" />
                      Filter By
                    </Button>
                    <Button variant="outline" className="gap-2 bg-card/90 backdrop-blur-sm hover:bg-accent/40">
                      <Columns className="h-4 w-4" />
                      Columns
                    </Button>
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-accent/5">
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KPI ID</TableHead>
                    <TableHead>CFX Incident ID</TableHead>
                    <TableHead>ITSM Incident ID</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No results
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}