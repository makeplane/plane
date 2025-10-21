import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { PreloadResources } from "./layout.preload";
import "@/styles/command-pallette.css";
import "@/styles/emoji.css";
import "@plane/propel/styles/react-day-picker.css";

export default function AppLayout() {
  return (
    <>
      <PreloadResources />
      <Outlet />
    </>
  );
}
