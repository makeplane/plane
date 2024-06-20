import { useState, useEffect } from "react";

const useIsInIframe = () => {
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const checkIfInIframe = () => {
      setIsInIframe(window.self !== window.top);
    };

    checkIfInIframe();
  }, []);

  return isInIframe;
};

export default useIsInIframe;
