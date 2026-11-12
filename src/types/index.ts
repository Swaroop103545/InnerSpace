export interface PolaroidData {
  id?: string;
  image: any;
  caption: string;
  tapeColor: string;
  assetKey?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  titleEmoji?: string;
  body: string;
  backgroundColor: string;
  textColors: {
    date: string;
    title: string;
    body: string;
  };
  polaroid?: PolaroidData;
  mood?: string;
  weather?: string;
  tags?: string[];
  alignment?: 'left' | 'center' | 'right';
  fontFamily?: string;
  isFavorite?: boolean;
  timestamp?: number;
}

export interface JournalSection {
  id: string;
  month: string;
  year: string;
  data: JournalEntry[];
}

export interface DisplayedJournalSection extends JournalSection {
  totalCount: number;
  isExpanded: boolean;
}

export interface Prompt {
  category: string;
  questions: string[];
}

export type DeviceCategory = 'Phone' | 'Tablet' | 'Desktop' | 'TV' | 'Unknown';

export type BatteryChargeState =
  | 'Charging'
  | 'Unplugged'
  | 'Full'
  | 'Not Charging'
  | 'Unknown';

export type CellularGenerationType = '5G' | '4G' | '3G' | '2G' | 'Unknown';

export interface UserDeviceInfo {
  platform: string;
  deviceName: string | null;
  brand: string | null;
  manufacturer: string | null;
  modelName: string | null;
  modelId: string | null;
  designName: string | null;
  productName: string | null;
  deviceType: DeviceCategory;
  deviceYearClass: number | null;
  isPhysicalDevice: boolean;
  totalMemoryBytes: number | null;
  supportedCpuArchitectures: string[] | null;
  osName: string | null;
  osVersion: string | null;
  platformApiLevel: number | null;
  osBuildId: string | null;
  osInternalBuildId: string | null;
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  pixelRatio: number;
  fontScale: number;
  languageTag: string | null;
  languageCode: string | null;
  regionCode: string | null;
  timeZone: string | null;
  uses24HourClock: boolean | null;
  currencyCode: string | null;
  measurementSystem: string | null;
  temperatureUnit: string | null;
  textDirection: 'ltr' | 'rtl' | null;
  networkType: string;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  ipAddress: string | null;
  isAirplaneMode: boolean | null;
  batteryLevelPercent: number | null;
  batteryState: BatteryChargeState;
  lowPowerMode: boolean | null;
  simCarrierName: string | null;
  cellularGeneration: CellularGenerationType;
  simIsoCountryCode: string | null;
  mobileCountryCode: string | null;
  mobileNetworkCode: string | null;
  cellularPermissionGranted: boolean | null;
  collectedAt: number;
}
