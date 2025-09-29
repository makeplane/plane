import { useCallback, useEffect, useRef } from "react";

function useEvent<T extends (...args: any[]) => any>(handler: T): T {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  return useCallback(((...args) => handlerRef.current(...args)) as T, []);
}
export default useEvent;
