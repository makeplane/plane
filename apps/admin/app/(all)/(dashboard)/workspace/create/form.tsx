/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { WEB_BASE_URL, ORGANIZATION_SIZE, RESTRICTED_URLS } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Select, SelectContent, SelectItem, SelectList, SelectTrigger } from "@makeplane/propel/components/select";
import { InstanceWorkspaceService } from "@plane/services";
import type { IWorkspace } from "@plane/types";
import { validateSlug, validateWorkspaceName } from "@plane/utils";
// components
import { TOAST_TYPE, setToast } from "@/providers/toast";
// hooks
import { useWorkspace } from "@/hooks/store";

const instanceWorkspaceService = new InstanceWorkspaceService();

export function WorkspaceCreateForm() {
  // router
  const router = useRouter();
  // states
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  const [researchPurpose, setResearchPurpose] = useState<"GENERAL" | "PUBLIC_RESEARCH" | "PI_PRIVATE">("GENERAL");
  const [defaultValues, setDefaultValues] = useState<Partial<IWorkspace>>({
    name: "",
    slug: "",
    organization_size: "",
  });
  // store hooks
  const { createWorkspace } = useWorkspace();
  // form info
  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IWorkspace>({ defaultValues, mode: "onChange" });
  // derived values
  const [workspaceBaseURL, setWorkspaceBaseURL] = useState(() => encodeURI(WEB_BASE_URL || ""));

  useEffect(() => {
    if (!WEB_BASE_URL) {
      setWorkspaceBaseURL(encodeURI(window.location.origin + "/"));
    }
  }, []);

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    try {
      const slugStatus = await instanceWorkspaceService.slugCheck(formData.slug);
      if (slugStatus.status !== true || RESTRICTED_URLS.includes(formData.slug)) {
        setSlugError(true);
        return;
      }
      setSlugError(false);
      try {
        await createWorkspace({ ...formData, research_purpose: researchPurpose });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "创建成功",
          message: "工作空间已创建。",
        });
        router.push(`/workspace`);
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "创建失败",
          message: "未能创建工作空间，请重试。",
        });
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "创建失败",
        message: "工作空间创建失败，请检查网络后重试。",
      });
    }
  };

  useEffect(
    () => () => {
      // when the component unmounts set the default values to whatever user typed in
      setDefaultValues(getValues());
    },
    [getValues, setDefaultValues]
  );

  return (
    <div className="space-y-8">
      <div className="grid-col grid w-full max-w-4xl grid-cols-1 items-start justify-between gap-x-10 gap-y-6 lg:grid-cols-2">
        <div className="flex flex-col gap-1">
          <h4 className="text-13 text-tertiary">工作空间名称</h4>
          <div className="flex flex-col gap-1">
            <Controller
              control={control}
              name="name"
              rules={{
                validate: (value) =>
                  validateWorkspaceName(value, true) === true || "请输入有效的工作空间名称（最多 80 个字符）。",
              }}
              render={({ field: { value, ref, onChange } }) => (
                <InputGroup size="lg">
                  <Input
                    size="lg"
                    id="workspaceName"
                    type="text"
                    value={value}
                    onChange={(e) => {
                      onChange(e.target.value);
                      setValue("name", e.target.value);
                      setValue("slug", e.target.value.toLocaleLowerCase().trim().replace(/ /g, "-"), {
                        shouldValidate: true,
                      });
                    }}
                    ref={ref}
                    aria-invalid={Boolean(errors.name)}
                    placeholder="例如：产业化项目协作"
                  />
                </InputGroup>
              )}
            />
            <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-13 text-tertiary">工作空间用途</h4>
          <Select
            value={researchPurpose}
            onValueChange={(value) => setResearchPurpose(value as typeof researchPurpose)}
          >
            <SelectTrigger size="lg" />
            <SelectContent>
              <SelectList>
                <SelectItem value="GENERAL" label="普通工作空间" size="lg" />
                <SelectItem value="PUBLIC_RESEARCH" label="公共科研空间" size="lg" />
                <SelectItem value="PI_PRIVATE" label="主PI私有空间" size="lg" />
              </SelectList>
            </SelectContent>
          </Select>
          <span className="text-11 text-tertiary">新空间默认关闭科研模块，可在创建后单独启用。</span>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-13 text-tertiary">工作空间地址</h4>
          <div className="flex w-full items-center gap-0.5 rounded-md border-[0.5px] border-subtle px-3">
            <span className="text-13 whitespace-nowrap text-secondary">{workspaceBaseURL}</span>
            <Controller
              control={control}
              name="slug"
              rules={{
                validate: (value) => validateSlug(value) === true || "请输入有效的地址（最多 48 个字符）。",
              }}
              render={({ field: { onChange, value, ref } }) => (
                <Input
                  id="workspaceUrl"
                  type="text"
                  size="lg"
                  value={value.toLocaleLowerCase().trim().replace(/ /g, "-")}
                  onChange={(e) => {
                    if (/^[a-zA-Z0-9_-]+$/.test(e.target.value)) setInvalidSlug(false);
                    else setInvalidSlug(true);
                    onChange(e.target.value.toLowerCase());
                  }}
                  ref={ref}
                  aria-invalid={Boolean(errors.slug)}
                  placeholder="workspace-name"
                />
              )}
            />
          </div>
          {slugError && <p className="text-13 text-danger-primary">该地址已被使用，请更换。</p>}
          {invalidSlug && (
            <p className="text-13 text-danger-primary">{"地址仅支持英文字母、数字、短横线（-）和下划线（_）。"}</p>
          )}
          {errors.slug && <span className="text-11 text-danger-primary">{errors.slug.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-13 text-tertiary">预计成员规模</h4>
          <div className="w-full">
            <Controller
              name="organization_size"
              control={control}
              rules={{ required: "请选择成员规模。" }}
              render={({ field: { value, onChange } }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger size="lg" placeholder={<span className="text-placeholder">选择人数范围</span>} />
                  <SelectContent>
                    <SelectList>
                      {ORGANIZATION_SIZE.map((item) => (
                        <SelectItem key={item} value={item} label={item} size="lg" />
                      ))}
                    </SelectList>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.organization_size && (
              <span className="text-13 text-danger-primary">{errors.organization_size.message}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex max-w-4xl items-center gap-4 py-1">
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          onClick={handleSubmit(handleCreateWorkspace)}
          disabled={!isValid}
          loading={isSubmitting}
          label={isSubmitting ? "正在创建" : "新建工作空间"}
        />
        <Button
          variant="secondary"
          size="md"
          stretch="auto"
          nativeButton={false}
          render={<Link href="/workspace" />}
          label="返回"
        />
      </div>
    </div>
  );
}
