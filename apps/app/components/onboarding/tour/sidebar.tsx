// icons
import {
  ArticleOutlined,
  ContrastOutlined,
  DatasetOutlined,
  FilterNoneOutlined,
  PhotoFilterOutlined,
} from "@mui/icons-material";
// types
import { TTourSteps } from "./root";

const sidebarOptions: {
  key: TTourSteps;
  Icon: any;
}[] = [
  {
    key: "issues",
    Icon: FilterNoneOutlined,
  },
  {
    key: "cycles",
    Icon: ContrastOutlined,
  },
  {
    key: "modules",
    Icon: DatasetOutlined,
  },
  {
    key: "views",
    Icon: PhotoFilterOutlined,
  },
  {
    key: "pages",
    Icon: ArticleOutlined,
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
          <option.Icon
            sx={{
              fontSize: 18,
            }}
            aria-hidden="true"
          />
          {option.key}
        </h5>
      ))}
    </div>
  </div>
);
