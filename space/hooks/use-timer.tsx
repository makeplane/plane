import { useState, useEffect } from "react";

const TIMER = 30;

const useTimer = (initialValue: number = TIMER) => {
  const [timer, setTimer] = useState(initialValue);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { timer, setTimer };
};

export default useTimer;
