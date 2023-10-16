import React from "react";

import { ISvgIcons } from "./type";

export const RunningIcon: React.FC<ISvgIcons> = ({
  className = "fill-current",
  ...rest
}) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} `}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path d="M4.05 12L3.2625 11.2125L10.9125 3.5625H8.25V5.0625H7.125V2.4375H11.3063C11.4813 2.4375 11.65 2.46875 11.8125 2.53125C11.975 2.59375 12.1188 2.6875 12.2438 2.8125L14.4938 5.04375C14.8563 5.40625 15.275 5.68125 15.75 5.86875C16.225 6.05625 16.725 6.1625 17.25 6.1875V7.3125C16.6 7.2875 15.975 7.16563 15.375 6.94688C14.775 6.72813 14.25 6.3875 13.8 5.925L12.9375 5.0625L10.8 7.2L12.4125 8.8125L7.8375 11.4563L7.275 10.4813L10.575 8.56875L9.0375 7.03125L4.05 12ZM2.25 6.75V5.625H6V6.75H2.25ZM0.75 4.3125V3.1875H4.5V4.3125H0.75ZM14.8125 2.8125C14.45 2.8125 14.1406 2.68438 13.8844 2.42813C13.6281 2.17188 13.5 1.8625 13.5 1.5C13.5 1.1375 13.6281 0.828125 13.8844 0.571875C14.1406 0.315625 14.45 0.1875 14.8125 0.1875C15.175 0.1875 15.4844 0.315625 15.7406 0.571875C15.9969 0.828125 16.125 1.1375 16.125 1.5C16.125 1.8625 15.9969 2.17188 15.7406 2.42813C15.4844 2.68438 15.175 2.8125 14.8125 2.8125ZM2.25 1.875V0.75H6V1.875H2.25Z" />
  </svg>
);
