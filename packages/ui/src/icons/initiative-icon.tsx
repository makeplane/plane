import * as React from "react";

type Props = {
  className?: string;
  width?: string | number;
  height?: string | number;
  color?: string;
};

export const InitiativeIcon: React.FC<Props> = ({ width = "16", height = "16", className }) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.00026 0.5C6.78995 0.499728 5.61335 0.898686 4.65282 1.63504C3.69228 2.37139 3.00145 3.40402 2.68741 4.57287C2.37336 5.74172 2.45363 6.98153 2.91577 8.10013C3.37792 9.21873 4.19613 10.1537 5.24359 10.76C5.70093 11.0253 5.98693 11.432 5.99959 11.842C6.00309 11.9518 6.04266 12.0574 6.11219 12.1425C6.18172 12.2276 6.27734 12.2874 6.38426 12.3127C6.61893 12.368 6.85759 12.4113 7.10026 12.4427C7.31559 12.47 7.50026 12.2973 7.50026 12.08V8.97267C7.2896 8.9495 7.08086 8.91141 6.87559 8.85867C6.81199 8.84229 6.75224 8.81356 6.69974 8.77409C6.64724 8.73462 6.60303 8.68521 6.56963 8.62866C6.53624 8.57211 6.5143 8.50953 6.50509 8.4445C6.49587 8.37948 6.49956 8.31327 6.51593 8.24967C6.5323 8.18606 6.56104 8.12631 6.6005 8.07381C6.63997 8.02131 6.68939 7.9771 6.74594 7.9437C6.80249 7.91031 6.86507 7.88837 6.93009 7.87916C6.99512 7.86994 7.06132 7.87363 7.12493 7.89C7.6991 8.03798 8.30142 8.03798 8.87559 7.89C8.93984 7.87149 9.00714 7.86605 9.07353 7.874C9.13991 7.88196 9.20402 7.90315 9.26207 7.93631C9.32012 7.96948 9.37093 8.01395 9.4115 8.0671C9.45206 8.12025 9.48155 8.18099 9.49823 8.24574C9.5149 8.31048 9.51843 8.37791 9.50859 8.44404C9.49875 8.51017 9.47575 8.57366 9.44094 8.63074C9.40614 8.68782 9.36024 8.73735 9.30596 8.77638C9.25168 8.81542 9.19012 8.84317 9.12493 8.858C8.91968 8.91097 8.71094 8.94929 8.50026 8.97267V12.0793C8.50026 12.2973 8.68493 12.47 8.90026 12.4427C9.14293 12.4113 9.38159 12.368 9.61626 12.3127C9.72318 12.2874 9.8188 12.2276 9.88833 12.1425C9.95786 12.0574 9.99743 11.9518 10.0009 11.842C10.0143 11.432 10.2996 11.0253 10.7569 10.76C11.8044 10.1537 12.6226 9.21873 13.0848 8.10013C13.5469 6.98153 13.6272 5.74172 13.3131 4.57287C12.9991 3.40402 12.3082 2.37139 11.3477 1.63504C10.3872 0.898686 9.21057 0.499728 8.00026 0.5Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.00869 13.2652C6.02093 13.2006 6.04577 13.1391 6.08178 13.0842C6.11779 13.0293 6.16427 12.982 6.21856 12.945C6.27286 12.9081 6.3339 12.8822 6.39821 12.8688C6.46252 12.8554 6.52883 12.8549 6.59335 12.8672C7.52284 13.0435 8.4772 13.0435 9.40669 12.8672C9.472 12.8528 9.53953 12.8517 9.60528 12.8638C9.67104 12.876 9.73368 12.9013 9.78951 12.9381C9.84533 12.9749 9.8932 13.0226 9.93028 13.0782C9.96736 13.1339 9.9929 13.1964 10.0054 13.2621C10.0179 13.3278 10.0171 13.3953 10.003 13.4607C9.98891 13.5261 9.96186 13.588 9.92344 13.6427C9.88503 13.6974 9.83602 13.7439 9.77932 13.7794C9.72262 13.8148 9.65939 13.8386 9.59335 13.8492C8.54053 14.049 7.45951 14.049 6.40669 13.8492C6.2765 13.8244 6.16146 13.749 6.08683 13.6395C6.0122 13.53 5.9841 13.3954 6.00869 13.2652ZM6.50269 14.8945C6.50951 14.8292 6.52913 14.7659 6.56043 14.7081C6.59173 14.6504 6.6341 14.5994 6.68511 14.558C6.73612 14.5167 6.79478 14.4858 6.85774 14.4671C6.92069 14.4484 6.98671 14.4423 7.05202 14.4492C7.6823 14.515 8.31774 14.515 8.94802 14.4492C9.07992 14.4354 9.2119 14.4745 9.31492 14.5581C9.41794 14.6416 9.48356 14.7626 9.49735 14.8945C9.51115 15.0264 9.47197 15.1584 9.38846 15.2614C9.30494 15.3644 9.18392 15.43 9.05202 15.4438C8.3526 15.517 7.64744 15.517 6.94802 15.4438C6.88271 15.437 6.81938 15.4174 6.76165 15.3861C6.70392 15.3548 6.65292 15.3124 6.61157 15.2614C6.57021 15.2104 6.53931 15.1517 6.52063 15.0888C6.50195 15.0258 6.49585 14.9598 6.50269 14.8945Z"
      fill="currentColor"
    />
  </svg>
);
