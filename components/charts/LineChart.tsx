"use client"

import React, { useMemo } from 'react'
import { DataPoint, ChartType } from '@/types'
import ChartContainer from './ChartContainer'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import type { EChartsOption } from 'echarts'

interface LineChartProps {
  data: DataPoint[]
  title: string
  className?: string
  activeKPIs: Set<string>
  kpiColors: Record<string, { color: string; name: string }>
  dateRange?: DateRange
}

const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  title, 
  className,
  activeKPIs,
  kpiColors,
  dateRange 
}) => {
  const options = useMemo((): EChartsOption => {
    const dates = Array.from(new Set(data.map(item => item.date)))
    const categories = Array.from(new Set(data.map(item => item.category)))

    return {
      animation: true,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: (params: any) => {
          const date = params[0].axisValue
          let html = `<div style="font-weight: bold">${format(new Date(date), 'MMM d, yyyy')}</div>`
          params.forEach((param: any) => {
            html += `
              <div style="color: ${param.color}">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color}; border-radius: 50%; margin-right: 5px;"></span>
                ${param.seriesName}: ${param.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </div>`
          })
          return html
        }
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none'
          },
          restore: {},
          saveAsImage: {}
        }
      },
      dataZoom: [
        {
          type: 'slider' as const,
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100
        },
        {
          type: 'inside' as const,
          xAxisIndex: [0],
          start: 0,
          end: 100
        }
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category' as const,
        boundaryGap: false,
        data: dates,
        axisLabel: {
          formatter: (value: string) => format(new Date(value), 'MMM d')
        }
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: {
          formatter: (value: number) => 
            value.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            })
        }
      },
      series: categories.map(category => ({
        name: category,
        type: 'line' as const,
        sampling: 'lttb',
        data: dates.map(date => {
          const point = data.find(item => item.date === date && item.category === category)
          return point ? point.value : null
        }),
        smooth: true,
        showSymbol: false,
        emphasis: {
          focus: 'series'
        },
        areaStyle: {
          opacity: 0.1
        }
      }))
    }
  }, [data])

  return (
    <ChartContainer
      data={data}
      type="line"
      title={title}
      activeKPIs={activeKPIs}
      kpiColors={kpiColors}
      dateRange={dateRange}
      className={className}
      options={options}
    />
  )
}

export default LineChart