import type { ISvgIcons } from "./type";

export function ActivityIcon({ className = "text-current", ...rest }: ISvgIcons) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g clipPath="url(#clip0_15681_9387)">
        <path
          d="M14.6666 8.00001H13.0133C12.7219 7.99939 12.4384 8.09421 12.206 8.26999C11.9736 8.44576 11.8053 8.69281 11.7266 8.97334L10.1599 14.5467C10.1498 14.5813 10.1288 14.6117 10.0999 14.6333C10.0711 14.655 10.036 14.6667 9.99992 14.6667C9.96386 14.6667 9.92877 14.655 9.89992 14.6333C9.87107 14.6117 9.85002 14.5813 9.83992 14.5467L6.15992 1.45334C6.14982 1.41872 6.12877 1.38831 6.09992 1.36668C6.07107 1.34504 6.03598 1.33334 5.99992 1.33334C5.96386 1.33334 5.92877 1.34504 5.89992 1.36668C5.87107 1.38831 5.85002 1.41872 5.83992 1.45334L4.27325 7.02668C4.1949 7.30611 4.02751 7.55235 3.79649 7.72802C3.56548 7.90368 3.28347 7.99918 2.99325 8.00001H1.33325"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_15681_9387">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
