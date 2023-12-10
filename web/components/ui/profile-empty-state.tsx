import React from "react";

import Image from "next/image";

type Props = {
  title: string;
  description?: React.ReactNode;
  image: any;
};

export const ProfileEmptyState: React.FC<Props> = ({ title, description, image }) => (
  <div className={`mx-auto grid h-full w-full place-items-center p-8 `}>
    <div className="flex w-full flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-custom-background-90">
        <Image src={image} width={32} alt={title} />
      </div>
      <h6 className="mb-3 mt-3.5 text-base font-semibold">{title}</h6>
      {description && <p className="text-sm text-custom-text-300">{description}</p>}
    </div>
  </div>
);
