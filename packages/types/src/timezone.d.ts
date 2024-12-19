export type TTimezoneObject = {
  utc_offset: string;
  gmt_offset: string;
  label: string;
  value: string;
};

export type TTimezones = { timezones: TTimezoneObject[] };
