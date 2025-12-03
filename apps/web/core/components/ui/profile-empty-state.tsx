import React from "react";

type Props = {
  title: string;
  description?: React.ReactNode;
  image: any;
};

export function ProfileEmptyState({ title, description, image }: Props) {
  return (
    <div className={`mx-auto grid h-full w-full place-items-center p-8 `}>
      <div className="flex w-full flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
          <img src={image} width="32" height="32" className="w-full h-full object-cover" alt={title} />
        </div>
        <h6 className="mb-3 mt-3.5 text-14 font-semibold">{title}</h6>
        {description && <p className="text-13 text-tertiary">{description}</p>}
      </div>
    </div>
  );
}
