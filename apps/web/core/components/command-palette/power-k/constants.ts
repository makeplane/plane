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

// core
import type { TPowerKModalPageDetails } from "@/components/power-k/ui/modal/constants";
// local imports
import type { TPowerKPageTypeExtended } from "./types";

export const POWER_K_MODAL_PAGE_DETAILS_EXTENDED: Record<TPowerKPageTypeExtended, TPowerKModalPageDetails> = {
  "open-teamspace": {
    i18n_placeholder: "power_k.page_placeholders.open_teamspace",
  },
  "open-initiative": {
    i18n_placeholder: "power_k.page_placeholders.open_initiative",
  },
  "open-customer": {
    i18n_placeholder: "power_k.page_placeholders.open_customer",
  },
  "change-initiative-state": {
    i18n_placeholder: "power_k.page_placeholders.change_initiative_state",
  },
  "change-initiative-lead": {
    i18n_placeholder: "power_k.page_placeholders.change_initiative_lead",
  },
};
