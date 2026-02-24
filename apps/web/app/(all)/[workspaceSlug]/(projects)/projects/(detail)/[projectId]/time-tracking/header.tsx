/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";

export const TimeTrackingHeader = observer(function TimeTrackingHeader() {
    const { workspaceSlug, projectId } = useParams();
    const { t } = useTranslation();
    const { loader } = useProject();

    return (
        <Header>
            <Header.LeftItem>
                <Breadcrumbs isLoading={loader === "init-loader"}>
                    <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
                    <Breadcrumbs.Item
                        component={
                            <BreadcrumbLink
                                label={t("time_tracking")}
                                href={`/${workspaceSlug}/projects/${projectId}/time-tracking/`}
                                icon={<Timer className="h-4 w-4 text-tertiary" />}
                                isLast
                            />
                        }
                        isLast
                    />
                </Breadcrumbs>
            </Header.LeftItem>
        </Header>
    );
});
