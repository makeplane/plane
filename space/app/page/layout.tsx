import Image from "next/image";
import { notFound } from "next/navigation";
import useSWR from "swr";
// components
import IssueNavbar from "@/components/issues/navbar";
// hooks
import { usePublish, usePublishList } from "@/hooks/store";
// assets
import planeLogo from "@/public/plane-logo.svg";

type Props = { children: React.ReactNode; params: { anchor: string } };

const PageDetailsLayout = (props: Props) => {
  const { children, params } = props;
  // params
  const { anchor } = params;
  // store hooks
  const { fetchPublishSettings } = usePublishList();
  const { id, workspace_detail, project } = usePublish(anchor);

  useSWR(anchor ? `PUBLISH_SETTINGS_${anchor}` : null, anchor ? () => fetchPublishSettings(anchor) : null);

  if (!workspace_detail || !project || !id) notFound();

  return (
    <div className="relative flex h-screen min-h-[500px] w-screen flex-col overflow-hidden">
      <div className="relative flex h-[60px] flex-shrink-0 select-none items-center border-b border-custom-border-300 bg-custom-sidebar-background-100">
        <IssueNavbar workspaceSlug={workspace_detail.slug} projectId={project} />
      </div>
      <div className="relative h-full w-full overflow-hidden bg-custom-background-90">{children}</div>
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
          Powered by <span className="font-semibold">Plane Deploy</span>
        </div>
      </a>
    </div>
  );
};

export default PageDetailsLayout;
