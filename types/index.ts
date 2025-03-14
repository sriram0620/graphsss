export type ChartType = 'line' | 'bar';

export interface DataPoint {
  date: string;
  category: string;
  value: number;
}

export interface ChartData {
  title: string;
  type: ChartType;
  data: DataPoint[];
}

export interface ChartConfig {
  id: string;
  data: DataPoint[];
  type: ChartType;
  title: string;
  width: number;
  height: number;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  charts: number[];
}

export type TemplateKey = 'default' | 'single' | 'dual' | 'triple' | 'quad' | 'five' | 'six' | 'seven' | 'eight';