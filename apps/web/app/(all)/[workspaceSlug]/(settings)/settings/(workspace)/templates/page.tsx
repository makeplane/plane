"use client";

import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import SettingsHeading from "@/components/settings/heading";
// ui
import { Button, CustomMenu } from "@plane/ui";
// hooks
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";

const WorkspaceTemplatesSettingsPage = observer(() => {
  const { t } = useTranslation();
  const router = useRouter();
  const { workspaceSlug } = useParams();

  const handleTemplateAction = (key: string) => {
    if (key === "project") {
      router.push(`/${workspaceSlug}/settings/templates/project`);
    } else {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Feature not implemented",
        message: "This feature is not yet available.",
      });
    }
  };

  return (
    <SettingsContentWrapper>
      <PageHead title="Templates" />
      <div className="w-full">
        <SettingsHeading
          title="模板"
          description="使用模板可以节省80%创建项目、工作项和页面所花费的时间。"
          customButton={
            <CustomMenu
              customButton={
                <Button
                  variant="primary"
                  className="bg-[#005c8f] hover:bg-[#005c8f]/90 text-white flex items-center gap-2"
                >
                  创建模板
                  <ChevronDown className="h-4 w-4" />
                </Button>
              }
              placement="bottom-end"
              closeOnSelect
            >
              <CustomMenu.MenuItem onClick={() => handleTemplateAction("project")}>项目模板</CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={() => handleTemplateAction("issue")}>工作项模板</CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={() => handleTemplateAction("page")}>页面模板</CustomMenu.MenuItem>
            </CustomMenu>
          }
        />
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-custom-text-300">Templates content goes here</p>
        </div>
      </div>
    </SettingsContentWrapper>
  );
});

export default WorkspaceTemplatesSettingsPage;
