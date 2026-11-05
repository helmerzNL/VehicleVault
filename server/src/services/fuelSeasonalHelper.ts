import {
  FuelPricePoint,
  FuelPriceRecord,
  FuelPriceStats,
  SeasonalStats,
} from '../types/tcoTypes.js';
import { KNOWN_BRANDS } from './fuelStatsHelper.js';

export function computeFuelPriceAndSeasonalStats(
  fuelEntries: any[],
  totalFuelCost: number,
  totalFuelLiters: number
): { priceStats: FuelPriceStats; seasonalStats: SeasonalStats } {
  let minPriceRecord: FuelPriceRecord | null = null;
  let maxPriceRecord: FuelPriceRecord | null = null;
  const priceHistory: FuelPricePoint[] = [];

  for (const current of fuelEntries) {
    if (current.price_per_liter && current.price_per_liter > 0) {
      let stationLabel: string | null = null;
      if (current.notes && current.notes.trim()) {
        const noteText = current.notes.trim();
        const found = KNOWN_BRANDS.find((b) => new RegExp(`\\b${b}\\b`, 'i').test(noteText));
        stationLabel = found || (noteText.length <= 40 ? noteText : noteText.substring(0, 40) + '...');
      }

      const priceRec: FuelPriceRecord = {
        price: current.price_per_liter,
        date: current.date,
        station: stationLabel,
        liters: current.liters,
        odometer: current.odometer,
        totalCost: current.total_cost,
      };

      if (!minPriceRecord || current.price_per_liter < minPriceRecord.price) {
        minPriceRecord = priceRec;
      }
      if (!maxPriceRecord || current.price_per_liter > maxPriceRecord.price) {
        maxPriceRecord = priceRec;
      }

      priceHistory.push({
        date: current.date,
        odometer: current.odometer,
        pricePerLiter: current.price_per_liter,
        liters: current.liters,
        totalCost: current.total_cost,
        station: stationLabel,
      });
    }
  }

  const avgPricePerLiter =
    totalFuelLiters > 0 ? Math.round((totalFuelCost / totalFuelLiters) * 1000) / 1000 : null;

  const priceStats: FuelPriceStats = {
    avgPrice: avgPricePerLiter,
    minPrice: minPriceRecord,
    maxPrice: maxPriceRecord,
    history: priceHistory,
  };

  // Seasonal fuel analysis (Summer: Apr - Sep vs. Winter: Oct - Mar)
  let summerKm = 0;
  let summerLiters = 0;
  let summerCost = 0;
  let summerFills = 0;

  let winterKm = 0;
  let winterLiters = 0;
  let winterCost = 0;
  let winterFills = 0;

  for (let i = 0; i < fuelEntries.length; i++) {
    const current = fuelEntries[i];
    const month = parseInt(current.date.substring(5, 7), 10);
    const isSummer = month >= 4 && month <= 9;

    if (i > 0 && current.is_full_tank && !current.missed_previous) {
      const prev = fuelEntries[i - 1];
      const deltaKm = current.odometer - prev.odometer;
      if (deltaKm > 0) {
        if (isSummer) {
          summerKm += deltaKm;
          summerLiters += current.liters;
          summerCost += current.total_cost;
          summerFills++;
        } else {
          winterKm += deltaKm;
          winterLiters += current.liters;
          winterCost += current.total_cost;
          winterFills++;
        }
      }
    }
  }

  const summerAvgL = summerKm > 0 ? Math.round((summerLiters / summerKm) * 100 * 100) / 100 : null;
  const summerKmPerL = summerAvgL && summerAvgL > 0 ? Math.round((100 / summerAvgL) * 100) / 100 : null;
  const summerCostPer100 = summerKm > 0 ? Math.round((summerCost / summerKm) * 100 * 100) / 100 : null;
  const summerAvgPrice = summerLiters > 0 ? Math.round((summerCost / summerLiters) * 1000) / 1000 : null;

  const winterAvgL = winterKm > 0 ? Math.round((winterLiters / winterKm) * 100 * 100) / 100 : null;
  const winterKmPerL = winterAvgL && winterAvgL > 0 ? Math.round((100 / winterAvgL) * 100) / 100 : null;
  const winterCostPer100 = winterKm > 0 ? Math.round((winterCost / winterKm) * 100 * 100) / 100 : null;
  const winterAvgPrice = winterLiters > 0 ? Math.round((winterCost / winterLiters) * 1000) / 1000 : null;

  let diffLPer100Km: number | null = null;
  let percentDiff: number | null = null;
  let isWinterHigher = false;

  if (summerAvgL !== null && winterAvgL !== null && summerAvgL > 0) {
    diffLPer100Km = Math.round((winterAvgL - summerAvgL) * 100) / 100;
    percentDiff = Math.round((diffLPer100Km / summerAvgL) * 1000) / 10;
    isWinterHigher = diffLPer100Km > 0;
  }

  const seasonalStats: SeasonalStats = {
    hasData: summerFills > 0 || winterFills > 0,
    summer: {
      period: 'Apr - Sep',
      fillCount: summerFills,
      totalLiters: Math.round(summerLiters * 10) / 10,
      totalCost: Math.round(summerCost * 100) / 100,
      totalDistanceKm: summerKm,
      avgLPer100Km: summerAvgL,
      avgKmPerLiter: summerKmPerL,
      avgCostPer100Km: summerCostPer100,
      avgPricePerLiter: summerAvgPrice,
    },
    winter: {
      period: 'Okt - Mrt',
      fillCount: winterFills,
      totalLiters: Math.round(winterLiters * 10) / 10,
      totalCost: Math.round(winterCost * 100) / 100,
      totalDistanceKm: winterKm,
      avgLPer100Km: winterAvgL,
      avgKmPerLiter: winterKmPerL,
      avgCostPer100Km: winterCostPer100,
      avgPricePerLiter: winterAvgPrice,
    },
    delta: {
      diffLPer100Km,
      percentDiff,
      isWinterHigher,
    },
  };

  return { priceStats, seasonalStats };
}

