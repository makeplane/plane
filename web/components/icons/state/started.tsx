type Props = {
  width?: string;
  height?: string;
  className?: string;
  color?: string;
};

export const StateGroupStartedIcon: React.FC<Props> = ({
  width = "20",
  height = "20",
  className,
  color = "#f59e0b",
}) => (
  <svg
    height={height}
    width={width}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    fill="none"
  >
    <circle cx="6" cy="6" r="5.6" stroke={color} strokeWidth="0.8" />
    <circle cx="6" cy="6" r="3.35" stroke={color} strokeWidth="0.8" strokeDasharray="2.4 2.4" />
  </svg>
);
