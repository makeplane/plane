import Image from "next/image";
import { ExternalLink } from "lucide-react";
// ui
import { Button } from "@plane/ui";
// assets
import PlaneOneLogo from "@/public/plane-logos/plane-one.svg";

export const PlaneOneBilling: React.FC = () => (
  <section className="w-full overflow-y-auto md:pr-9 pr-4">
    <div>
      <div className="flex  items-center border-b border-custom-border-100 py-3.5">
        <h3 className="text-xl font-medium flex gap-4">
          Billing & Plans{" "}
          <a
            href="https://plane.so/pricing"
            className="px-4 py-1 text-center text-xs font-medium rounded-full bg-custom-primary-100/20 text-custom-primary-100 flex items-center justify-center"
            target="_blank"
            rel="noreferrer noopener"
          >
            {"View all plans"} &nbsp;
            <ExternalLink className="h-3 w-3" strokeWidth={2} />
          </a>
        </h3>
      </div>
    </div>
    <div className="px-4 py-6">
      <div>
        <div className="flex gap-2 text-lg font-medium justify-between">
          <div className="flex items-center">
            <Image src={PlaneOneLogo} alt="Plane One" width={36} height={36} />
            &nbsp;&nbsp;
            <h4 className="text-2xl mb-1 leading-6 font-bold"> Plane One</h4>
          </div>
          <div>
            <Button
              variant="neutral-primary"
              className="cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
            >
              {"Manage your license "}
              <ExternalLink className="h-3 w-3" strokeWidth={2} />
            </Button>
          </div>
        </div>
        <p className="mt-4 text-lg">1x - Perpetual license</p>
        <p className="mb-3 mt-2 text-md text-custom-text-200 flex items-center">Current Billing Cycle: None</p>
      </div>
    </div>
  </section>
);
