import { FC } from "react";
import { observer } from "mobx-react";
// layouts
import { ProjectAuthWrapper as CoreProjectAuthWrapper } from "@/layouts/auth-layout";

export type IProjectAuthWrapper = {
  children: React.ReactNode;
};

export const ProjectAuthWrapper: FC<IProjectAuthWrapper> = observer((props) => {
  // props
  const { children } = props;

  return <CoreProjectAuthWrapper>{children}</CoreProjectAuthWrapper>;
});
