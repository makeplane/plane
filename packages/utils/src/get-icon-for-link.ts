/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentType, SVGProps } from "react";
import { FileArchive, FileSpreadsheet } from "lucide-react";
import {
  Chrome,
  CodeOutline,
  DocumentationOutline,
  Dribbble,
  Facebook,
  Figma,
  Github,
  ImageOutline,
  Instagram,
  LinkOutline,
  Linkedin,
  MailOutline,
  MusicOutline,
  VideoOutline,
  X,
  Youtube,
} from "@makeplane/propel/icons";

type IconMatcher = {
  pattern: RegExp;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const SOCIAL_MEDIA_MATCHERS: IconMatcher[] = [
  { pattern: /github\.com/, icon: Github },
  { pattern: /linkedin\.com/, icon: Linkedin },
  { pattern: /(twitter\.com|x\.com)/, icon: X },
  { pattern: /facebook\.com/, icon: Facebook },
  { pattern: /instagram\.com/, icon: Instagram },
  { pattern: /youtube\.com/, icon: Youtube },
  { pattern: /dribbble\.com/, icon: Dribbble },
];

const PRODUCTIVITY_MATCHERS: IconMatcher[] = [
  { pattern: /figma\.com/, icon: Figma },
  { pattern: /(google\.com|docs\.|doc\.)/, icon: DocumentationOutline },
];

const FILE_TYPE_MATCHERS: IconMatcher[] = [
  { pattern: /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/, icon: ImageOutline },
  { pattern: /\.(mp4|mov|avi|wmv|flv|mkv)$/, icon: VideoOutline },
  { pattern: /\.(mp3|wav|ogg)$/, icon: MusicOutline },
  { pattern: /\.(zip|rar|7z|tar|gz)$/, icon: FileArchive },
  { pattern: /\.(xls|xlsx|csv)$/, icon: FileSpreadsheet },
  { pattern: /\.(pdf|doc|docx|txt)$/, icon: DocumentationOutline },
  { pattern: /\.(html|js|ts|jsx|tsx|css|scss)$/, icon: CodeOutline },
];

const OTHER_MATCHERS: IconMatcher[] = [
  { pattern: /^mailto:/, icon: MailOutline },
  { pattern: /^http/, icon: Chrome },
];

export const getIconForLink = (url: string) => {
  const lowerUrl = url.toLowerCase();

  const allMatchers = [...SOCIAL_MEDIA_MATCHERS, ...PRODUCTIVITY_MATCHERS, ...FILE_TYPE_MATCHERS, ...OTHER_MATCHERS];

  const matchedIcon = allMatchers.find(({ pattern }) => pattern.test(lowerUrl));
  return matchedIcon?.icon ?? LinkOutline;
};
