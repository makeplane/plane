// next imports
import Link from "next/link";
import Image from "next/image";
import { Metadata, ResolvingMetadata } from "next";
// components
import IssueNavbar from "components/issues/navbar";
import IssueFilter from "components/issues/filters-render";
// service
import ProjectService from "services/project.service";

type LayoutProps = {
  params: { workspace_slug: string; project_slug: string };
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  // read route params
  const { workspace_slug, project_slug } = params;
  const projectServiceInstance = new ProjectService();

  const project = await projectServiceInstance?.getProjectSettingsAsync(workspace_slug, project_slug);

  return {
    title: `${project?.project_details?.name} | ${workspace_slug}`,
    description: `${project?.project_details?.description || `${project?.project_details?.name} | ${workspace_slug}`}`,
    icons: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${
      typeof project?.project_details?.emoji != "object"
        ? String.fromCodePoint(parseInt(project?.project_details?.emoji))
        : "✈️"
    }</text></svg>`,
  };
}

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-screen min-h-[500px] h-screen overflow-hidden flex flex-col">
    <div className="flex-shrink-0 h-[60px] border-b border-gray-300 relative flex items-center bg-white select-none">
      <IssueNavbar />
    </div>
    {/* <div className="flex-shrink-0 min-h-[50px] h-auto py-1.5 border-b border-gray-300 relative flex items-center shadow-md bg-white select-none">
      <IssueFilter />
    </div> */}
    <div className="w-full h-full relative bg-gray-100/50 overflow-hidden">{children}</div>

    <div className="absolute z-[99999] bottom-[10px] right-[10px] bg-white rounded-sm shadow-lg border border-gray-100">
      <Link href="https://plane.so" className="p-1 px-2 flex items-center gap-1" target="_blank">
        <div className="w-[24px] h-[24px] relative flex justify-center items-center">
          <Image src="/plane-logo.webp" alt="plane logo" className="w-[24px] h-[24px]" height="24" width="24" />
        </div>
        <div className="text-xs">
          Powered by <b>Plane Deploy</b>
        </div>
      </Link>
    </div>
  </div>
);

export default RootLayout;
