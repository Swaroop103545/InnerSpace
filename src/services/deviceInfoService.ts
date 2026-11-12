import { Dimensions, PixelRatio, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import * as Network from 'expo-network';
import * as Battery from 'expo-battery';
import * as Cellular from 'expo-cellular';
import {
  BatteryChargeState,
  CellularGenerationType,
  DeviceCategory,
  UserDeviceInfo,
} from '../types';

const DEVICE_TYPE_LABELS: Record<Device.DeviceType, DeviceCategory> = {
  [Device.DeviceType.PHONE]: 'Phone',
  [Device.DeviceType.TABLET]: 'Tablet',
  [Device.DeviceType.DESKTOP]: 'Desktop',
  [Device.DeviceType.TV]: 'TV',
  [Device.DeviceType.UNKNOWN]: 'Unknown',
};

const BATTERY_STATE_LABELS: Record<Battery.BatteryState, BatteryChargeState> = {
  [Battery.BatteryState.CHARGING]: 'Charging',
  [Battery.BatteryState.UNPLUGGED]: 'Unplugged',
  [Battery.BatteryState.FULL]: 'Full',
  [Battery.BatteryState.NOT_CHARGING]: 'Not Charging',
  [Battery.BatteryState.UNKNOWN]: 'Unknown',
};

const CELLULAR_GEN_LABELS: Record<
  Cellular.CellularGeneration,
  CellularGenerationType
> = {
  [Cellular.CellularGeneration.CELLULAR_5G]: '5G',
  [Cellular.CellularGeneration.CELLULAR_4G]: '4G',
  [Cellular.CellularGeneration.CELLULAR_3G]: '3G',
  [Cellular.CellularGeneration.CELLULAR_2G]: '2G',
  [Cellular.CellularGeneration.UNKNOWN]: 'Unknown',
};

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function safeAsync<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function readLocaleSnapshot() {
  try {
    const locales = Localization.getLocales();
    const calendars = Localization.getCalendars();
    const primaryLocale = locales[0];
    const primaryCalendar = calendars[0];

    return {
      languageTag: primaryLocale?.languageTag ?? null,
      languageCode: primaryLocale?.languageCode ?? null,
      regionCode:
        primaryLocale?.regionCode ?? primaryLocale?.languageRegionCode ?? null,
      timeZone:
        primaryCalendar?.timeZone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone ??
        null,
      uses24HourClock: primaryCalendar?.uses24hourClock ?? null,
      currencyCode: primaryLocale?.currencyCode ?? null,
      measurementSystem: primaryLocale?.measurementSystem ?? null,
      temperatureUnit: primaryLocale?.temperatureUnit ?? null,
      textDirection: primaryLocale?.textDirection ?? null,
    };
  } catch {
    return {
      languageTag: null,
      languageCode: null,
      regionCode: null,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
      uses24HourClock: null,
      currencyCode: null,
      measurementSystem: null,
      temperatureUnit: null,
      textDirection: null,
    };
  }
}

/**
 * Formats a byte count (e.g. total device RAM) into a human-readable GB string.
 */
export function formatBytesToGB(bytes: number | null): string {
  if (bytes === null || bytes <= 0) return 'Unavailable';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
}

/**
 * Builds a concise one-line summary of the user's device for settings rows.
 */
export function formatDeviceSummary(info: UserDeviceInfo): string {
  const deviceLabel =
    [info.brand, info.modelName].filter(Boolean).join(' ') ||
    info.deviceName ||
    info.platform;
  const osLabel = [info.osName, info.osVersion].filter(Boolean).join(' ');
  const netLabel =
    info.simCarrierName ||
    (info.isConnected === false
      ? 'Offline'
      : info.networkType !== 'UNKNOWN'
        ? info.networkType
        : null);

  return [deviceLabel, osLabel, netLabel].filter(Boolean).join(' · ');
}

export interface CollectDeviceInfoOptions {
  requestCellularPermission?: boolean;
}

/**
 * Collects device hardware, OS, display, locale, network, battery, and GSM/SIM
 * metadata safely across Android, iOS, and Web without undefined fields.
 */
export async function collectUserDeviceInfo(
  options: CollectDeviceInfoOptions = {}
): Promise<UserDeviceInfo> {
  let cellularPermissionGranted: boolean | null = null;
  if (Platform.OS === 'android') {
    const initialPerm = await safeAsync(
      () => Cellular.getPermissionsAsync(),
      null
    );
    if (
      options.requestCellularPermission &&
      initialPerm &&
      !initialPerm.granted &&
      initialPerm.canAskAgain
    ) {
      const requested = await safeAsync(
        () => Cellular.requestPermissionsAsync(),
        initialPerm
      );
      cellularPermissionGranted = requested.granted;
    } else if (initialPerm) {
      cellularPermissionGranted = initialPerm.granted;
    }
  }

  const [
    resolvedDeviceType,
    networkState,
    ipAddress,
    airplaneMode,
    powerState,
    simCarrierRaw,
    cellularGen,
    simIsoRaw,
    mccRaw,
    mncRaw,
  ] = await Promise.all([
    safeAsync(
      () => Device.getDeviceTypeAsync(),
      Device.deviceType ?? Device.DeviceType.UNKNOWN
    ),
    safeAsync<Network.NetworkState>(() => Network.getNetworkStateAsync(), {
      type: Network.NetworkStateType.UNKNOWN,
      isConnected: undefined,
      isInternetReachable: undefined,
    }),
    safeAsync<string | null>(() => Network.getIpAddressAsync(), null),
    Platform.OS === 'android'
      ? safeAsync<boolean | null>(
          () => Network.isAirplaneModeEnabledAsync(),
          null
        )
      : Promise.resolve(null),
    safeAsync<Battery.PowerState | null>(
      () => Battery.getPowerStateAsync(),
      null
    ),
    safeAsync<string | null>(() => Cellular.getCarrierNameAsync(), null),
    safeAsync<Cellular.CellularGeneration>(
      () => Cellular.getCellularGenerationAsync(),
      Cellular.CellularGeneration.UNKNOWN
    ),
    safeAsync<string | null>(() => Cellular.getIsoCountryCodeAsync(), null),
    safeAsync<string | null>(() => Cellular.getMobileCountryCodeAsync(), null),
    safeAsync<string | null>(() => Cellular.getMobileNetworkCodeAsync(), null),
  ]);

  const screen = Dimensions.get('screen');
  const windowDims = Dimensions.get('window');
  const locale = readLocaleSnapshot();

  const batteryLevelPercent =
    powerState &&
    typeof powerState.batteryLevel === 'number' &&
    powerState.batteryLevel >= 0
      ? Math.round(powerState.batteryLevel * 100)
      : null;

  const normalizedIp =
    ipAddress && ipAddress !== '0.0.0.0' ? ipAddress : null;

  return {
    platform: Platform.OS,
    deviceName: Device.deviceName ?? null,
    brand: Device.brand ?? null,
    manufacturer: Device.manufacturer ?? null,
    modelName: Device.modelName ?? null,
    modelId: Device.modelId ?? null,
    designName: Device.designName ?? null,
    productName: Device.productName ?? null,
    deviceType:
      DEVICE_TYPE_LABELS[resolvedDeviceType] ?? 'Unknown',
    deviceYearClass: Device.deviceYearClass ?? null,
    isPhysicalDevice: Boolean(Device.isDevice),
    totalMemoryBytes: Device.totalMemory ?? null,
    supportedCpuArchitectures: Device.supportedCpuArchitectures ?? null,
    osName: Device.osName ?? null,
    osVersion: Device.osVersion ?? null,
    platformApiLevel: Device.platformApiLevel ?? null,
    osBuildId: Device.osBuildId ?? null,
    osInternalBuildId: Device.osInternalBuildId ?? null,
    screenWidth: Math.round(screen.width),
    screenHeight: Math.round(screen.height),
    windowWidth: Math.round(windowDims.width),
    windowHeight: Math.round(windowDims.height),
    pixelRatio: Number(PixelRatio.get().toFixed(2)),
    fontScale: Number(PixelRatio.getFontScale().toFixed(2)),
    ...locale,
    networkType: String(networkState.type ?? Network.NetworkStateType.UNKNOWN),
    isConnected:
      typeof networkState.isConnected === 'boolean'
        ? networkState.isConnected
        : null,
    isInternetReachable:
      typeof networkState.isInternetReachable === 'boolean'
        ? networkState.isInternetReachable
        : null,
    ipAddress: normalizedIp,
    isAirplaneMode: airplaneMode,
    batteryLevelPercent,
    batteryState:
      powerState !== null
        ? (BATTERY_STATE_LABELS[powerState.batteryState] ?? 'Unknown')
        : 'Unknown',
    lowPowerMode:
      powerState && typeof powerState.lowPowerMode === 'boolean'
        ? powerState.lowPowerMode
        : null,
    simCarrierName: normalizeText(simCarrierRaw),
    cellularGeneration: CELLULAR_GEN_LABELS[cellularGen] ?? 'Unknown',
    simIsoCountryCode: normalizeText(simIsoRaw),
    mobileCountryCode: normalizeText(mccRaw),
    mobileNetworkCode: normalizeText(mncRaw),
    cellularPermissionGranted,
    collectedAt: Date.now(),
  };
}

