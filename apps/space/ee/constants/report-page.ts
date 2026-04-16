export type ReportPageOptions = "phishing" | "inappropriate" | "copyright" | "other";

export const REPORT_PAGE_OPTIONS: { id: ReportPageOptions; title: string; description: string }[] = [
  {
    id: "phishing",
    title: "Phishing or spam",
    description: "Misleading links, scams, deceptive content",
  },
  {
    id: "inappropriate",
    title: "Inappropriate content",
    description: "Violent, explicit, or harmful material",
  },
  {
    id: "copyright",
    title: "Copyright / DMCA takedown",
    description: "Intellectual property infringement",
  },
  {
    id: "other",
    title: "Other violation",
    description: "Describe the issue in this page",
  },
];
