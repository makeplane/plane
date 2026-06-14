/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangleIcon } from "lucide-react";
// Gizmo imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProject } from "@plane/types";
import { Input, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type FormData = {
  projectName: string;
  confirmLeave: string;
};

const defaultValues: FormData = {
  projectName: "",
  confirmLeave: "",
};

export interface ILeaveProjectModal {
  project: IProject;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveProjectModal = observer(function LeaveProjectModal(props: ILeaveProjectModal) {
  const { project, isOpen, onClose } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { leaveProject } = useUserPermissions();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm({ defaultValues });

  const handleClose = () => {
    reset({ ...defaultValues });
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!workspaceSlug) return;

    if (data) {
      if (data.projectName === project?.name) {
        if (data.confirmLeave === "Покинуть проект") {
          router.push(`/${workspaceSlug}/projects`);
          return leaveProject(workspaceSlug.toString(), project.id)
            .then(() => {
              handleClose();
            })
            .catch((_err) => {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Ошибка!",
                message: "Что-то пошло не так. Попробуйте позже.",
              });
            });
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Ошибка!",
            message: "Подтвердите выход из проекта, введя «Покинуть проект».",
          });
        }
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Ошибка!",
          message: "Введите название проекта, как показано в описании.",
        });
      }
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Ошибка!",
        message: "Заполните все поля.",
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-6">
          <span className="place-items-center rounded-full bg-danger-subtle p-4">
            <AlertTriangleIcon className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-18 font-medium 2xl:text-20">Покинуть проект</h3>
          </span>
        </div>

        <span>
          <p className="text-13 leading-7 text-secondary">
            Вы уверены, что хотите покинуть проект —
            <span className="font-medium text-primary">{` "${project?.name}" `}</span>? Все связанные с вами рабочие
            элементы станут недоступны.
          </p>
        </span>

        <div className="text-secondary">
          <p className="text-13 break-words">
            Введите название проекта <span className="font-medium text-primary">{project?.name}</span>, чтобы продолжить:
          </p>
          <Controller
            control={control}
            name="projectName"
            rules={{
              required: "Укажите название проекта",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="projectName"
                name="projectName"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.projectName)}
                placeholder="Введите название проекта"
                className="mt-2 w-full"
              />
            )}
          />
        </div>

        <div className="text-secondary">
          <p className="text-13">
            Для подтверждения введите <span className="font-medium text-primary">Покинуть проект</span> ниже:
          </p>
          <Controller
            control={control}
            name="confirmLeave"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="confirmLeave"
                name="confirmLeave"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.confirmLeave)}
                placeholder="Введите «Покинуть проект»"
                className="mt-2 w-full"
              />
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Отмена
          </Button>
          <Button variant="error-fill" size="lg" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Выход..." : "Покинуть проект"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
