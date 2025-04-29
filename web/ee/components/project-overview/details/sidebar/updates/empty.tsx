import Image from "next/image";
import { Button } from "@plane/ui";
import ImagelLight from "@/public/empty-state/empty-updates-light.png";

type TProps = {
  handleNewUpdate: () => void;
};

export const EmptyUpdates = (props: TProps) => {
  const { handleNewUpdate } = props;

  return (
    <div className="flex h-full">
      <div className="m-auto mt-[50%]">
        <Image src={ImagelLight} alt="No updates" className="w-[161px] m-auto" />
        <div className="w-fit m-auto text-lg font-medium items-center">No updates yet</div>
        <div className="w-fit m-auto font-medium text-base text-custom-text-350">You can see the updates here.</div>
        <Button className="mt-4 mx-auto" onClick={() => handleNewUpdate()}>
          Add an Update
        </Button>
      </div>
    </div>
  );
};
