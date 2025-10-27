import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { PreloadResources } from "./layout.preload";
// types

// styles
import "@/styles/command-pallette.css";
import "@/styles/emoji.css";
import "@plane/propel/styles/react-day-picker.css";

export const meta: Route.MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
  { name: "viewport", content: "width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover" },
];

export default function AppLayout() {
  return (
    <>
      <PreloadResources />
      <Outlet />
    </>
  );
}
