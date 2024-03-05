import React from "react";
import { ColorResult, TwitterPicker } from "react-color";

type TColorPickerProps = {
  colors?: string[];
  onChange: (value: ColorResult) => void;
  value?: string;
};

const DEFAULT_COLORS = [
  "#ff6900",
  "#fcb900",
  "#7bdcb5",
  "#00d084",
  "#8ed1fc",
  "#0693e3",
  "#abb8c3",
  "#eb144c",
  "#f78da7",
  "#9900ef",
];

export const ColorPicker: React.FC<TColorPickerProps> = (props) => {
  const { colors, onChange, value } = props;

  return <TwitterPicker colors={colors ?? DEFAULT_COLORS} color={value} onChange={onChange} />;
};
