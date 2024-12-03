"use client";

import { observer } from "mobx-react";
import Image from "next/image";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
import { SomethingWentWrongError } from "@/components/issues/issue-layouts/error";
// hooks
import { usePublish, usePublishList } from "@/hooks/store";
// assets
import planeLogo from "@/public/plane-logo.svg";

type Props = {
  children: React.ReactNode;
  params: {
    anchor: string;
  };
};

const IntakeLayout = observer((props: Props) => {
  const { children, params } = props;
  // params
  const { anchor } = params;
  // store hooks
  const { fetchPublishSettings } = usePublishList();
  const publishSettings = usePublish(anchor);

  // fetch publish settings && view details
  const { error } = useSWR(
    anchor ? `PUBLISHED_VIEW_SETTINGS_${anchor}` : null,
    anchor
      ? async () => {
          const promises = [];
          promises.push(fetchPublishSettings(anchor));
          await Promise.all(promises);
        }
      : null
  );

  if (error) return <SomethingWentWrongError />;

  if (!publishSettings) return <LogoSpinner />;

  return (
    <div className="relative flex h-screen min-h-[500px] w-screen flex-col overflow-hidden">
      <div className="relative h-full w-full overflow-hidden bg-custom-primary-100/5 flex">{children}</div>
      <a
        href="https://plane.so"
        className="fixed bottom-2.5 right-5 !z-[999999] flex items-center gap-1 rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 shadow-custom-shadow-2xs"
        target="_blank"
        rel="noreferrer noopener"
      >
        <div className="relative grid h-6 w-6 place-items-center">
          <Image src={planeLogo} alt="Plane logo" className="h-6 w-6" height="24" width="24" />
        </div>
        <div className="text-xs">
          Powered by <span className="font-semibold">Plane Publish</span>
        </div>
      </a>
    </div>
  );
});

export default IntakeLayout;
