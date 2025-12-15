// helpers
import { EAuthModes } from "@/types/auth";

type TAuthHeader = {
  authMode: EAuthModes;
};

type TAuthHeaderContent = {
  header: string;
  subHeader: string;
};

type TAuthHeaderDetails = {
  [mode in EAuthModes]: TAuthHeaderContent;
};

const Titles: TAuthHeaderDetails = {
  [EAuthModes.SIGN_IN]: {
    header: "Sign in to upvote or comment",
    subHeader: "Contribute in nudging the features you want to get built.",
  },
  [EAuthModes.SIGN_UP]: {
    header: "View, comment, and do more",
    subHeader: "Sign up or log in to work with Plane work items and Pages.",
  },
};

export function AuthHeader(props: TAuthHeader) {
  const { authMode } = props;

  const getHeaderSubHeader = (mode: EAuthModes | null): TAuthHeaderContent => {
    if (mode) {
      return Titles[mode];
    }

    return {
      header: "Comment or react to work items",
      subHeader: "Use plane to add your valuable inputs to features.",
    };
  };

  const { header, subHeader } = getHeaderSubHeader(authMode);

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-20 font-semibold text-primary leading-7">{header}</span>
        <span className="text-20 font-semibold text-placeholder leading-7">{subHeader}</span>
      </div>
    </>
  );
}
