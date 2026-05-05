/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import { Link } from "react-router";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { LinkIcon, LockIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IBankWideProject } from "@plane/types";
import { copyUrlToClipboard, renderFormattedDate } from "@plane/utils";
import { CoverImage } from "@/components/common/cover-image";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  project: IBankWideProject;
};

export const BankWideProjectCard = function BankWideProjectCard({ project }: Props) {
  const projectCardRef = useRef<HTMLAnchorElement>(null);
  const { isMobile } = usePlatformOS();

  const projectLink = `${project.workspace_slug}/projects/${project.id}/issues`;
  const handleCopyText = () =>
    copyUrlToClipboard(projectLink).then(() =>
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      })
    );

  return (
    <Link
      ref={projectCardRef}
      to={`/${project.workspace_slug}/projects/${project.id}/issues/`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col justify-between group/project-card border border-subtle bg-layer-2 hover:shadow-raised-200 hover:border-strong w-full rounded-lg overflow-hidden duration-300 transition-all"
    >
      {/* Cover image section */}
      <div className="relative h-[118px] w-full rounded-t">
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/60 to-transparent" />
        <CoverImage
          src={project.cover_image_url}
          alt={project.name}
          className="absolute left-0 top-0 h-full w-full rounded-t"
        />
        <div className="absolute bottom-4 z-[1] flex h-10 w-full items-center justify-between gap-3 px-4">
          <div className="flex flex-grow items-center gap-2.5 truncate">
            <div className="h-9 w-9 flex-shrink-0 grid place-items-center rounded-sm bg-white/10">
              <Logo logo={project.logo_props} size={18} />
            </div>
            <div className="flex w-full flex-col justify-between gap-0.5 truncate">
              <h3 className="truncate font-semibold text-on-color">{project.name}</h3>
              <span className="flex items-center gap-1.5">
                <p className="text-11 font-medium text-on-color">{project.identifier}</p>
                {project.network === 0 && <LockIcon className="h-2.5 w-2.5 text-on-color" />}
              </span>
            </div>
          </div>
          <div className="flex h-full flex-shrink-0 items-center gap-2">
            <button
              className="flex h-6 w-6 items-center justify-center rounded-sm bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleCopyText();
              }}
            >
              <LinkIcon className="h-3 w-3 text-on-color" />
            </button>
          </div>
        </div>
      </div>

      {/* Description + member section */}
      <div className="flex h-[104px] w-full flex-col justify-between rounded-b-sm p-4">
        <p className="line-clamp-2 break-words text-13 text-tertiary">
          {project.description && project.description.trim() !== ""
            ? project.description
            : `Created on ${renderFormattedDate(project.created_at)}`}
        </p>
        <div className="item-center flex justify-between">
          <div className="flex items-center justify-center gap-2">
            <Tooltip
              isMobile={isMobile}
              tooltipHeading="Members"
              tooltipContent={project.member_count > 0 ? `${project.member_count} Members` : "No Member"}
              position="top"
            >
              <span className="text-13 italic text-placeholder">
                {project.member_count > 0 ? `${project.member_count} Members` : "No Member Yet"}
              </span>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded px-1.5 py-0.5 text-11 font-medium bg-layer-1 text-secondary">
              {project.workspace_name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
