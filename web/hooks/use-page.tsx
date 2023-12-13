import { useMobxStore } from "lib/mobx/store-provider";

const usePage = () => {
  const { page } = useMobxStore();
  return { ...page };
};

export default usePage;
