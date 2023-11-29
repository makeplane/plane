import { IssueWidget } from "./issue-widget-node";
import { IIssueEmbedConfig } from "./types";

interface IssueWidgetExtensionProps {
  issueEmbedConfig?: IIssueEmbedConfig;
}

export const IssueWidgetExtension = ({
  issueEmbedConfig,
}: IssueWidgetExtensionProps) => IssueWidget.configure({
  issueEmbedConfig,
});
