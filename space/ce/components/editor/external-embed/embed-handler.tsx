import { NodeViewProps } from "@tiptap/react";

interface EmbedHandlerProps extends NodeViewProps {
  anchor?: string;
}
export const EmbedHandler: React.FC<EmbedHandlerProps> = () => <div />;
