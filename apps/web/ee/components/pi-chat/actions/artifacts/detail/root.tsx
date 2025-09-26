import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import Link from "next/link";
import { Briefcase, ExternalLink } from "lucide-react";
import { PiChatEditorWithRef } from "@plane/editor";
import { Card, getButtonStyling, Logo } from "@plane/ui";
import { cn } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { Properties } from "../preview-cards/properties";
import { Header } from "./header";
export const PiChatArtifactsRoot = observer(() => {
  // states
  const {
    isPiArtifactsDrawerOpen: artifactId,
    artifactsStore: { getArtifact },
  } = usePiChat();
  const artifactsData = artifactId && getArtifact(artifactId);
  if (!artifactsData) return null;
  const properties = {
    ...artifactsData?.parameters?.properties,
    project: artifactsData?.parameters?.project,
    showContainer: true,
  };
  return (
    <div
      className={cn(
        "transform transition-all duration-300 ease-in-out overflow-x-hidden bg-custom-background-90",
        "rounded-lg border border-custom-border-200 h-full max-w-[900px]",
        artifactId
          ? "translate-x-0 absolute top-0 right-0 w-auto lg:relative lg:w-[900px]  mr-2 z-30"
          : "px-0 translate-x-[100%] w-0 border-none"
      )}
    >
      <div data-prevent-outside-click className={cn("flex flex-col h-full rounded-lg bg-custom-background-90")}>
        {/* Header */}
        <Header artifact={artifactsData} />
        <div className="flex-1 flex justify-center items-center px-4">
          <Card className="max-w-[700px] rounded-xl shadow-lg p-4 flex flex-col gap-4">
            {/* icon */}
            {artifactsData.parameters?.logo_props && (
              <div className="flex flex-col gap-2">
                <div className="font-semibold text-sm text-custom-text-350 capitalize">
                  {artifactsData.artifact_type} icon
                </div>
                <div className="flex h-8  w-8 items-center justify-center rounded-md bg-custom-background-80">
                  <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                    {artifactsData.parameters?.logo_props ? (
                      <Logo logo={artifactsData.parameters?.logo_props} size={16} />
                    ) : (
                      <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                        <Briefcase className="h-4 w-4" />
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
            {/* title */}
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-sm text-custom-text-350 capitalize">
                {artifactsData.artifact_type} title
              </div>
              <div className="bg-custom-background-80 rounded-lg py-2 px-4 text-base font-medium">
                {artifactsData.parameters?.name || "Unknown"}
              </div>
            </div>
            {/* description */}
            {artifactsData.parameters?.description && (
              <div className="flex flex-col gap-2">
                <div className="font-semibold text-sm text-custom-text-350">Description</div>
                <div className="bg-custom-background-80 rounded-lg py-2 px-4 text-sm text-custom-text-200">
                  <PiChatEditorWithRef
                    editable={false}
                    content={artifactsData.parameters?.description}
                    editorClass="!break-words"
                  />
                </div>
              </div>
            )}
            {/* properties */}
            {!isEmpty(properties) && (
              <div className="flex flex-col">
                <div className="font-semibold text-sm text-custom-text-350">Properties</div>
                <Properties {...properties} />
              </div>
            )}
          </Card>
        </div>
        <div className="flex justify-center bg-custom-background-100 w-full">
          {artifactsData.is_executed && artifactsData.success ? (
            <div className="flex w-full md:w-[700px] justify-between items-center p-4">
              <div className="flex flex-col items-start gap-2">
                <div className="text-base font-medium">
                  This {artifactsData.artifact_type} has already been {artifactsData.action}d
                </div>
                <div className="text-sm text-custom-text-300">You are viewing the preview version</div>
              </div>
              {artifactsData.entity_url && (
                <Link
                  target="_blank"
                  className={cn("flex items-center gap-2 text-sm font-medium", getButtonStyling("primary", "md"))}
                  href={artifactsData.entity_url}
                >
                  <ExternalLink className="size-3" />
                  <div>Open {artifactsData.artifact_type}</div>
                </Link>
              )}
            </div>
          ) : (
            artifactsData.is_executed && (
              <div className="flex justify-center bg-custom-background-100 w-full">
                <div className="flex w-full justify-center items-center p-4">
                  <div className="flex flex-col items-start gap-2">
                    <div className="text-base font-medium">Action could not be executed. Please try again.</div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
});
