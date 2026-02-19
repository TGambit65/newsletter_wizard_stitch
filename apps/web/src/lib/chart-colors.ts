// Theme-aware chart color palettes for ECharts

export interface ChartTheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  // Axis / grid
  axisLabel: string;
  axisLine: string;
  splitLine: string;
  // Tooltip
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  // Legend
  legendText: string;
}

export const lightChartTheme: ChartTheme = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  axisLabel: '#a3a3a3',
  axisLine: '#e5e5e5',
  splitLine: '#f5f5f5',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e5e5',
  tooltipText: '#171717',
  legendText: '#a3a3a3',
};

export const darkChartTheme: ChartTheme = {
  primary: '#818cf8',
  secondary: '#a78bfa',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  axisLabel: '#737373',
  axisLine: '#404040',
  splitLine: '#2a2a2a',
  tooltipBg: '#262626',
  tooltipBorder: '#404040',
  tooltipText: '#f5f5f5',
  legendText: '#737373',
};

export function getChartTheme(resolvedTheme: 'light' | 'dark'): ChartTheme {
  return resolvedTheme === 'dark' ? darkChartTheme : lightChartTheme;
}
