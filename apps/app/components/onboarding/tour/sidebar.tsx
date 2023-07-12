// icons
import { ContrastIcon, LayerDiagonalIcon, PeopleGroupIcon, ViewListIcon } from "components/icons";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
// types
import { TTourSteps } from "./root";

const sidebarOptions: {
  key: TTourSteps;
  icon: any;
}[] = [
  {
    key: "issues",
    icon: LayerDiagonalIcon,
  },
  {
    key: "cycles",
    icon: ContrastIcon,
  },
  {
    key: "modules",
    icon: PeopleGroupIcon,
  },
  {
    key: "views",
    icon: ViewListIcon,
  },
  {
    key: "pages",
    icon: DocumentTextIcon,
  },
];

type Props = {
  step: TTourSteps;
  setStep: React.Dispatch<React.SetStateAction<TTourSteps>>;
};

export const TourSidebar: React.FC<Props> = ({ step, setStep }) => (
  <div className="hidden lg:block col-span-3 p-8 bg-custom-background-90">
    <h3 className="font-medium text-lg">
      Let{"'"}s get started!
      <br />
      Get more out of Plane.
    </h3>
    <div className="mt-8 space-y-5">
      {sidebarOptions.map((option) => (
        <h5
          key={option.key}
          className={`pr-2 py-0.5 pl-3 flex items-center gap-2 capitalize font-medium text-sm border-l-[3px] cursor-pointer ${
            step === option.key
              ? "text-custom-primary-100 border-custom-primary-100"
              : "text-custom-text-200 border-transparent"
          }`}
          onClick={() => setStep(option.key)}
        >
          <option.icon
            className={`h-5 w-5 flex-shrink-0 ${
              step === option.key ? "text-custom-primary-100" : "text-custom-text-200"
            }`}
            color={`${
              step === option.key ? "rgb(var(--color-primary-100))" : "rgb(var(--color-text-200))"
            }`}
            aria-hidden="true"
          />
          {option.key}
        </h5>
      ))}
    </div>
  </div>
);
