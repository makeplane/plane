/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader, ToggleSwitch } from "@plane/ui";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// hooks
import { useInstance } from "@/hooks/store";
// types
import type { Route } from "./+types/page";
// local
import { InstanceEmailForm } from "./email-config-form";

const InstanceEmailPage = observer(function InstanceEmailPage(_props: Route.ComponentProps) {
  // store
  const { fetchInstanceConfigurations, formattedConfig, disableEmail } = useInstance();

  const { isLoading } = useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSMTPEnabled, setIsSMTPEnabled] = useState(false);

  const handleToggle = async () => {
    if (isSMTPEnabled) {
      setIsSubmitting(true);
      try {
        await disableEmail();
        setIsSMTPEnabled(false);
        setToast({
          title: "Эл. почта отключена",
          message: "Функция эл. почты была отключена",
          type: TOAST_TYPE.SUCCESS,
        });
      } catch (_error) {
        setToast({
          title: "Ошибка при отключении эл. почты",
          message: "Не удалось отключить функцию эл. почты. Попробуйте ещё раз.",
          type: TOAST_TYPE.ERROR,
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    setIsSMTPEnabled(true);
  };
  useEffect(() => {
    if (formattedConfig) {
      setIsSMTPEnabled(formattedConfig.ENABLE_SMTP === "1");
    }
  }, [formattedConfig]);

  return (
    <PageWrapper
      header={{
        title: "Безопасная отправка писем с вашего собственного экземпляра",
        description: (
          <>
            Gizmo может отправлять полезные письма вам и вашим пользователям с вашего собственного экземпляра без обращения к интернету.
            <div className="text-13 font-regular text-tertiary">
              Настройте параметры ниже и обязательно проверьте их перед сохранением.&nbsp;
              <span className="text-danger-primary">Неверная настройка может привести к недоставке писем и ошибкам.</span>
            </div>
          </>
        ),
        actions: isLoading ? (
          <Loader>
            <Loader.Item width="24px" height="16px" className="rounded-full" />
          </Loader>
        ) : (
          <ToggleSwitch value={isSMTPEnabled} onChange={handleToggle} size="sm" disabled={isSubmitting} />
        ),
      }}
    >
      {isSMTPEnabled && !isLoading && (
        <>
          {formattedConfig ? (
            <InstanceEmailForm config={formattedConfig} />
          ) : (
            <Loader className="space-y-10">
              <Loader.Item height="50px" width="75%" />
              <Loader.Item height="50px" width="75%" />
              <Loader.Item height="50px" width="40%" />
              <Loader.Item height="50px" width="40%" />
              <Loader.Item height="50px" width="20%" />
            </Loader>
          )}
        </>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Настройки эл. почты - God Mode" }];

export default InstanceEmailPage;
