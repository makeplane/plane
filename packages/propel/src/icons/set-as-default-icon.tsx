import type { ISvgIcons } from "./type";

export function SetAsDefaultIcon({ className = "text-current", ...rest }: ISvgIcons) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        d="M7.29167 0.625V13.9583M12.0057 2.57762L2.57762 12.0057M13.9583 7.29167H0.625M12.0057 12.0057L2.57762 2.57762"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
