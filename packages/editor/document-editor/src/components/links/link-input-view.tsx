import { LinkViewProps } from "./link-view";

export const LinkInputView = ({
  viewProps,
  switchView,
}: {
  viewProps: LinkViewProps;
  switchView: (view: "LinkPreview" | "LinkEditView" | "LinkInputView") => void;
}) => <p>LinkInputView</p>;
