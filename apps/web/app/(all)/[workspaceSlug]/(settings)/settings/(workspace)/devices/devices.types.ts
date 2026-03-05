export type TDevice = {
  id: number;
  deviceName: string;
  deviceType: string;
  deviceCode: string;
  appName: string;
  pin: string;
  userId: number | null;
  createdAt: string | null;
  streamingUrl: string;
};

export type TUserOption = {
  id: number;
  label: string;
};

export type TDeviceFormValues = {
  id?: number;
  appName: string;
  deviceName: string;
  deviceType: string;
  userId: number | null;
  deviceCode: string;
  pin: string;
};

export type TDeviceFormMode = "create" | "edit";

export type TDeviceFormOptions = {
  applications: string[];
  deviceTypes: string[];
  users: TUserOption[];
};

export const DEVICE_FORM_DEFAULT_VALUES: TDeviceFormValues = {
  appName: "",
  deviceName: "",
  deviceType: "",
  userId: null,
  deviceCode: "",
  pin: "",
};
