import Link from "next/link";
import { Button } from "@plane/propel/button";
// assets
import PlaneTakeOffImage from "@/app/assets/images/plane-takeoff.png?url";

export function InstanceNotReady() {
  return (
    <div className="h-full w-full relative container px-5 mx-auto flex justify-center items-center">
      <div className="w-auto max-w-2xl relative space-y-8 py-10">
        <div className="relative flex flex-col justify-center items-center space-y-4">
          <h1 className="text-24 font-bold pb-3">Welcome aboard Plane!</h1>
          <img src={PlaneTakeOffImage} alt="Plane Logo" />
          <p className="font-medium text-14 text-placeholder">Get started by setting up your instance and workspace</p>
        </div>

        <div>
          <Link href={"/setup/?auth_enabled=0"}>
            <Button size="xl" className="w-full">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
