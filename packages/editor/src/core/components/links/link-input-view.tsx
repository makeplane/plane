// components
import { LinkViewProps } from "@/components/links";

export const LinkInputView = ({}: {
  viewProps: LinkViewProps;
  switchView: (view: "LinkPreview" | "LinkEditView" | "LinkInputView") => void;
}) => <p>LinkInputView</p>;
