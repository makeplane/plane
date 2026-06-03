import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { IIssueDisplayProperties } from "@plane/types";
import { useProjectCustomFields } from "@/plane-web/hooks/use-project-custom-fields";

type Props = {
  displayProperties: IIssueDisplayProperties;
  handleUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
};

export const FilterDisplayCustomFields = observer(function FilterDisplayCustomFields(props: Props) {
  const { displayProperties, handleUpdate } = props;
  const { workspaceSlug, projectId: routerProjectId } = useParams();
  const projectId = routerProjectId?.toString();

  const { properties, isLoading } = useProjectCustomFields(workspaceSlug?.toString(), projectId);

  if (!projectId || !workspaceSlug) return null;

  if (isLoading) {
    return (
      <div className="mt-2 border-t border-subtle pt-2">
        <p className="text-11 text-tertiary">Loading custom fields…</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="mt-2 border-t border-subtle pt-2">
        <p className="mb-1 text-11 font-medium text-secondary">Custom fields on cards</p>
        <p className="text-11 text-tertiary">
          Create fields in{" "}
          <Link
            href={`/${workspaceSlug}/settings/projects/${projectId}/custom-fields`}
            className="text-accent-primary hover:underline"
          >
            project settings → Custom fields
          </Link>
          , then return here to show them on cards.
        </p>
      </div>
    );
  }

  const customFieldVisibility: Record<string, boolean> =
    (displayProperties.custom_fields as Record<string, boolean> | undefined) ?? {};

  return (
    <div className="mt-2 border-t border-subtle pt-2">
      <p className="mb-1.5 text-11 font-medium text-secondary">Custom fields on cards</p>
      <p className="mb-1.5 text-11 text-tertiary">
        Shown on cards by default. Select fields use the first option until you change them.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {properties.map((property) => {
          const isEnabled = customFieldVisibility[property.id] !== false;
          return (
            <button
              key={property.id}
              type="button"
              className={`rounded-sm border px-2 py-0.5 text-11 transition-all ${
                isEnabled ? "border-accent-strong bg-accent-primary text-on-color" : "border-subtle hover:bg-layer-1"
              }`}
              onClick={() => {
                const nextVisibility: Record<string, boolean> = {
                  ...customFieldVisibility,
                  [property.id]: !isEnabled,
                };
                handleUpdate({ custom_fields: nextVisibility });
              }}
            >
              {property.name}
            </button>
          );
        })}
      </div>
    </div>
  );
});
