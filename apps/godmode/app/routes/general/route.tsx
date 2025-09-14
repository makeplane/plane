import { Outlet } from "react-router";

export default function GeneralLayout() {
  return (
    <div className="relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
      <Outlet />
    </div>
  );
}
