/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { LinksFunction } from "react-router";
import { MailShell } from "@/components/mail";
import mailStyles from "@/styles/mail.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap",
  },
  { rel: "stylesheet", href: mailStyles },
];

export default function MailLayout() {
  return <MailShell />;
}
