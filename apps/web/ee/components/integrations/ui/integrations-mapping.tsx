import { ReactNode } from "react";
import Image, { StaticImageData } from "next/image";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { INTEGRATION_TRACKER_ELEMENTS } from "@plane/constants";
import { IProject } from "@plane/types";
import { Button, Logo } from "@plane/ui";
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";

type TIntegrationsMappingProps = {
  entityName: string | ReactNode;
  project: IProject;
  connectorLogo: string | StaticImageData;
  handleEditOpen: () => void;
  handleDeleteOpen: () => void;
};

export const IntegrationsMapping = (props: TIntegrationsMappingProps) => {
  const { entityName, project, connectorLogo, handleEditOpen, handleDeleteOpen } = props;
  return (
    <div className="group relative bg-custom-background-100 border border-custom-border-200 rounded-lg overflow-hidden hover:shadow-sm transition-all duration-200">
      {/* Status indicator strip */}
      <div className="absolute top-0 left-0 h-full w-1 bg-custom-primary-100/30 group-hover:bg-custom-primary-100 transition-colors duration-300" />

      <div className="p-4 pl-5 relative w-full flex items-center">
        <div className="flex-1 flex flex-col gap-2 md:flex-row md:items-center transition-all duration-300 ease-in-out pr-0 md:group-hover:pr-[70px]">
          {/* Project Side */}
          <div className="flex w-full flex-1 min-w-0 items-center gap-2 bg-custom-background-90 py-2 px-3 rounded-lg border border-custom-border-200 shadow-sm transition-all duration-200 group-hover:border-custom-border-300">
            <Image src={PlaneLogo} alt="Plane" className="h-5 w-5 flex-shrink-0 relative" />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="h-4 w-4 flex-shrink-0 bg-custom-background-100 rounded overflow-hidden flex items-center justify-center">
                {project?.logo_props ? (
                  <Logo logo={project?.logo_props} size={12} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-custom-text-100 font-medium bg-custom-primary-100/10 rounded text-[10px]">
                    {project?.name?.charAt(0).toUpperCase() || "P"}
                  </div>
                )}
              </div>
              <span className="text-sm text-custom-text-100 font-medium truncate">{project?.name || "Project"}</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mx-auto bg-gradient-to-r from-custom-background-80 to-custom-background-90 border border-custom-border-200 shadow-sm transition-all duration-200 group-hover:shadow group-hover:border-custom-primary-100/30">
            <ArrowRight className="h-4 w-4 text-custom-text-300 md:rotate-0 rotate-90 group-hover:text-custom-primary-100 transition-colors duration-300" />
          </div>

          {/* Connector */}
          <div className="flex w-full flex-1 min-w-0 items-center gap-2 bg-custom-background-90 py-2 px-3 rounded-lg border border-custom-border-200 shadow-sm transition-all duration-200 group-hover:border-custom-border-300">
            <Image src={connectorLogo} alt="connector logo" className="h-5 w-5 flex-shrink-0 relative" />
            <span className="text-sm text-custom-text-100 font-medium truncate">{entityName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 invisible transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:visible">
          <Button
            variant="neutral-primary"
            size="sm"
            className="h-7 w-7 rounded-md p-0 hover:bg-custom-primary-100/10 hover:text-custom-primary-100 transition-colors"
            onClick={handleEditOpen}
            data-ph-element={INTEGRATION_TRACKER_ELEMENTS.INTEGRATIONS_MAPPING_ENTITY_ITEM_BUTTON}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="neutral-primary"
            size="sm"
            className="h-7 w-7 rounded-md p-0 hover:bg-red-100/10 hover:text-red-500 transition-colors"
            onClick={handleDeleteOpen}
            data-ph-element={INTEGRATION_TRACKER_ELEMENTS.INTEGRATIONS_MAPPING_ENTITY_ITEM_BUTTON}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
