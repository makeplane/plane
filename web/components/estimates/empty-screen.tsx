import { FC } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@plane/ui";

type TEstimateEmptyScreen = {
  onButtonClick: () => void;
};

export const EstimateEmptyScreen: FC<TEstimateEmptyScreen> = (props) => {
  // props
  const { onButtonClick } = props;
  const { resolvedTheme } = useTheme();

  const emptyScreenImage = `/empty-state/project-settings/estimates-${
    resolvedTheme === "light" ? "light" : "dark"
  }.webp`;

  return (
    <div className="relative flex flex-col justify-center items-center text-center gap-8 border border-custom-border-300 rounded bg-custom-background-90 py-20">
      <div className="flex-shrink-0 w-[120px] h-[120px] overflow-hidden relative flex justify-center items-center">
        <Image
          src={emptyScreenImage}
          alt="Empty estimate image"
          width={100}
          height={100}
          className="object-contain w-full h-full"
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-medium text-custom-text-100">No estimate systems yet</h3>
        <p className="text-base text-custom-text-300">Explain estimates system here</p>
      </div>
      <div>
        <Button onClick={onButtonClick}>Add Estimate System</Button>
      </div>
    </div>
  );
};
