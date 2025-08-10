import { FileKey2 } from "lucide-react";

export const CustomAttachmentFlaggedState = () => (
  <a
    href="https://plane.so/pro"
    className="py-3 px-2 rounded-lg bg-custom-background-90 hover:bg-custom-background-80 border border-custom-border-300 flex items-start gap-2 transition-colors"
    contentEditable={false}
    target="_blank"
    rel="noopener noreferrer"
  >
    <span className="flex-shrink-0 mt-0.5 size-4 grid place-items-center">
      <FileKey2 className="size-4" />
    </span>
    <p className="not-prose text-sm">
      {/* {t("attachmentComponent.upgrade.description")} */}
      Upgrade your plan to view this attachment.
    </p>
  </a>
);
