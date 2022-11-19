type Value = any;

export type Props = {
  display: string;
  name: string;
  multiple?: boolean;
  options: Array<{ name: string; value: Value }>;
  onChange: (value: Value) => void;
  value: Value;
};
