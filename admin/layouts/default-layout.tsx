"use client";

import { FC, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
// logo
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

type TDefaultLayout = {
  children: ReactNode;
};

export const DefaultLayout: FC<TDefaultLayout> = (props) => {
  const { children } = props;
  const pathname = usePathname();

  console.log("pathname", pathname);

  return (
    <div className="relative h-screen max-h-max w-full overflow-hidden overflow-y-auto flex flex-col">
      <div className="flex-shrink-0 h-[120px]">
        <div className="relative h-full container mx-auto px-5 lg:px-0 flex items-center justify-between gap-5 z-50">
          <div className="flex items-center gap-x-2">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
            <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
          </div>
        </div>
      </div>
      <div className="w-full flex-grow">{children}</div>
    </div>
  );
};
