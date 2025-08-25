// Base option interface
export interface BaseOption {
  value: string;
  label: string;
  description?: string;
}

// Specific option types
export interface SelectOption extends BaseOption {
  disabled?: boolean;
}

export interface UserOption extends BaseOption {
  avatar?: string;
  email?: string;
  isActive?: boolean;
}
