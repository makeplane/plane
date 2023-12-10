import { FC } from "react";
import Link from "next/link";
import Image from "next/image";
// images
import AccessDeniedImg from "public/auth/access-denied.svg";
// ui
import { Button } from "@plane/ui";
// icons
import { LayoutGrid } from "lucide-react";

interface InstanceAdminRestrictionProps {
  redirectWorkspaceSlug: string;
}

export const InstanceAdminRestriction: FC<InstanceAdminRestrictionProps> = ({ redirectWorkspaceSlug }) => (
  <div className={`my-8 flex w-full flex-col items-center justify-center gap-4 overflow-hidden`}>
    <div className="w-3/5 bg-custom-background-90">
      <div className="grid h-full place-items-center p-2 pb-0">
        <div className="text-center">
          <Image src={AccessDeniedImg} height="250" width="550" alt="AccessDeniedImg" />
          <h3 className="text-3xl font-semibold">God mode needs a god role</h3>
          <p className="text-base text-custom-text-300">Doesn’t look like you have that role.</p>
        </div>
        <div className="my-8 flex flex-col gap-2 text-center">
          <div>
            <p className="text-xs font-medium tracking-tight text-custom-text-400">Do we have a god role?</p>
            <p className="text-sm text-custom-text-300">Yes.</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-tight text-custom-text-400">Do we call it god role?</p>
            <p className="text-sm text-custom-text-300">No. Obviously not.</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-tight text-custom-text-400">Can you get it?</p>
            <p className="text-sm text-custom-text-300">Maybe. Ask your god.</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-tight text-custom-text-400">
              Are we being intentionally cryptic?
            </p>
            <p className="text-sm text-custom-text-300">Yes.</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-tight text-custom-text-400">
              Is this for the security of your workspaces?
            </p>
            <p className="text-sm text-custom-text-300">Absolutely!</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-tight text-custom-text-400">
              Are you the god here and still seeing this?
            </p>
            <p className="text-sm text-custom-text-300">
              Sorry, God.{" "}
              <a
                href="https://discord.com/channels/1031547764020084846/1094927053867995176"
                target="_blank"
                className="font-medium text-custom-primary-100 hover:underline"
                rel="noreferrer"
              >
                Talk to us.
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex items-center justify-center gap-2">
      <Link href={`/${redirectWorkspaceSlug}`}>
        <Button variant="primary" size="sm">
          <LayoutGrid width={16} height={16} />
          To the workspace
        </Button>
      </Link>
    </div>
  </div>
);
