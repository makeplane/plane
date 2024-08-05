import { ISSUE_FORM_TAB_INDICES } from "@/constants/issue-modal";

export const getTabIndex = (key: string) => ISSUE_FORM_TAB_INDICES.findIndex((tabIndex) => tabIndex === key) + 1;
