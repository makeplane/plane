/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { THelpArticleHeadings } from "./use-help-article-headings";

type Props = THelpArticleHeadings & {
  /** "sidebar" = sticky desktop rail; "mobile" = collapsible disclosure. */
  variant?: "sidebar" | "mobile";
  className?: string;
};

// Presentational table of contents fed by useHelpArticleHeadings. Only shown when
// the article has >=2 non-empty headings (a single heading is not worth a jump
// list). The same heading data drives the desktop sidebar and the mobile
// disclosure, so the active highlight stays in sync across both.
export const HelpArticleToc = ({ headings, active, scrollTo, variant = "sidebar", className }: Props) => {
  const { t } = useTranslation();
  if (headings.length < 2) return null;

  const list = (
    <ul className="space-y-1 border-l border-subtle">
      {headings.map((heading) => (
        <li key={heading.index}>
          <button
            type="button"
            onClick={() => scrollTo(heading.index)}
            aria-current={active === heading.index ? "location" : undefined}
            className={cn(
              "block w-full truncate border-l-2 py-1 text-left text-13 transition-colors hover:text-primary",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong",
              heading.level === 3 ? "pl-6" : heading.level === 2 ? "pl-4" : "pl-3",
              active === heading.index ? "border-accent-strong text-accent-primary" : "border-transparent text-tertiary"
            )}
          >
            {heading.text}
          </button>
        </li>
      ))}
    </ul>
  );

  if (variant === "mobile") {
    return (
      <details className={cn("rounded-lg border border-subtle bg-surface-1", className)}>
        <summary className="cursor-pointer select-none px-4 py-2.5 text-13 font-semibold text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong">
          {t("help_center.on_this_page")}
        </summary>
        <nav aria-label={t("help_center.on_this_page")} className="px-4 pb-3">
          {list}
        </nav>
      </details>
    );
  }

  return (
    <nav aria-label={t("help_center.on_this_page")} className="sticky top-4">
      <p className="mb-2 text-13 font-semibold text-secondary">{t("help_center.on_this_page")}</p>
      {list}
    </nav>
  );
};
