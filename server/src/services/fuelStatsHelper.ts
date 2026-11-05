import {
  FuelDetailedStats,
  FuelTripMetric,
  StationComparison,
} from '../types/tcoTypes.js';

export const KNOWN_BRANDS = [
  'Shell', 'BP', 'Esso', 'Total', 'TotalEnergies', 'Texaco', 'Avia',
  'Tango', 'TinQ', 'Q8', 'Lukoil', 'Circle K', 'Tamoil', 'Argos',
  'Gulf', 'Firezone', 'Makro', 'Fieten', 'Fieten Olie', 'Haan',
  'De Haan', 'Amigo', 'Berkman', 'Kuster', 'NXT', 'Sakko', 'SuperTank', 'Tam'
];

export function computeFuelDetailedStats(
  fuelEntries: any[],
  totalFuelCost: number,
  totalFuelLiters: number,
  cumulativeKmForAvg: number
): FuelDetailedStats {
  const tripMetrics: FuelTripMetric[] = [];
  const tankDistances: number[] = [];
  const stationMap = new Map<string, { totalSpend: number; totalLiters: number; count: number }>();

  for (let i = 0; i < fuelEntries.length; i++) {
    const current = fuelEntries[i];
    let deltaKm: number | null = null;
    let costPer100Km: number | null = null;
    let lPer100Km: number | null = null;

    if (i > 0) {
      const prev = fuelEntries[i - 1];
      const dist = current.odometer - prev.odometer;
      if (dist > 0) {
        deltaKm = dist;
        if (current.is_full_tank && !current.missed_previous) {
          tankDistances.push(dist);
          lPer100Km = Math.round((current.liters / dist) * 100 * 100) / 100;
          costPer100Km = Math.round((current.total_cost / dist) * 100 * 100) / 100;
        }
      }
    }

    // Station detection from notes
    let detectedStation = 'Onbekend / Overig';
    if (current.notes && current.notes.trim()) {
      const noteText = current.notes.trim();
      const found = KNOWN_BRANDS.find((b) => new RegExp(`\\b${b}\\b`, 'i').test(noteText));
      if (found) {
        detectedStation = found;
      } else if (noteText.length <= 30) {
        detectedStation = noteText;
      } else {
        detectedStation = noteText.substring(0, 30) + '...';
      }
    }

    const st = stationMap.get(detectedStation) || { totalSpend: 0, totalLiters: 0, count: 0 };
    st.totalSpend += current.total_cost;
    st.totalLiters += current.liters;
    st.count += 1;
    stationMap.set(detectedStation, st);

    tripMetrics.push({
      date: current.date,
      odometer: current.odometer,
      deltaKm,
      liters: current.liters,
      pricePerLiter: current.price_per_liter,
      totalCost: current.total_cost,
      costPer100Km,
      lPer100Km,
      station: detectedStation,
      is_towing: Boolean(current.is_towing),
    });
  }

  const stations: StationComparison[] = Array.from(stationMap.entries())
    .map(([name, data]) => ({
      name,
      totalSpend: Math.round(data.totalSpend * 100) / 100,
      totalLiters: Math.round(data.totalLiters * 100) / 100,
      avgPricePerLiter: data.totalLiters > 0 ? Math.round((data.totalSpend / data.totalLiters) * 1000) / 1000 : 0,
      fillCount: data.count,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  const avgDistancePerTank =
    tankDistances.length > 0
      ? Math.round(tankDistances.reduce((acc, val) => acc + val, 0) / tankDistances.length)
      : null;

  const maxDistancePerTank =
    tankDistances.length > 0 ? Math.max(...tankDistances) : null;

  const avgCostPer100Km =
    cumulativeKmForAvg > 0
      ? Math.round((totalFuelCost / cumulativeKmForAvg) * 100 * 100) / 100
      : null;

  const normalLPer100List = tripMetrics
    .filter((m) => !m.is_towing && m.lPer100Km !== null && m.lPer100Km > 0)
    .map((m) => m.lPer100Km as number);
  const towingLPer100List = tripMetrics
    .filter((m) => m.is_towing && m.lPer100Km !== null && m.lPer100Km > 0)
    .map((m) => m.lPer100Km as number);

  const avgNormalLPer100Km =
    normalLPer100List.length > 0
      ? Math.round((normalLPer100List.reduce((a, b) => a + b, 0) / normalLPer100List.length) * 100) / 100
      : null;
  const avgTowingLPer100Km =
    towingLPer100List.length > 0
      ? Math.round((towingLPer100List.reduce((a, b) => a + b, 0) / towingLPer100List.length) * 100) / 100
      : null;

  return {
    totalFuelLiters: Math.round(totalFuelLiters * 100) / 100,
    avgDistancePerTank,
    maxDistancePerTank,
    avgCostPer100Km,
    avgNormalLPer100Km,
    avgTowingLPer100Km,
    tripMetrics,
    stations,
  };
}

