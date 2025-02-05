import * as React from "react";
import { ISvgIcons } from "./type";
// helpers
import { cn } from "../../helpers";

export const SubscribeIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("stroke-2", className)}
    stroke="currentColor"
    fill="none"
    {...rest}
  >
    <path
      d="M12 7.33398C13.1046 7.33398 14 6.43855 14 5.33398C14 4.22941 13.1046 3.33398 12 3.33398C10.8954 3.33398 10 4.22941 10 5.33398C10 6.43855 10.8954 7.33398 12 7.33398Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 2.66699V3.33366"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 7.33398V8.00065"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.6667 5.33398H14"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 5.33398H9.33337"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 3.33398L13.4133 3.92065"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5867 6.74707L10 7.33374"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 7.33374L13.4133 6.74707"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5867 3.92065L10 3.33398"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.9333 9.93301C13.4667 10.933 14 11.333 14 11.333H2C2 11.333 4 9.99967 4 5.33301C4 3.13301 5.8 1.33301 8 1.33301C8.46667 1.33301 8.86667 1.39967 9.26667 1.53301"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.8667 14C6.97829 14.203 7.14233 14.3722 7.34169 14.4901C7.54106 14.608 7.76842 14.6702 8.00003 14.6702C8.23165 14.6702 8.45901 14.608 8.65837 14.4901C8.85773 14.3722 9.02178 14.203 9.13337 14"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
