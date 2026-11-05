import { db } from '../db/database.js';
import {
  TcoFilterOptions,
  FuelTrendPoint,
  MonthlySpendBreakdown,
  FuelDetailedStats,
  FuelPriceStats,
  SeasonalStats,
  VehicleTcoSummary,
} from '../types/tcoTypes.js';
import { computeFuelDetailedStats } from './fuelStatsHelper.js';
import { computeFuelPriceAndSeasonalStats } from './fuelSeasonalHelper.js';
import {
  getVehicleOwnershipStartDate,
  isRecordExcludedFromTco,
} from './tcoOwnershipHelper.js';

export * from '../types/tcoTypes.js';

export class TcoService {
  public static getOwnershipStartDate(vehicle: any): string | null {
    return getVehicleOwnershipStartDate(vehicle);
  }

  public static isExcludedFromTco(record: any, vehicle: any): boolean {
    return isRecordExcludedFromTco(record, vehicle);
  }

  public static calculateTco(options: TcoFilterOptions): VehicleTcoSummary {
    const {
      vehicleId,
      startDate,
      endDate,
      minOdometer,
      maxOdometer,
      includePurchasePrice = false,
      includeFixedExpenses = true,
    } = options;

    const vehicle = db.get<any>('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const ownershipStart = TcoService.getOwnershipStartDate(vehicle);

    // 1. Build fuel query
    let fuelSql = 'SELECT * FROM fuel_entries WHERE vehicle_id = ?';
    const fuelParams: any[] = [vehicleId];
    if (startDate) { fuelSql += ' AND date >= ?'; fuelParams.push(startDate); }
    if (endDate) { fuelSql += ' AND date <= ?'; fuelParams.push(endDate); }
    if (minOdometer !== undefined) { fuelSql += ' AND odometer >= ?'; fuelParams.push(minOdometer); }
    if (maxOdometer !== undefined) { fuelSql += ' AND odometer <= ?'; fuelParams.push(maxOdometer); }
    fuelSql += ' ORDER BY odometer ASC, date ASC';
    const fuelEntries = db.query<any>(fuelSql, fuelParams);

    // 2. Build service query
    let serviceSql = 'SELECT * FROM service_records WHERE vehicle_id = ?';
    const serviceParams: any[] = [vehicleId];
    if (startDate) { serviceSql += ' AND date >= ?'; serviceParams.push(startDate); }
    if (endDate) { serviceSql += ' AND date <= ?'; serviceParams.push(endDate); }
    if (minOdometer !== undefined) { serviceSql += ' AND odometer >= ?'; serviceParams.push(minOdometer); }
    if (maxOdometer !== undefined) { serviceSql += ' AND odometer <= ?'; serviceParams.push(maxOdometer); }
    serviceSql += ' ORDER BY date ASC';
    const allServiceEntries = db.query<any>(serviceSql, serviceParams);
    const serviceEntries = allServiceEntries.filter((s) => !TcoService.isExcludedFromTco(s, vehicle));

    // 3. Fuel economy & trends
    const fuelTrends: FuelTrendPoint[] = [];
    let cumulativeLitersForAvg = 0;
    let cumulativeKmForAvg = 0;
    let totalFuelCost = 0;
    let totalFuelLiters = 0;

    for (let i = 0; i < fuelEntries.length; i++) {
      const current = fuelEntries[i];
      totalFuelCost += current.total_cost;
      totalFuelLiters += current.liters;

      let lPer100Km: number | null = null;
      let kmPerLiter: number | null = null;

      if (i > 0 && current.is_full_tank && !current.missed_previous) {
        const prev = fuelEntries[i - 1];
        const deltaKm = current.odometer - prev.odometer;
        if (deltaKm > 0) {
          lPer100Km = Math.round((current.liters / deltaKm) * 100 * 100) / 100;
          kmPerLiter = Math.round((deltaKm / current.liters) * 100) / 100;
          cumulativeKmForAvg += deltaKm;
          cumulativeLitersForAvg += current.liters;
        }
      }

      const rollingAvg = cumulativeKmForAvg > 0
        ? Math.round((cumulativeLitersForAvg / cumulativeKmForAvg) * 100 * 100) / 100
        : null;

      fuelTrends.push({
        date: current.date,
        odometer: current.odometer,
        liters: current.liters,
        pricePerLiter: current.price_per_liter,
        totalCost: current.total_cost,
        lPer100Km,
        kmPerLiter,
        rollingAvgLPer100Km: rollingAvg,
      });
    }

    // 4. Monthly spend map (fuel & service)
    let totalServiceCost = 0;
    let totalUnscheduledCost = 0;
    let totalRegularCost = 0;
    const monthlyMap = new Map<string, { fuel: number; regular: number; unscheduled: number }>();

    for (const f of fuelEntries) {
      const monthKey = f.date.substring(0, 7);
      const cur = monthlyMap.get(monthKey) || { fuel: 0, regular: 0, unscheduled: 0 };
      cur.fuel += f.total_cost;
      monthlyMap.set(monthKey, cur);
    }

    for (const s of serviceEntries) {
      totalServiceCost += s.cost;
      const monthKey = s.date.substring(0, 7);
      const cur = monthlyMap.get(monthKey) || { fuel: 0, regular: 0, unscheduled: 0 };
      const isUnscheduled =
        s.service_item.toLowerCase().includes('repair') ||
        s.service_item.toLowerCase().includes('damage') ||
        s.service_item.toLowerCase().includes('fault');
      if (isUnscheduled) {
        totalUnscheduledCost += s.cost;
        cur.unscheduled += s.cost;
      } else {
        totalRegularCost += s.cost;
        cur.regular += s.cost;
      }
      monthlyMap.set(monthKey, cur);
    }

    // 5. Distance calculation
    const startOdo = minOdometer !== undefined ? minOdometer : (fuelEntries.length > 0 ? fuelEntries[0].odometer : vehicle.initial_odometer || 0);
    const endOdo = maxOdometer !== undefined ? maxOdometer : (fuelEntries.length > 0 ? fuelEntries[fuelEntries.length - 1].odometer : vehicle.initial_odometer || 0);
    const totalDistanceKm = Math.max(0, endOdo - startOdo);

    // 6. Recurring expenses: query all items and evaluate strictly by active month
    let recurringExpenses: any[] = [];
    try {
      recurringExpenses = db.query<any>('SELECT * FROM recurring_expenses WHERE vehicle_id = ?', [vehicleId]);
    } catch {
      recurringExpenses = [];
    }

    const getExpenseMonthlyRate = (exp: any): number => {
      const amt = Number(exp.amount) || 0;
      if (exp.frequency === 'monthly') return amt;
      if (exp.frequency === 'quarterly') return amt / 3;
      if (exp.frequency === 'yearly') return amt / 12;
      return amt;
    };

    let monthlyFixedCost = 0;
    for (const exp of recurringExpenses) {
      if (exp.is_active === 1 || exp.is_active === true) {
        monthlyFixedCost += getExpenseMonthlyRate(exp);
      }
    }
    monthlyFixedCost = Math.round(monthlyFixedCost * 100) / 100;

    // Determine report timeframe window [windowStartMonth, windowEndMonth]
    const activeDates = [
      ...fuelEntries.map((f: any) => f.date),
      ...serviceEntries.filter((s: any) => Number(s.cost) > 0).map((s: any) => s.date),
    ].sort();

    const nowMonth = new Date().toISOString().substring(0, 7);
    let windowStartMonth = startDate ? startDate.substring(0, 7) : (ownershipStart ? ownershipStart.substring(0, 7) : (activeDates.length > 0 ? activeDates[0].substring(0, 7) : (recurringExpenses.length > 0 ? recurringExpenses.map((e: any) => e.start_date.substring(0, 7)).sort()[0] : nowMonth)));
    let windowEndMonth = endDate ? endDate.substring(0, 7) : (activeDates.length > 0 && activeDates[activeDates.length - 1].substring(0, 7) > nowMonth ? activeDates[activeDates.length - 1].substring(0, 7) : nowMonth);

    if (windowStartMonth > windowEndMonth) {
      windowStartMonth = windowEndMonth;
    }

    const [sYear, sMonth] = windowStartMonth.split('-').map(Number);
    const [eYear, eMonth] = windowEndMonth.split('-').map(Number);
    const totalMonths = Math.max(1, (eYear - sYear) * 12 + (eMonth - sMonth) + 1);

    // Collect all months in range
    const allMonthKeys = new Set<string>(monthlyMap.keys());
    let curY = sYear;
    let curM = sMonth;
    while (curY < eYear || (curY === eYear && curM <= eMonth)) {
      allMonthKeys.add(`${curY}-${String(curM).padStart(2, '0')}`);
      curM++;
      if (curM > 12) { curM = 1; curY++; }
    }

    const calculateFixedForMonth = (monthKey: string): number => {
      let sum = 0;
      for (const exp of recurringExpenses) {
        const expStart = exp.start_date.substring(0, 7);
        let expEnd = '9999-12';
        if (exp.end_date) {
          expEnd = exp.end_date.substring(0, 7);
        } else if (exp.is_active === 0 || exp.is_active === false) {
          expEnd = (exp.updated_at || exp.created_at || exp.start_date).substring(0, 7);
        }
        if (monthKey >= expStart && monthKey <= expEnd) {
          sum += getExpenseMonthlyRate(exp);
        }
      }
      return Math.round(sum * 100) / 100;
    };

    let fixedExpensesTotal = 0;
    const sortedMonths = Array.from(allMonthKeys).sort();
    const monthlyBreakdown: MonthlySpendBreakdown[] = sortedMonths.map((month) => {
      const val = monthlyMap.get(month) || { fuel: 0, regular: 0, unscheduled: 0 };
      const fixedForMonth = calculateFixedForMonth(month);
      if (month >= windowStartMonth && month <= windowEndMonth) {
        fixedExpensesTotal += fixedForMonth;
      }
      const appliedFixed = includeFixedExpenses ? fixedForMonth : 0;
      return {
        month,
        fuel: Math.round(val.fuel * 100) / 100,
        regularMaintenance: Math.round(val.regular * 100) / 100,
        unscheduledRepairs: Math.round(val.unscheduled * 100) / 100,
        fixedExpenses: appliedFixed,
        total: Math.round((val.fuel + val.regular + val.unscheduled + appliedFixed) * 100) / 100,
      };
    });
    fixedExpensesTotal = Math.round(fixedExpensesTotal * 100) / 100;

    // 7. Fuel detailed stats, price history & seasonal statistics
    const fuelStats = computeFuelDetailedStats(fuelEntries, totalFuelCost, totalFuelLiters, cumulativeKmForAvg);
    const { priceStats, seasonalStats } = computeFuelPriceAndSeasonalStats(fuelEntries, totalFuelCost, totalFuelLiters);

    // 8. Overall TCO aggregation
    const purchasePrice = vehicle.purchase_price || 0;
    const effectiveFixed = includeFixedExpenses ? fixedExpensesTotal : 0;
    const totalCost = Math.round(
      (totalFuelCost + totalServiceCost + effectiveFixed + (includePurchasePrice ? purchasePrice : 0)) * 100
    ) / 100;

    const costPerKm = totalDistanceKm > 0 ? Math.round((totalCost / totalDistanceKm) * 100) / 100 : 0;
    const costPerMonth = Math.round((totalCost / totalMonths) * 100) / 100;
    const avgLPer100Km = cumulativeKmForAvg > 0 ? Math.round((cumulativeLitersForAvg / cumulativeKmForAvg) * 100 * 100) / 100 : null;
    const avgKmPerLiter = avgLPer100Km && avgLPer100Km > 0 ? Math.round((100 / avgLPer100Km) * 100) / 100 : null;
    const avgPricePerLiter = totalFuelLiters > 0 ? Math.round((totalFuelCost / totalFuelLiters) * 1000) / 1000 : null;

    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      totalDistanceKm,
      totalMonths,
      fuelTotal: Math.round(totalFuelCost * 100) / 100,
      serviceTotal: Math.round(totalServiceCost * 100) / 100,
      fixedExpensesTotal,
      monthlyFixedCost,
      includeFixedExpenses,
      purchasePrice,
      includePurchasePrice,
      totalCost,
      costPerKm,
      costPerMonth,
      avgLPer100Km,
      avgKmPerLiter,
      avgPricePerLiter,
      fuelTrends,
      monthlyBreakdown,
      fuelStats,
      priceStats,
      seasonalStats,
    };
  }
}
