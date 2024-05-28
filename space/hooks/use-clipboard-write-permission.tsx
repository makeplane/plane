import { useState, useEffect } from "react";

const useClipboardWritePermission = () => {
  const [isClipboardWriteAllowed, setClipboardWriteAllowed] = useState(false);

  useEffect(() => {
    const checkClipboardWriteAccess = () => {
      navigator.permissions
        .query({ name: "clipboard-write" as PermissionName })
        .then((result) => {
          if (result.state === "granted") {
            setClipboardWriteAllowed(true);
          } else {
            setClipboardWriteAllowed(false);
          }
        })
        .catch(() => {
          setClipboardWriteAllowed(false);
        });
    };

    checkClipboardWriteAccess();
  }, []);

  return isClipboardWriteAllowed;
};

export default useClipboardWritePermission;
