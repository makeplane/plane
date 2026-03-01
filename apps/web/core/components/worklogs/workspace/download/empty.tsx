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

import type { FC } from "react";
import { observer } from "mobx-react";

// TODO: Implement the WorklogDownloadEmptyScreen component and change the test based on the filters applied
export const WorklogDownloadEmptyScreen: FC = observer(() => (
  <div className="flex justify-center items-center text-13 text-tertiary py-10">No worklog downloads found</div>
));
