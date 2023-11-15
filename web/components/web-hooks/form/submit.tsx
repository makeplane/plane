import { Button } from "@plane/ui";
import { WebHookFormTypes } from "./index";

interface IWebHookSubmitButton {
  isSubmitting: boolean;
  type: WebHookFormTypes;
}

export const WebHookSubmitButton = ({ isSubmitting, type }: IWebHookSubmitButton) => (
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? "processing..." : type === "create" ? "Create webhook" : "Save webhook"}
  </Button>
);
