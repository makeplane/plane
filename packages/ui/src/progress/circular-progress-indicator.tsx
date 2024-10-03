import React from "react";

interface ICircularProgressIndicator {
  size: number;
  percentage: number;
  strokeWidth?: number;
  strokeColor?: string;
  children?: React.ReactNode;
}

export const CircularProgressIndicator: React.FC<ICircularProgressIndicator> = (props) => {
  const { size = 40, percentage = 25, strokeWidth = 6, strokeColor = "stroke-custom-primary-100", children } = props;

  const sqSize = size;
  const radius = (size - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const dashArray = radius * Math.PI * 2;
  const dashOffset = dashArray - (dashArray * percentage) / 100;
  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={viewBox} fill="none">
        <circle
          className="fill-none stroke-custom-background-80"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          style={{ filter: "url(#filter0_bi_377_19141)" }}
        />
        {/* <defs>
          <filter
            id="filter0_bi_377_19141"
            x="-3.57544"
            y="-3.57422"
            width="45.2227"
            height="45.2227"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feGaussianBlur in="BackgroundImageFix" stdDeviation="2" />
            <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_377_19141" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_377_19141" result="shape" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dx="1" dy="1" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.63125 0 0 0 0 0.6625 0 0 0 0 0.75 0 0 0 0.35 0" />
            <feBlend mode="normal" in2="shape" result="effect2_innerShadow_377_19141" />
          </filter>
        </defs> */}
        <circle
          className={`fill-none ${strokeColor}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            strokeDasharray: dashArray,
            strokeDashoffset: dashOffset,
          }}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {children}
      </div>
    </div>
  );
};
