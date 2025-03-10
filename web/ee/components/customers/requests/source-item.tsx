import React, { FC, useMemo } from "react";
import Image from "next/image";

type TProps = {
  link: string;
};

export const SourceItem: FC<TProps> = (props) => {
  const { link } = props;
  const faviconUrl = useMemo(() => `https://www.google.com/s2/favicons?domain=${link}&sz=${40}`, [link]);
  return (
    <div className="flex gap-2 items-center max-w-40 truncate">
      {link && <Image src={faviconUrl} height={20} width={20} alt="favicon" />}
      <p className="text-sm truncate">{link}</p>
    </div>
  );
};
