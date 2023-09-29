// services images
import GithubLogo from "public/services/github.png";
import JiraLogo from "public/services/jira.png";
import CSVLogo from "public/services/csv.svg";
import ExcelLogo from "public/services/excel.svg";
import JSONLogo from "public/services/json.svg";
import { localized } from "helpers/localization.helper";

export const ROLE = {
  5: localized("Guest"),
  10: localized("Viewer"),
  15: localized("Member"),
  20: localized("Admin"),
};

export const ORGANIZATION_SIZE = [
  localized("Just myself"),
  "2-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
];

export const USER_ROLES = [
  { value: "Product / Project Manager", label: localized("Product / Project Manager") },
  { value: "Development / Engineering", label: localized("Development / Engineering") },
  { value: "Founder / Executive", label: localized("Founder / Executive") },
  { value: "Freelancer / Consultant", label: localized("Freelancer / Consultant") },
  { value: "Marketing / Growth", label: localized("Marketing / Growth") },
  { value: "Sales / Business Development", label: localized("Sales / Business Development") },
  { value: "Support / Operations", label: localized("Support / Operations") },
  { value: "Student / Professor", label: localized("Student / Professor") },
  { value: "Human Resources", label: localized("Human Resources") },
  { value: "Other", label: localized("Other") },
];

export const IMPORTERS_EXPORTERS_LIST = [
  {
    provider: "github",
    type: "import",
    title: "GitHub",
    description: localized("Import issues from GitHub repositories and sync them."),
    logo: GithubLogo,
  },
  {
    provider: "jira",
    type: "import",
    title: "Jira",
    description: localized("Import issues and epics from Jira projects and epics."),
    logo: JiraLogo,
  },
];

export const EXPORTERS_LIST = [
  {
    provider: "csv",
    type: "export",
    title: "CSV",
    description: localized("Export issues to a CSV file."),
    logo: CSVLogo,
  },
  {
    provider: "xlsx",
    type: "export",
    title: "Excel",
    description: localized("Export issues to an Excel file."),
    logo: ExcelLogo,
  },
  {
    provider: "json",
    type: "export",
    title: "JSON",
    description: localized("Export issues to a JSON file."),
    logo: JSONLogo,
  },
];
