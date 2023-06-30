import { useEffect, useState } from "react";

const BREACK_POINTS = {
  MEDIUM: 640,
  LARGE: 1007,
};

export default function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  const IS_SMALL_SCREEN: boolean = windowWidth < BREACK_POINTS.MEDIUM;
  const IS_MEDIUM_SCREEN: boolean =
    windowWidth > BREACK_POINTS.MEDIUM && windowWidth <= BREACK_POINTS.LARGE;
  const IS_LARGE_SCREEN: boolean = windowWidth > BREACK_POINTS.LARGE;

  const handleChange = () => {
    setWindowWidth(window.innerWidth);
  };

  useEffect(() => {
    document.addEventListener("change", handleChange);

    handleChange();

    return () => document.removeEventListener("change", handleChange);
  }, []);

  return { windowWidth, IS_LARGE_SCREEN, IS_MEDIUM_SCREEN, IS_SMALL_SCREEN };
}
