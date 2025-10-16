import { PageNotFound } from "@/components/ui/not-found";
import type { PublishStore } from "@/store/publish/publish.store";

type Props = {
  peekId: string | undefined;
  publishSettings: PublishStore;
};

export const ViewLayoutsRoot = (_props: Props) => <PageNotFound />;
