import React, { useEffect, useState } from "react";

export const CircularProgress = ({ progress }: { progress: number }) => {
  const [circumference, setCircumference] = useState(0);

  useEffect(() => {
    const radius = 40;
    const calcCircumference = 2 * Math.PI * radius;
    setCircumference(calcCircumference);
  }, []);

  const progressAngle = (progress / 100) * 360 >= 360 ? 359.9 : (progress / 100) * 360;
  const progressX = 50 + Math.cos((progressAngle - 90) * (Math.PI / 180)) * 40;
  const progressY = 50 + Math.sin((progressAngle - 90) * (Math.PI / 180)) * 40;

  return (
    <div className="relative h-5 w-5">
      <svg className="absolute top-0 left-0" viewBox="0 0 100 100">
        <circle
          className="stroke-current"
          cx="50"
          cy="50"
          r="40"
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
        />
        <path
          className="fill-current"
          d={`M50 10
            A40 40 0 ${progress > 50 ? 1 : 0} 1 ${progressX} ${progressY}
            L50 50 Z`}
          strokeWidth="12"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
