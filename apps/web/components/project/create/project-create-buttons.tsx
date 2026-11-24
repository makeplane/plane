/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useFormContext } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { DialogActions } from "@makeplane/propel/components/dialog";
import type { IProject } from "@plane/types";
// ui
// helpers
import { getTabIndex } from "@plane/utils";

type Props = {
  handleClose: () => void;
  isMobile?: boolean;
  /** Id of the form to submit when the action row is rendered outside it. */
  formId?: string;
};

function ProjectCreateButtons(props: Props) {
  const { t } = useTranslation();
  const { handleClose, isMobile = false, formId } = props;
  const {
    formState: { isSubmitting },
  } = useFormContext<IProject>();

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);

  return (
    <DialogActions>
      <Button
        variant="secondary"
        size="md"
        stretch="auto"
        label={t("common.cancel")}
        onClick={handleClose}
        tabIndex={getIndex("cancel")}
      />
      <Button
        variant="primary"
        size="md"
        stretch="auto"
        type="submit"
        form={formId}
        label={isSubmitting ? t("creating") : t("create_project")}
        loading={isSubmitting}
        tabIndex={getIndex("submit")}
      />
    </DialogActions>
  );
}

export default ProjectCreateButtons;
