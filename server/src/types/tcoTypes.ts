export interface TcoFilterOptions {
  vehicleId: string;
  startDate?: string;
  endDate?: string;
  minOdometer?: number;
  maxOdometer?: number;
  includePurchasePrice?: boolean;
  includeFixedExpenses?: boolean;
}

export interface FuelTrendPoint {
  date: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  lPer100Km: number | null;
  kmPerLiter: number | null;
  rollingAvgLPer100Km: number | null;
}

export interface MonthlySpendBreakdown {
  month: string; // YYYY-MM
  fuel: number;
  regularMaintenance: number;
  unscheduledRepairs: number;
  fixedExpenses: number;
  total: number;
}

export interface FuelTripMetric {
  date: string;
  odometer: number;
  deltaKm: number | null;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  costPer100Km: number | null;
  lPer100Km: number | null;
  station: string | null;
  is_towing?: number | boolean;
}

export interface StationComparison {
  name: string;
  totalSpend: number;
  totalLiters: number;
  avgPricePerLiter: number;
  fillCount: number;
}

export interface FuelDetailedStats {
  totalFuelLiters: number;
  avgDistancePerTank: number | null;
  maxDistancePerTank: number | null;
  avgCostPer100Km: number | null;
  avgNormalLPer100Km: number | null;
  avgTowingLPer100Km: number | null;
  tripMetrics: FuelTripMetric[];
  stations: StationComparison[];
}

export interface FuelPriceRecord {
  price: number;
  date: string;
  station: string | null;
  liters: number;
  odometer: number;
  totalCost: number;
}

export interface FuelPricePoint {
  date: string;
  odometer: number;
  pricePerLiter: number;
  liters: number;
  totalCost: number;
  station: string | null;
}

export interface FuelPriceStats {
  avgPrice: number | null;
  minPrice: FuelPriceRecord | null;
  maxPrice: FuelPriceRecord | null;
  history: FuelPricePoint[];
}

export interface SeasonalStats {
  hasData: boolean;
  summer: {
    period: string;
    fillCount: number;
    totalLiters: number;
    totalCost: number;
    totalDistanceKm: number;
    avgLPer100Km: number | null;
    avgKmPerLiter: number | null;
    avgCostPer100Km: number | null;
    avgPricePerLiter: number | null;
  };
  winter: {
    period: string;
    fillCount: number;
    totalLiters: number;
    totalCost: number;
    totalDistanceKm: number;
    avgLPer100Km: number | null;
    avgKmPerLiter: number | null;
    avgCostPer100Km: number | null;
    avgPricePerLiter: number | null;
  };
  delta: {
    diffLPer100Km: number | null;
    percentDiff: number | null;
    isWinterHigher: boolean;
  };
}

export interface VehicleTcoSummary {
  vehicleId: string;
  vehicleName: string;
  totalDistanceKm: number;
  totalMonths: number;
  fuelTotal: number;
  serviceTotal: number;
  fixedExpensesTotal: number;
  monthlyFixedCost: number;
  includeFixedExpenses: boolean;
  purchasePrice: number;
  includePurchasePrice: boolean;
  totalCost: number;
  costPerKm: number;
  costPerMonth: number;
  avgLPer100Km: number | null;
  avgKmPerLiter: number | null;
  avgPricePerLiter: number | null;
  fuelTrends: FuelTrendPoint[];
  monthlyBreakdown: MonthlySpendBreakdown[];
  fuelStats?: FuelDetailedStats;
  priceStats?: FuelPriceStats;
  seasonalStats?: SeasonalStats;
}

