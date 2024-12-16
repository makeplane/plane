import Image from "next/image";
import Link from "next/link";
import { Button } from "@plane/ui";
import ImagelLight from "@/public/empty-state/empty-updates-light.png";

type TProps = {
  workspaceSlug: string;
  projectId: string;
};

export const UpgradeProperties = (props: TProps) => {
  const { workspaceSlug, projectId } = props;
  return (
    <div className="flex h-full">
      <div className="m-auto">
        <Image src={ImagelLight} alt="No updates" className="w-[161px] m-auto" />
        <div className="w-fit m-auto text-lg font-medium items-center">Project Properties</div>
        <div className="w-fit m-auto font-medium text-base text-custom-text-350 text-center my-2">
          Enable project grouping to access this feature
        </div>
        <Link href={`/${workspaceSlug}/settings/project-states`} className="mt-4 mx-auto">
          <Button className="mx-auto"> Enable project grouping</Button>
        </Link>
      </div>
    </div>
  );
};
