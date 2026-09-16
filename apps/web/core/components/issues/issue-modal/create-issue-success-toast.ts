import type { TOAST_TYPE } from "@plane/propel/toast";

type TCreateIssueSuccessToast = {
  type: TOAST_TYPE.SUCCESS;
  title: string;
  message: string;
};

export const buildCreateIssueSuccessToast = (title: string, message: string): TCreateIssueSuccessToast => ({
  type: "success" as TOAST_TYPE.SUCCESS,
  title,
  message,
});
