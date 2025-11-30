// src/types/mapFilters.ts
// Shared map filtering interface used by map-related components.
export interface MapFilters {
  enabled: boolean;
  dateRange: 'all' | 'week' | 'month';
  customFieldId: string | null;
  customFieldValue: string | null;
}
