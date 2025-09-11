import type { Route } from "./+types/home";

import { InstanceSignInForm } from "@/components/instance/sign-in/form";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
      <InstanceSignInForm />;
    </div>
  );
}
