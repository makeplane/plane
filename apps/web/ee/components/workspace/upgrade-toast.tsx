import { PlaneLogo } from "@plane/ui";

export const UpgradeToast: React.FC = () => (
  <div className="flex gap-2 px-2">
    <div className="flex-shrink-0 pt-1.5">
      <PlaneLogo className="h-3 w-auto text-custom-primary-100" />
    </div>
    <div className="flex flex-col gap-0.5">
      <div className="text-sm font-medium leading-5">Upgrade</div>
      <div className="text-custom-text-200">Get this feature when you upgrade to Pro.</div>
    </div>
  </div>
);
