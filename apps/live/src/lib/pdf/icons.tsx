/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Circle, Path, Rect, Svg } from "@react-pdf/renderer";
import React from "react";

type IconProps = {
  size?: number;
  color?: string;
};

// Lightbulb icon for callouts (default)
export const LightbulbIcon = ({ size = 16, color = "#ffffff" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M9 21h6M12 3a6 6 0 0 0-6 6c0 2.22 1.21 4.16 3 5.19V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.81c1.79-1.03 3-2.97 3-5.19a6 6 0 0 0-6-6z"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Document/file icon for page embeds
export const DocumentIcon = ({ size = 12, color = "#1e40af" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2v6h6" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 13H8M16 17H8M10 9H8" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Link icon for page links and external links
export const LinkIcon = ({ size = 12, color = "#2563eb" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Paperclip icon for attachments (default)
export const PaperclipIcon = ({ size = 16, color = "#374151" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Image icon for image attachments
export const ImageIcon = ({ size = 16, color = "#374151" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={3} y={3} width={18} height={18} rx={2} ry={2} fill="none" stroke={color} strokeWidth={2} />
    <Circle cx={8.5} cy={8.5} r={1.5} fill={color} />
    <Path d="M21 15l-5-5L5 21" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Video icon for video attachments
export const VideoIcon = ({ size = 16, color = "#374151" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={2} y={4} width={15} height={16} rx={2} ry={2} fill="none" stroke={color} strokeWidth={2} />
    <Path d="M17 10l5-3v10l-5-3z" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Music/audio icon
export const MusicIcon = ({ size = 16, color = "#374151" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M9 18V5l12-2v13" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx={6} cy={18} r={3} fill="none" stroke={color} strokeWidth={2} />
    <Circle cx={18} cy={16} r={3} fill="none" stroke={color} strokeWidth={2} />
  </Svg>
);

// File-text icon for PDFs and documents
export const FileTextIcon = ({ size = 16, color = "#374151" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Table/spreadsheet icon
export const TableIcon = ({ size = 16, color = "#374151" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={3} y={3} width={18} height={18} rx={2} fill="none" stroke={color} strokeWidth={2} />
    <Path d="M3 9h18M3 15h18M9 3v18M15 3v18" fill="none" stroke={color} strokeWidth={2} />
  </Svg>
);

// Presentation icon
export const PresentationIcon = ({ size = 16, color = "#374151" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={2} y={3} width={20} height={14} rx={2} fill="none" stroke={color} strokeWidth={2} />
    <Path d="M8 21l4-4 4 4M12 17v-4" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Archive/zip icon
export const ArchiveIcon = ({ size = 16, color = "#374151" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M21 8v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M23 3H1v5h22V3zM10 12h4"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Globe icon for external embeds (rich cards)
export const GlobeIcon = ({ size = 12, color = "#374151" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={10} fill="none" stroke={color} strokeWidth={2} />
    <Path
      d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      fill="none"
      stroke={color}
      strokeWidth={2}
    />
  </Svg>
);

// Clipboard icon for whiteboards
export const ClipboardIcon = ({ size = 12, color = "#6b7280" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Rect x={8} y={2} width={8} height={4} rx={1} fill="none" stroke={color} strokeWidth={2} />
  </Svg>
);

// Ruler/diagram icon for diagrams
export const DiagramIcon = ({ size = 12, color = "#6b7280" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M14 3v4a1 1 0 0 0 1 1h4"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"
      fill="none"
      stroke={color}
      strokeWidth={2}
    />
    <Path d="M9 9h1M9 13h6M9 17h6" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Work item / task icon
export const TaskIcon = ({ size = 14, color = "#374151" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={3} y={3} width={18} height={18} rx={2} fill="none" stroke={color} strokeWidth={2} />
    <Path d="M9 12l2 2 4-4" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Checkmark icon for checked task items
export const CheckIcon = ({ size = 10, color = "#ffffff" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M20 6L9 17l-5-5" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Helper to get file icon component based on file type
export const getFileIcon = (fileType: string, size = 16, color = "#374151") => {
  if (fileType.startsWith("image/")) return <ImageIcon size={size} color={color} />;
  if (fileType.startsWith("video/")) return <VideoIcon size={size} color={color} />;
  if (fileType.startsWith("audio/")) return <MusicIcon size={size} color={color} />;
  if (fileType.includes("pdf")) return <FileTextIcon size={size} color="#dc2626" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <TableIcon size={size} color="#16a34a" />;
  if (fileType.includes("document") || fileType.includes("word")) return <FileTextIcon size={size} color="#2563eb" />;
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return <PresentationIcon size={size} color="#ea580c" />;
  if (fileType.includes("zip") || fileType.includes("archive")) return <ArchiveIcon size={size} color={color} />;
  return <PaperclipIcon size={size} color={color} />;
};
