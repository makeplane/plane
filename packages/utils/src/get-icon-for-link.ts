import {
  Github,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Dribbble,
  Figma,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  Mail,
  Chrome,
  Link2,
} from "lucide-react";

type IconMatcher = {
  pattern: RegExp;
  icon: typeof Github;
};

const SOCIAL_MEDIA_MATCHERS: IconMatcher[] = [
  { pattern: /github\.com/, icon: Github },
  { pattern: /linkedin\.com/, icon: Linkedin },
  { pattern: /(twitter\.com|x\.com)/, icon: Twitter },
  { pattern: /facebook\.com/, icon: Facebook },
  { pattern: /instagram\.com/, icon: Instagram },
  { pattern: /youtube\.com/, icon: Youtube },
  { pattern: /dribbble\.com/, icon: Dribbble },
];

const PRODUCTIVITY_MATCHERS: IconMatcher[] = [
  { pattern: /figma\.com/, icon: Figma },
  { pattern: /(google\.com|docs\.|doc\.)/, icon: FileText },
];

const FILE_TYPE_MATCHERS: IconMatcher[] = [
  { pattern: /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/, icon: FileImage },
  { pattern: /\.(mp4|mov|avi|wmv|flv|mkv)$/, icon: FileVideo },
  { pattern: /\.(mp3|wav|ogg)$/, icon: FileAudio },
  { pattern: /\.(zip|rar|7z|tar|gz)$/, icon: FileArchive },
  { pattern: /\.(xls|xlsx|csv)$/, icon: FileSpreadsheet },
  { pattern: /\.(pdf|doc|docx|txt)$/, icon: FileText },
  { pattern: /\.(html|js|ts|jsx|tsx|css|scss)$/, icon: FileCode },
];

const OTHER_MATCHERS: IconMatcher[] = [
  { pattern: /^mailto:/, icon: Mail },
  { pattern: /^http/, icon: Chrome },
];

export const getIconForLink = (url: string) => {
  const lowerUrl = url.toLowerCase();

  const allMatchers = [...SOCIAL_MEDIA_MATCHERS, ...PRODUCTIVITY_MATCHERS, ...FILE_TYPE_MATCHERS, ...OTHER_MATCHERS];

  const matchedIcon = allMatchers.find(({ pattern }) => pattern.test(lowerUrl));
  return matchedIcon?.icon ?? Link2;
};
