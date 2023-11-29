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
  <div className={`my-8 w-full flex flex-col gap-4 items-center justify-center overflow-hidden`}>
    <div className="w-3/5 bg-custom-background-90">
      <div className="grid h-full place-items-center p-2 pb-0">
        <div className="text-center">
          <Image src={AccessDeniedImg} height="250" width="550" alt="AccessDeniedImg" />
          <h3 className="text-3xl font-semibold">God mode needs a god role</h3>
          <p className="text-base text-custom-text-300">Doesn’t look like you have that role.</p>
        </div>
        <div className="flex flex-col gap-2 my-8 text-center">
          <div>
            <p className="font-medium text-xs text-custom-text-400 tracking-tight">Do we have a god role?</p>
            <p className="text-custom-text-300 text-sm">Yes.</p>
          </div>
          <div>
            <p className="font-medium text-xs text-custom-text-400 tracking-tight">Do we call it god role?</p>
            <p className="text-custom-text-300 text-sm">No. Obviously not.</p>
          </div>
          <div>
            <p className="font-medium text-xs text-custom-text-400 tracking-tight">Can you get it?</p>
            <p className="text-custom-text-300 text-sm">Maybe. Ask your god.</p>
          </div>
          <div>
            <p className="font-medium text-xs text-custom-text-400 tracking-tight">
              Are we being intentionally cryptic?
            </p>
            <p className="text-custom-text-300 text-sm">Yes.</p>
          </div>
          <div>
            <p className="font-medium text-xs text-custom-text-400 tracking-tight">
              Is this for the security of your workspaces?
            </p>
            <p className="text-custom-text-300 text-sm">Absolutely!</p>
          </div>
          <div>
            <p className="font-medium text-xs text-custom-text-400 tracking-tight">
              Are you the god here and still seeing this?
            </p>
            <p className="text-custom-text-300 text-sm">
              Sorry, God.{" "}
              <a
                href="https://discord.com/channels/1031547764020084846/1094927053867995176"
                target="_blank"
                className="text-custom-primary-100 font-medium hover:underline"
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
        <span>
          <Button variant="primary" size="sm">
            <LayoutGrid width={16} height={16} />
            To the workspace
          </Button>
        </span>
      </Link>
    </div>
  </div>
);
