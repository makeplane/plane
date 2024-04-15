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
    <div className="relative h-screen max-h-max w-full overflow-hidden overflow-y-auto flex flex-col">
      <div className="flex-shrink-0 h-[90px]">
        <div className="relative h-full container mx-auto px-5 md:px-10 flex items-center justify-between gap-5">
          <div className="flex items-center gap-x-2">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
          </div>
        </div>
      </div>
      <div className="w-full flex-grow">{children}</div>
    </div>
  );
};
