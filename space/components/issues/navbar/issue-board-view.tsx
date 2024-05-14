"use client";

import { FC } from "react";
import { observer } from "mobx-react-lite";
// constants
import { issueViews } from "@/constants/data";
// hooks
import { useProject } from "@/hooks/store";
// mobx
import { TIssueBoardKeys } from "@/types/issue";

type NavbarIssueBoardViewProps = {
  layouts: Record<TIssueBoardKeys, boolean>;
};

export const NavbarIssueBoardView: FC<NavbarIssueBoardViewProps> = observer((props) => {
  const { layouts } = props;

  const { activeLayout, setActiveLayout } = useProject();

  const handleCurrentBoardView = (boardView: string) => {
    setActiveLayout(boardView as TIssueBoardKeys);
  };

  return (
    <>
      {layouts &&
        Object.keys(layouts).map((layoutKey: string) => {
          if (layouts[layoutKey as TIssueBoardKeys]) {
            return (
              <div
                key={layoutKey}
                className={`flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-sm ${
                  layoutKey === activeLayout
                    ? `bg-custom-background-80 text-custom-text-200`
                    : `text-custom-text-300 hover:bg-custom-background-80`
                }`}
                onClick={() => handleCurrentBoardView(layoutKey)}
                title={layoutKey}
              >
                <span
                  className={`material-symbols-rounded text-[18px] ${
                    issueViews[layoutKey]?.className ? issueViews[layoutKey]?.className : ``
                  }`}
                >
                  {issueViews[layoutKey]?.icon}
                </span>
              </div>
            );
          }
        })}
    </>
  );
});
