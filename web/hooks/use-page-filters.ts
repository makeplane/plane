// hooks
import useLocalStorage from "@/hooks/use-local-storage";

export const usePageFilters = () => {
  const { storedValue: isFullWidth, setValue: setFullWidth } = useLocalStorage<boolean>("page_full_width", true);
  const handleFullWidth = (value: boolean) => setFullWidth(value);

  return {
    isFullWidth: !!isFullWidth,
    handleFullWidth,
  };
};
