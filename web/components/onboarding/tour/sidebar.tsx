// icons
import { ContrastIcon, DiceIcon, LayersIcon, PhotoFilterIcon } from "@plane/ui";
import { FileText } from "lucide-react";
// types
import { TTourSteps } from "./root";

const sidebarOptions: {
  key: TTourSteps;
  Icon: any;
}[] = [
  {
    key: "issues",
    Icon: LayersIcon,
  },
  {
    key: "cycles",
    Icon: ContrastIcon,
  },
  {
    key: "modules",
    Icon: DiceIcon,
  },
  {
    key: "views",
    Icon: PhotoFilterIcon,
  },
  {
    key: "pages",
    Icon: FileText,
  },
];

type Props = {
  step: TTourSteps;
  setStep: React.Dispatch<React.SetStateAction<TTourSteps>>;
};

export const TourSidebar: React.FC<Props> = ({ step, setStep }) => (
  <div className="col-span-3 hidden bg-custom-background-90 p-8 lg:block">
    <h3 className="text-lg font-medium">
      Let{"'"}s get started!
      <br />
      Get more out of Plane.
    </h3>
    <div className="mt-8 space-y-5">
      {sidebarOptions.map((option) => (
        <h5
          key={option.key}
          className={`flex cursor-pointer items-center gap-2 border-l-[3px] py-0.5 pl-3 pr-2 text-sm font-medium capitalize ${
            step === option.key
              ? "border-custom-primary-100 text-custom-primary-100"
              : "border-transparent text-custom-text-200"
          }`}
          onClick={() => setStep(option.key)}
          role="button"
        >
          <option.Icon className="h-4 w-4" aria-hidden="true" />
          {option.key}
        </h5>
      ))}
    </div>
  </div>
);
