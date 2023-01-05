export const getPriorityIcon = (priority: string | null, className?: string) => {
  if (!className || className === "") className = "text-xs";

  switch (priority) {
    case "urgent":
      return <span className={`material-symbols-rounded ${className}`}>error</span>;
    case "high":
      return <span className={`material-symbols-rounded ${className}`}>signal_cellular_alt</span>;
    case "medium":
      return (
        <span className={`material-symbols-rounded ${className}`}>signal_cellular_alt_2_bar</span>
      );
    case "low":
      return (
        <span className={`material-symbols-rounded ${className}`}>signal_cellular_alt_1_bar</span>
      );
    default:
      return <span className={`material-symbols-rounded ${className}`}>block</span>;
  }
};
