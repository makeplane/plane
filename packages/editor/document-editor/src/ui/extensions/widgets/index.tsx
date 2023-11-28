import { IssueWidget } from "./issue-widget";
import { IIssueEmbedConfig } from "./types";

interface IssueWidgetExtensionProps {
  issueEmbedConfig?: IIssueEmbedConfig;
}

export const IssueWidgetExtension = ({
  issueEmbedConfig,
}: IssueWidgetExtensionProps) => {
  return IssueWidget.configure({
    issueEmbedConfig,
  });
};
