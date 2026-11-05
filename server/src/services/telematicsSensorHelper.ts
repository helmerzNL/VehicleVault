import { logger } from '../utils/logger.js';

export interface HaSensorItem {
  entity_id: string;
  name: string;
  state: string;
  unit_of_measurement?: string;
  is_likely_odometer?: boolean;
}

export async function fetchHaSensorsList(baseUrl: string, token: string): Promise<HaSensorItem[]> {
  try {
    const res = await fetch(`${baseUrl}/api/states`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const states = (await res.json()) as any[];
    if (!Array.isArray(states)) return [];

    const sensors: HaSensorItem[] = [];

    for (const item of states) {
      if (!item?.entity_id?.startsWith('sensor.')) continue;

      const entityId = item.entity_id.toLowerCase();
      const friendlyName = item.attributes?.friendly_name || item.entity_id;
      const nameLower = friendlyName.toLowerCase();
      const unit = item.attributes?.unit_of_measurement;

      const isLikelyOdo =
        entityId.includes('odometer') ||
        entityId.includes('odo') ||
        entityId.includes('mileage') ||
        nameLower.includes('odometer') ||
        nameLower.includes('teller') ||
        nameLower.includes('kilometerstand') ||
        unit === 'km' ||
        unit === 'mi';

      sensors.push({
        entity_id: item.entity_id,
        name: friendlyName,
        state: String(item.state ?? ''),
        unit_of_measurement: unit,
        is_likely_odometer: isLikelyOdo,
      });
    }

    sensors.sort((a, b) => {
      if (a.is_likely_odometer && !b.is_likely_odometer) return -1;
      if (!a.is_likely_odometer && b.is_likely_odometer) return 1;
      return a.name.localeCompare(b.name);
    });

    return sensors;
  } catch (err: any) {
    logger.error({ err: err?.message }, 'Telematics: fetchHaSensorsList error');
    return [];
  }
}

