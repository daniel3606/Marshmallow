import { Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";

export interface SelectedItem {
  id: string;
  type: "application" | "category" | "webDomain";
  label: string;
  index: number;
}

interface ScreenTimeModuleType {
  /** Returns true on iOS 16+ */
  isAvailable(): boolean;

  /** "notDetermined" | "denied" | "approved" | "unavailable" | "unknown" */
  getAuthorizationStatus(): string;

  /** Triggers the system authorization prompt for Screen Time / Family Controls */
  requestAuthorization(): Promise<boolean>;

  /**
   * Opens Apple's FamilyActivityPicker.
   * Resolves with an array of opaque item descriptors, or null if cancelled.
   */
  openAppPicker(): Promise<SelectedItem[] | null>;

  /** Returns the persisted selection without opening the picker */
  getSelectedItems(): Promise<SelectedItem[]>;

  /** Applies ManagedSettings shield to the items matching `itemIds` */
  applyBlocking(itemIds: string[]): Promise<void>;

  /** Shields every item in the current selection */
  blockAll(): Promise<void>;

  /** Removes all shields */
  clearBlocking(): Promise<void>;

  /** Wipes the persisted selection and removes all shields */
  clearSelection(): Promise<void>;
}

let ScreenTimeModule: ScreenTimeModuleType | null = null;

if (Platform.OS === "ios") {
  try {
    ScreenTimeModule =
      requireNativeModule<ScreenTimeModuleType>("ScreenTimeModule");
  } catch {
    console.warn(
      "ScreenTimeModule native module not found. " +
        "This is expected on the Simulator — Screen Time APIs require a real device."
    );
  }
}

export default ScreenTimeModule;
