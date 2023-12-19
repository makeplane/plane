import { IssueWidget } from "src/ui/extensions/widgets/issue-embed-widget/issue-widget-node";
import { IIssueEmbedConfig } from "src/ui/extensions/widgets/issue-embed-widget/types";

interface IssueWidgetExtensionProps {
  issueEmbedConfig?: IIssueEmbedConfig;
}

export const IssueWidgetExtension = ({ issueEmbedConfig }: IssueWidgetExtensionProps) =>
  IssueWidget.configure({
    issueEmbedConfig,
  });
