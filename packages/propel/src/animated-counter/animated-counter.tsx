import { useState, useEffect } from "react";
import { cn } from "../utils";

export interface AnimatedCounterProps {
  count: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-xs h-4 w-4",
  md: "text-sm h-5 w-5",
  lg: "text-base h-6 w-6",
};

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ count, className, size = "md" }) => {
  // states
  const [displayCount, setDisplayCount] = useState(count);
  const [prevCount, setPrevCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (count !== prevCount) {
      setDirection(count > prevCount ? "up" : "down");
      setIsAnimating(true);
      setAnimationKey((prev) => prev + 1);

      // Update the display count immediately, animation will show the transition
      setDisplayCount(count);

      // End animation after CSS transition
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setDirection(null);
        setPrevCount(count);
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [count, prevCount]);

  const sizeClass = sizeClasses[size];

  return (
    <div className={cn("relative inline-flex items-center justify-center overflow-hidden", sizeClass)}>
      {/* Previous number sliding out */}
      {isAnimating && (
        <span
          key={`prev-${animationKey}`}
          className={cn(
            "absolute inset-0 flex items-center justify-center font-medium",
            "animate-[slideOut_0.25s_ease-out_forwards]",
            direction === "up" && "[--slide-out-dir:-100%]",
            direction === "down" && "[--slide-out-dir:100%]",
            sizeClass
          )}
          style={{
            animation:
              direction === "up"
                ? "slideOut 0.25s ease-out forwards, fadeOut 0.25s ease-out forwards"
                : "slideOutDown 0.25s ease-out forwards, fadeOut 0.25s ease-out forwards",
          }}
        >
          {prevCount}
        </span>
      )}

      {/* New number sliding in */}
      <span
        key={`current-${animationKey}`}
        className={cn(
          "flex items-center justify-center font-medium",
          isAnimating && "animate-[slideIn_0.25s_ease-out_forwards]",
          !isAnimating && "opacity-100",
          sizeClass,
          className
        )}
        style={
          isAnimating
            ? {
                animation:
                  direction === "up"
                    ? "slideInFromBottom 0.25s ease-out forwards"
                    : "slideInFromTop 0.25s ease-out forwards",
              }
            : undefined
        }
      >
        {displayCount}
      </span>
    </div>
  );
};
