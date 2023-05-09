import { useState } from "react";

// types
import { IAnalyticsParams } from "types";

type Props = {
  datum: any;
  params: IAnalyticsParams;
};

export const CustomTick: React.FC<Props> = ({ datum, params }) => {
  const [isTickHovered, setIsTickHovered] = useState(false);

  const handleTickMouseEnter = () => {
    setIsTickHovered(true);
  };

  const handleTickMouseLeave = () => {
    setIsTickHovered(false);
  };

  const bgWidth = `${datum.value}`.length * 8;

  return (
    <g
      transform={`translate(${datum.x},${datum.y + 4})`}
      className="custom-tick cursor-pointer"
      onMouseEnter={handleTickMouseEnter}
      onMouseLeave={handleTickMouseLeave}
    >
      {isTickHovered && (
        <rect
          x={`-${bgWidth / 2}`}
          y={0}
          rx={3}
          ry={3}
          width={bgWidth}
          height={24}
          fill="rgb(var(--bg-brand-base))"
        />
      )}
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill={`${
          isTickHovered ? "rgb(var(--color-text-base))" : "rgb(var(--color-text-secondary))"
        }`}
        fontSize={11}
        className={`${params.x_axis === "priority" ? "capitalize" : ""}`}
      >
        {isTickHovered ? datum.value : `${datum.value}`.substring(0, 7)}
      </text>
    </g>
  );
};
