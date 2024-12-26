import Image from "next/image";
import Link from "next/link";
import { Button } from "@plane/ui";
import ImagelLight from "@/public/empty-state/empty-updates-light.png";

type TProps = {
  workspaceSlug: string;
  projectId: string;
};

export const UpgradeUpdates = (props: TProps) => {
  const { workspaceSlug, projectId } = props;
  return (
    <div className="flex h-full">
      <div className="m-auto mt-[50%]">
        <Image src={ImagelLight} alt="No updates" className="w-[161px] m-auto" />
        <div className="w-fit m-auto text-lg font-medium items-center">Updates</div>
        <div className="w-fit m-auto font-medium text-base text-custom-text-350 text-center my-2">
          Feature is disabled, you can enable it in settings
        </div>
        <Link href={`/${workspaceSlug}/projects/${projectId}/settings/project-updates`} className="mt-4 mx-auto">
          <Button className="mx-auto"> Turn on Project Updates</Button>
        </Link>
      </div>
    </div>
  );
};
