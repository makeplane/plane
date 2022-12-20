export const getPriorityIcon = (priority: string, className: string) => {
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
      return null;
  }
};
