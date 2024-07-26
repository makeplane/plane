import { PageNotFound } from "@/components/ui/not-found";
import { PublishStore } from "@/store/publish/publish.store";

type Props = {
  peekId: string | undefined;
  publishSettings: PublishStore;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ViewLayoutsRoot = (props: Props) => <PageNotFound />;
