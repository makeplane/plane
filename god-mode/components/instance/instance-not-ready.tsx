import { FC, ReactNode } from "react";

type TInstanceNotReady = {
  children: ReactNode;
};

export const InstanceNotReady: FC<TInstanceNotReady> = (props) => {
  const {} = props;

  return <div>SignIn Form</div>;
};
