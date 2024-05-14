import { FC, ReactNode } from "react";

type TDefaultLayout = {
  children: ReactNode;
};

export const DefaultLayout: FC<TDefaultLayout> = (props) => {
  const { children } = props;

  return (
    <div className="relative h-screen max-h-max w-full overflow-hidden overflow-y-auto flex flex-col">
      <div className="flex-shrink-0">
        <div className="relative container mx-auto px-5 md:px-0 py-10 flex items-center justify-between gap-5">
          {/* logo */}
          <div className="h-[50px] relative flex justify-center items-center">Logo</div>
        </div>
      </div>
      <div className="w-full h-full">{children}</div>
    </div>
  );
};
