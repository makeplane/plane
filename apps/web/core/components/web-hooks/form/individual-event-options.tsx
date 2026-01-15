import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { IWebhook } from "@plane/types";
import { Checkbox } from "@plane/ui";

export const INDIVIDUAL_WEBHOOK_OPTIONS: {
  key: keyof IWebhook;
  label: string;
  description: string;
}[] = [
  {
    key: "project",
    label: "Projects",
    description: "Project created, updated, or deleted",
  },
  {
    key: "cycle",
    label: "Cycles",
    description: "Cycle created, updated, or deleted",
  },
  {
    key: "issue",
    label: "Work items",
    description: "Work item created, updated, deleted, added to a cycle or module",
  },
  {
    key: "module",
    label: "Modules",
    description: "Module created, updated, or deleted",
  },
  {
    key: "issue_comment",
    label: "Work item comments",
    description: "Comment posted, updated, or deleted",
  },
];

type Props = {
  control: Control<IWebhook, any>;
};

export function WebhookIndividualEventOptions({ control }: Props) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 px-6 lg:grid-cols-2">
      {INDIVIDUAL_WEBHOOK_OPTIONS.map((option) => (
        <Controller
          key={option.key}
          control={control}
          name={option.key}
          render={({ field: { onChange, value } }) => (
            <div>
              <div className="flex items-center gap-2">
                <Checkbox id={option.key} onChange={() => onChange(!value)} checked={value === true} />
                <label className="text-13" htmlFor={option.key}>
                  {option.label}
                </label>
              </div>
              <p className="ml-6 mt-0.5 text-11 text-tertiary">{option.description}</p>
            </div>
          )}
        />
      ))}
    </div>
  );
}
