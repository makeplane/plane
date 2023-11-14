import { Control, Controller } from "react-hook-form";
import { IWebhookIndividualOptions, IExtendedWebhook } from "types/webhook";

export enum IndividualWebhookTypes {
  PROJECTS = "Projects",
  MODULES = "Modules",
  CYCLES = "Cycles",
  ISSUES = "Issues",
  ISSUE_COMMENTS = "Issue Comments",
}

export const individualWebhookOptions: IWebhookIndividualOptions[] = [
  {
    key: "project_toggle",
    label: IndividualWebhookTypes.PROJECTS,
    name: "project",
  },
  {
    key: "cycle-toggle",
    label: IndividualWebhookTypes.CYCLES,
    name: "cycle",
  },
  {
    key: "issue_toggle",
    label: IndividualWebhookTypes.ISSUES,
    name: "issue",
  },
  {
    key: "module_toggle",
    label: IndividualWebhookTypes.MODULES,
    name: "module",
  },
  {
    key: "issue_comment_toggle",
    label: IndividualWebhookTypes.ISSUE_COMMENTS,
    name: "issue_comment",
  },
];

interface IWebHookIndividualOptions {
  control: Control<IExtendedWebhook, any>;
}

export const WebHookIndividualOptions = ({ control }: IWebHookIndividualOptions) => (
  <>
    <div className="grid grid-cols-2 md:grid-cols-3 grid-flow-row gap-4 px-8 py-6 bg-custom-background-90">
      {individualWebhookOptions.map(({ key, label, name }: IWebhookIndividualOptions) => (
        <Controller
          control={control}
          name={name}
          key={key}
          render={({ field: { onChange, value } }) => (
            <div className="relative flex items-center gap-2">
              <input
                id={key}
                onChange={() => onChange(!value)}
                type="checkbox"
                name="selectIndividualEvents"
                checked={value == true}
              />
              <label className="text-sm" htmlFor={key}>
                {label}
              </label>
            </div>
          )}
        />
      ))}
    </div>
  </>
);
