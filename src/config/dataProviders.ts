/// <reference types="vite/client" />

export type DataProvider = 'yahoo' | 'fmp' | 'mock';

export interface DataProviderConfig {
  primary: DataProvider;
  fallback: DataProvider;
  fmpApiKey: string;
  refreshIntervalMs: number;
  enableMockFallback: boolean;
}

const config: DataProviderConfig = {
  primary: 'yahoo',
  fallback: 'mock',
  fmpApiKey: import.meta.env.VITE_FMP_API_KEY ?? '',
  refreshIntervalMs: 60_000, // refresh quotes every 60 seconds
  enableMockFallback: true,
};

export default config;
