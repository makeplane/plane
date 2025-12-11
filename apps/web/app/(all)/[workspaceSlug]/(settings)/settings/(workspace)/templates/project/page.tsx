"use client";

import { useState, type ChangeEvent } from "react";
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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    project_info: {
      name: "",
      identifier: "",
      description: "",
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const parts = name.split(".");
    if (parts.length === 1) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setFormData((prev) => {
      const updated: any = { ...prev };
      let obj = updated as any;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        obj[key] = { ...(obj[key] || {}) };
        obj = obj[key];
      }
      obj[parts[parts.length - 1]] = value;
      return updated;
    });
  };

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
        <div className="pt-5">
          <div className="">
            <input
              id="name"
              type="text"
              name="name"
              className="block placeholder-custom-text-400 focus:outline-none rounded border-none bg-transparent ring-0 w-full text-lg font-bold p-0"
              autoComplete="off"
              placeholder="为您的项目模板命名。"
              value={formData.name}
              onChange={handleChange}
            />
            <textarea
              id="description"
              name="description"
              className="no-scrollbar placeholder-custom-text-400 outline-none rounded border-none bg-transparent ring-0 w-full text-base min-h-[80px] p-0 resize-none pt-4"
              placeholder="描述何时以及如何使用此模板。"
              style={{ height: "80px" }}
              value={formData.description}
              onChange={handleChange}
            />
            <div className="mt-9 space-y-6 pb-5">
              <div className="grid grid-cols-1 gap-x-2 gap-y-3 md:grid-cols-4">
                <div className="md:col-span-3">
                  <input
                    id="project_name"
                    className="block bg-transparent text-sm placeholder-custom-text-400 focus:outline-none rounded-md border-[0.5px] border-custom-border-200 px-3 py-2 w-full focus:border-blue-400"
                    autoComplete="off"
                    placeholder="项目名称"
                    type="text"
                    value={formData.project_info.name}
                    name="project_info.name"
                    onChange={handleChange}
                  />
                </div>
                <div className="relative">
                  <input
                    id="project_identifier"
                    className="block bg-transparent placeholder-custom-text-400 focus:outline-none rounded-md border-[0.5px] border-custom-border-200 px-3 py-2 w-full text-xs focus:border-blue-400 pr-7"
                    autoComplete="off"
                    placeholder="项目ID"
                    type="text"
                    value={formData.project_info.identifier}
                    name="project_info.identifier"
                    onChange={handleChange}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-info absolute right-2 top-2.5 h-3 w-3 text-custom-text-400"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <div className="md:col-span-4">
                  <textarea
                    id="project_description"
                    name="project_info.description"
                    className="no-scrollbar w-full bg-transparent placeholder-custom-text-400 outline-none rounded-md border-[0.5px] border-custom-border-200 px-3 py-2 !h-24 text-sm focus:border-blue-400"
                    placeholder="描述"
                    style={{ height: "0px" }}
                    value={formData.project_info.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsContentWrapper>
  );
});

export default ProjectTemplatesSettingsPage;
