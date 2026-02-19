import { callAuthEdgeFunction } from './core';

export interface PerformanceTip {
  title:       string;
  description: string;
  metric:      string;
  improvement: string;
}

export interface SendTimeSlot {
  day:           number;
  day_name:      string;
  hour:          number;
  confidence:    number;
  reason:        string;
  avg_open_rate?: number;
}

export interface DateRange {
  start?: string;
  end?:   string;
}

export async function generatePerformanceTips(params: { date_range?: DateRange } = {}): Promise<{
  tips:     PerformanceTip[];
  based_on: number;
}> {
  return callAuthEdgeFunction('generate-performance-tips', params);
}

export async function exportPerformanceReport(params: { date_range?: DateRange } = {}): Promise<{
  report_html: string;
  row_count:   number;
}> {
  return callAuthEdgeFunction('export-performance-report', params);
}

export async function suggestSendTime(): Promise<{
  recommended_slots: SendTimeSlot[];
  based_on_data:     boolean;
  sample_size:       number;
}> {
  return callAuthEdgeFunction('suggest-send-time', {});
}
