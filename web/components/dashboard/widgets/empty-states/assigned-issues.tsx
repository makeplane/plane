import Image from "next/image";
import { useTheme } from "next-themes";
import { TIssuesListTypes } from "@plane/types";
// types
import { ASSIGNED_ISSUES_EMPTY_STATES } from "@/constants/dashboard";
// constants

type Props = {
  type: TIssuesListTypes;
};

export const AssignedIssuesEmptyState: React.FC<Props> = (props) => {
  const { type } = props;
  // next-themes
  const { resolvedTheme } = useTheme();

  const typeDetails = ASSIGNED_ISSUES_EMPTY_STATES[type];

  const image = resolvedTheme === "dark" ? typeDetails.darkImage : typeDetails.lightImage;

  // TODO: update empty state logic to use a general component
  return (
    <div className="text-center space-y-6 flex flex-col items-center">
      <div className="h-24 w-24">
        <Image src={image} className="w-full h-full" alt="Assigned issues" />
      </div>
      <p className="text-sm font-medium text-custom-text-300 whitespace-pre-line">{typeDetails.title}</p>
    </div>
  );
};
