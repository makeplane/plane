import React from "react";

import Image from "next/image";

type Props = {
  title: string;
  description?: React.ReactNode;
  image: any;
};

export const ProfileEmptyState: React.FC<Props> = ({ title, description, image }) => (
  <div className={`h-full w-full mx-auto grid place-items-center p-8 `}>
    <div className="text-center flex flex-col items-center w-full">
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-custom-background-90">
        <Image src={image} width={32} alt={title} />
      </div>
      <h6 className="text-base font-semibold mt-3.5 mb-3">{title}</h6>
      {description && <p className="text-sm text-custom-text-300">{description}</p>}
    </div>
  </div>
);
