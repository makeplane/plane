/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { STATE_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
// components
import { StateForm } from "@/components/project-states";

type TStateCreate = {
  groupKey: TStateGroups;
  shouldTrackEvents?: boolean;
  createStateCallback: TStateOperationsCallbacks["createState"];
  handleClose: () => void;
};

export const StateCreate = observer(function StateCreate(props: TStateCreate) {
  const { groupKey, createStateCallback, handleClose } = props;

  // states
  const [loader, setLoader] = useState(false);
  // i18n
  const { t } = useTranslation();

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<IState>) => {
    if (!groupKey) return { status: "error" };

    try {
      const response = await createStateCallback({ ...formData, group: groupKey });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("project_state.create.success"),
      });
      handleClose();
      return { status: "success" };
    } catch (error) {
      const errorStatus = error as { status: number; data: { error: string } };
      if (errorStatus?.status === 400) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("project_state.create.already_exists"),
        });
        return { status: "already_exists" };
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: errorStatus.data.error ?? t("project_state.create.error"),
        });
        return { status: "error" };
      }
    }
  };

  return (
    <StateForm
      data={{ name: "", description: "", color: STATE_GROUPS[groupKey].color }}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? t("creating") : t("create")}
    />
  );
});
