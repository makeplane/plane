import { useEffect, useState } from "react";

const useURLHash = () => {
  const [hashValue, setHashValue] = useState<string>();

  useEffect(() => {
    const hash = window.location.hash?.split("#")[1];
    setHashValue(hash);
  }, []);

  return hashValue;
};

export default useURLHash;
