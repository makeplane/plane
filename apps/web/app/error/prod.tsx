/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { AnchorButton } from "@makeplane/propel/components/anchor-button";
import { Button } from "@makeplane/propel/components/button";
import { EmptyStateDetailed } from "@plane/blocks/empty-state";
// layouts
import DefaultLayout from "@/layouts/default-layout";

const linkMap = [
  {
    key: "mail_to",
    label: "Contact Support",
    value: "mailto:support@plane.so",
  },
  {
    key: "status",
    label: "Status Page",
    value: "https://status.plane.so/",
  },
  {
    key: "twitter_handle",
    label: "@planepowers",
    value: "https://x.com/planepowers",
  },
];

// Production Error Component
interface ProdErrorComponentProps {
  onGoHome: () => void;
  onReload: () => void;
}

export function ProdErrorComponent({ onGoHome, onReload }: ProdErrorComponentProps) {
  return (
    <DefaultLayout>
      {/* The blocks illustration is themed through CSS tokens, so no theme lookup is needed here. */}
      <div className="size-full px-6">
        <EmptyStateDetailed
          align="center"
          assetKey="server-error"
          assetClassName="size-40"
          title="🚧 Looks like something went wrong!"
          description="We track these errors automatically and working on getting things back up and running. If the problem persists feel free to contact us. In the meantime, try refreshing."
          customButton={
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-6">
                {linkMap.map((link) => (
                  <AnchorButton
                    key={link.key}
                    variant="primary"
                    size="sm"
                    href={link.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    label={link.label}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button variant="primary" size="lg" stretch="auto" label="Reload" onClick={onReload} />
                <Button variant="secondary" size="lg" stretch="auto" label="Go to home" onClick={onGoHome} />
              </div>
            </div>
          }
        />
      </div>
    </DefaultLayout>
  );
}
