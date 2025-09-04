import * as React from "react";
// types
import { ISvgIcons } from "../type";

export const BasicLineChartIcon: React.FC<ISvgIcons> = ({ height = "24", width = "24", className = "", ...rest }) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M23.4108 4.37262C23.7573 4.59952 23.8543 5.06439 23.6274 5.41092L17.0227 15.4981L13.316 11.9598L7.3724 19.9027L0.732432 17.3674C0.345466 17.2197 0.151544 16.7862 0.299295 16.3992C0.447045 16.0123 0.880519 15.8183 1.26748 15.9661L6.84974 18.0975L13.1283 9.70701L16.7549 13.1688L22.3725 4.58925C22.5994 4.24271 23.0643 4.14572 23.4108 4.37262Z"
      fill="currentColor"
    />
  </svg>
);

export const MultiLineLineChartIcon: React.FC<ISvgIcons> = ({
  height = "24",
  width = "24",
  className = "",
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M23.3975 2.3641C23.7487 2.58363 23.8555 3.04635 23.636 3.3976L17.0252 13.9749L13.3179 10.2676L7.37916 18.5818L0.721412 15.9187C0.336825 15.7648 0.149763 15.3284 0.303598 14.9438C0.457433 14.5592 0.893911 14.3721 1.2785 14.526L6.84297 16.7518L13.1265 7.95485L16.7525 11.5809L22.364 2.6026C22.5835 2.25135 23.0462 2.14457 23.3975 2.3641Z"
      fill="currentColor"
      opacity={0.7}
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M6.92254 5.26953L13.2726 12.8895L16.5191 9.64304L22.8529 8.37628C23.259 8.29505 23.6541 8.55846 23.7354 8.96463C23.8166 9.3708 23.5532 9.76592 23.147 9.84716L17.2586 11.0248L13.1718 15.1117L7.29956 8.06502L1.68271 20.4221C1.51131 20.7992 1.06667 20.9659 0.689587 20.7945C0.312501 20.6231 0.145762 20.1785 0.317165 19.8014L6.92254 5.26953Z"
      fill="currentColor"
    />
  </svg>
);
