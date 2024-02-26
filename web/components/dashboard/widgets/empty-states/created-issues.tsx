import Image from "next/image";
import { useTheme } from "next-themes";
// types
import { TIssuesListTypes } from "@plane/types";
// constants
import { CREATED_ISSUES_EMPTY_STATES } from "constants/dashboard";

type Props = {
  type: TIssuesListTypes;
};

export const CreatedIssuesEmptyState: React.FC<Props> = (props) => {
  const { type } = props;
  // next-themes
  const { resolvedTheme } = useTheme();

  const typeDetails = CREATED_ISSUES_EMPTY_STATES[type];

  const image = resolvedTheme === "dark" ? typeDetails.darkImage : typeDetails.lightImage;

  return (
    <div className="text-center space-y-6 flex flex-col items-center">
      <div className="h-24 w-24">
        <Image src={image} className="w-full h-full" alt="Assigned issues" />
      </div>
      <p className="text-sm font-medium text-custom-text-300 whitespace-pre-line">{typeDetails.title}</p>
    </div>
  );
};
