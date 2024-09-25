// ui
import { Button } from "@plane/ui";
// constants
import { MARKETING_PRICING_PAGE_LINK } from "@/constants/common";

export const BillingRoot = () => (
  <section className="w-full overflow-y-auto">
    <div>
      <div className="flex  items-center border-b border-custom-border-100 pb-3.5">
        <h3 className="text-xl font-medium">Billing and Plans</h3>
      </div>
    </div>
    <div className="py-6">
      <div>
        <h4 className="text-md mb-1 leading-6">Current plan</h4>
        <p className="mb-3 text-sm text-custom-text-200">You are currently using the free plan</p>
        <a href={MARKETING_PRICING_PAGE_LINK} target="_blank" rel="noreferrer">
          <Button variant="neutral-primary">View plans</Button>
        </a>
      </div>
    </div>
  </section>
);
