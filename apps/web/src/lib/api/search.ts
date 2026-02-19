import { callAuthEdgeFunction } from './core';

export interface SearchResult {
  type:     'newsletter' | 'source' | 'template';
  id:       string;
  title:    string;
  snippet:  string;
  relevance: number;
  date:     string;
  status?:  string;
}

export interface SearchFilters {
  types?:      string[];
  status?:     string;
  date_range?: { start?: string; end?: string };
}

export async function globalSearch(params: {
  query:    string;
  filters?: SearchFilters;
  limit?:   number;
}): Promise<{
  results:     SearchResult[];
  total:       number;
  suggestions: string[];
}> {
  return callAuthEdgeFunction('global-search', params);
}
