"use client";

import { FC, ReactNode } from "react";
import Image from "next/image";
// logo
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

type TDefaultLayout = {
  children: ReactNode;
};

export const DefaultLayout: FC<TDefaultLayout> = (props) => {
  const { children } = props;

  return (
    <div className="h-screen w-full overflow-hidden overflow-y-auto flex flex-col">
      <div className="container h-[100px] flex-shrink-0 mx-auto px-5 lg:px-0 flex items-center justify-between gap-5 z-50">
        <div className="flex items-center gap-x-2">
          <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
          <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
        </div>
      </div>
      <div className="w-full px-5 lg:px-0 mb-[100px] flex-grow">{children}</div>
    </div>
  );
};
