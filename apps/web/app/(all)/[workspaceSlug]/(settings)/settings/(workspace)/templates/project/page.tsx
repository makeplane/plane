"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
// components
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import SettingsHeading from "@/components/settings/heading";
// hooks
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";

const ProjectTemplatesSettingsPage = observer(() => {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();

  return (
    <SettingsContentWrapper>
      <PageHead title="Project Templates" />
      <div className="w-full">
        <Link
          href={`/${workspaceSlug}/settings/templates`}
          className="flex items-center gap-2 text-sm font-semibold text-custom-text-300 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          返回
        </Link>
        <SettingsHeading title="新建项目模板" />
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-custom-text-300">Project Templates content goes here</p>
        </div>
      </div>
    </SettingsContentWrapper>
  );
});

export default ProjectTemplatesSettingsPage;
