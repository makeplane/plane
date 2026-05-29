import Link from "next/link";
import { PlaneLockup } from "@plane/propel/icons";

export function AuthHeader() {
  return (
    <div className="sticky top-0 flex w-full flex-shrink-0 items-center justify-between gap-6">
      <Link href="/">
        <PlaneLockup height={20} width={95} className="text-primary" />
      </Link>
    </div>
  );
}
