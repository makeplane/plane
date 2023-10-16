import React from "react";

type Props = {
  maxValue?: number;
  value?: number;
  radius?: number;
  strokeWidth?: number;
  activeStrokeColor?: string;
  inactiveStrokeColor?: string;
};

export const ProgressBar: React.FC<Props> = ({
  maxValue = 0,
  value = 0,
  radius = 8,
  strokeWidth = 2,
  activeStrokeColor = "#3e98c7",
  inactiveStrokeColor = "#ddd",
}) => {
  // PIE Calc Fn
  const generatePie = (value: any) => {
    const x = radius - Math.cos((2 * Math.PI) / (100 / value)) * radius;
    const y = radius + Math.sin((2 * Math.PI) / (100 / value)) * radius;
    const long = value <= 50 ? 0 : 1;
    const d = `M${radius} ${radius} L${radius} ${0} A${radius} ${radius} 0 ${long} 1 ${y} ${x} Z`;

    return d;
  };

  // ----  PIE Area Calc  --------
  const calculatePieValue = (numberOfBars: any) => {
    const angle = 360 / numberOfBars;
    const pieValue = Math.floor(angle / 4);
    return pieValue < 1 ? 1 : Math.floor(angle / 4);
  };

  // ----  PIE Render Fn --------
  const renderPie = (i: any) => {
    const DIRECTION = -1;
    // Rotation Calc
    const primaryRotationAngle = (maxValue - 1) * (360 / maxValue);
    const rotationAngle =
      -1 * DIRECTION * primaryRotationAngle +
      i * DIRECTION * primaryRotationAngle;
    const rotationTransformation = `rotate(${rotationAngle}, ${radius}, ${radius})`;
    const pieValue = calculatePieValue(maxValue);
    const dValue = generatePie(pieValue);
    const fillColor =
      value > 0 && i <= value ? activeStrokeColor : inactiveStrokeColor;

    return (
      <path
        style={{ opacity: i === 0 ? 0 : 1 }}
        key={i}
        d={dValue}
        fill={fillColor}
        transform={rotationTransformation}
      />
    );
  };

  // combining the Pies
  const renderOuterCircle = () =>
    [...Array(maxValue + 1)].map((e, i) => renderPie(i));

  return (
    <svg width={radius * 2} height={radius * 2}>
      {renderOuterCircle()}
      <circle
        r={radius - strokeWidth}
        cx={radius}
        cy={radius}
        className="progress-bar"
      />
    </svg>
  );
};
