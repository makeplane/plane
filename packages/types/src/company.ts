export type TCompanyStatus = "active" | "inactive" | "dissolved";
export type TPayCycle = "monthly" | "bi_monthly" | "weekly";
export type TLeaveYearStart = "calendar" | "anniversary";
export type TWeekendPolicy = "exclude" | "include";
export type TCompanyMemberRole = "hr_manager" | "finance_manager" | "director";

export interface ICompanySettings {
  id: string;
  annual_leave_days: number;
  sick_leave_days: number;
  carry_over_max_days: number;
  carry_over_expiry_months: number;
  leave_year_start: TLeaveYearStart;
  weekend_policy: TWeekendPolicy;
  public_holiday_region: string;
  pay_cycle: TPayCycle;
  pay_day: number;
  probation_period_days: number;
  default_notice_period_days: number;
  created_at: string;
  updated_at: string;
}

export interface ICompany {
  id: string;
  name: string;
  trading_name: string;
  registration_number: string;
  tax_id: string;
  vat_number: string;
  company_type: string;
  logo: string;
  country: string;
  city: string;
  registered_address: string;
  billing_address: string;
  status: TCompanyStatus;
  default_currency: string;
  default_timezone: string;
  settings?: ICompanySettings;
  created_at: string;
  updated_at: string;
}

export interface ICompanyMemberRole {
  id: string;
  company: string;
  member: string;
  role: TCompanyMemberRole;
  member_detail: {
    id: string;
    display_name: string;
    email: string;
    avatar: string;
  };
  created_at: string;
}
