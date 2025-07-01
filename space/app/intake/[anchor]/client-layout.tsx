"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
import { SomethingWentWrongError } from "@/components/issues/issue-layouts/error";
// hooks
import { PageNotFound } from "@/components/ui/not-found";
import { usePublish, usePublishList } from "@/hooks/store";

type Props = {
  children: React.ReactNode;
  anchor: string;
};

export const IntakeClientLayout = observer((props: Props) => {
  const { children, anchor } = props;
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

  if (error?.status === 404) return <PageNotFound />;

  if (error) return <SomethingWentWrongError />;

  if (!publishSettings) return <LogoSpinner />;

  return (
    <div className="relative flex h-screen min-h-[500px] w-screen flex-col overflow-hidden">
      <div className="relative h-full w-full overflow-hidden bg-custom-primary-100/5 flex">{children}</div>
    </div>
  );
});
