// plane imports
import { MAX_FILE_SIZE } from "@plane/constants";
// hooks
import { useInstance } from "@/hooks/store/use-instance";

type TReturnProps = {
  maxFileSize: number;
};

export const useFileSize = (): TReturnProps => {
  // store hooks
  const { config } = useInstance();

  return {
    maxFileSize: config?.file_size_limit ?? MAX_FILE_SIZE,
  };
};
