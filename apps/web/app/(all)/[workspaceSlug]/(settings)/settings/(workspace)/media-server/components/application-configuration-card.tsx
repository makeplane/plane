import { Plus, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";

type TApplicationConfigurationCardProps = {
  applications: string[];
  isLoading: boolean;
  isMutating: boolean;
  onOpenCreateModal: () => void;
  onDeleteApplication: (applicationName: string) => void;
};

export const ApplicationConfigurationCard = ({
  applications,
  isLoading,
  isMutating,
  onOpenCreateModal,
  onDeleteApplication,
}: TApplicationConfigurationCardProps) => (
  <section className="overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100">
    <div className="flex flex-col gap-3 border-b border-custom-border-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <h4 className="text-base font-medium text-custom-text-100">Application Configuration</h4>

      <Button variant="primary" size="sm" prependIcon={<Plus />} onClick={onOpenCreateModal} disabled={isMutating}>
        Add application
      </Button>
    </div>

    <div className="space-y-2 p-4">
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`application-skeleton-${index}`}
              className="flex items-center justify-between rounded-md border border-custom-border-100 bg-custom-background-80 px-3 py-2"
            >
              <div className="h-4 w-1/3 animate-pulse rounded bg-custom-background-90" />
              <div className="h-8 w-24 animate-pulse rounded bg-custom-background-90" />
            </div>
          ))}
        </div>
      ) : applications.length > 0 ? (
        applications.map((application) => (
          <div
            key={application}
            className="flex items-center justify-between rounded-md border border-custom-border-100 bg-custom-background-80 px-3 py-2"
          >
            <div className="text-sm text-custom-text-200">{application}</div>
            <Button
              variant="danger"
              size="sm"
              prependIcon={<Trash2 />}
              onClick={() => onDeleteApplication(application)}
              disabled={isMutating}
            >
              Remove
            </Button>
          </div>
        ))
      ) : (
        <p className="text-sm text-custom-text-300">No applications found.</p>
      )}
    </div>
  </section>
);
