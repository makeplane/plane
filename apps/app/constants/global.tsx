export const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "urgent":
      return <span className="material-symbols-rounded">signal_cellular_alt</span>;
    case "high":
      return <span className="material-symbols-rounded">signal_cellular_alt_2_bar</span>;
    case "medium":
      return <span className="material-symbols-rounded">signal_cellular_alt_1_bar</span>;
    default:
      return <span>N/A</span>;
  }
};
