"use client"
import { observer } from "mobx-react";

// component
import Link from "next/link";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { EmailSettingsLoader } from "@/components/ui";
import { APPLICATIONS_LIST } from "@/constants/fetch-keys";
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { AppListRoot } from "@/plane-web/components/marketplace";
import { useApplications } from "@/plane-web/hooks/store";

const ApplicationsListPage = observer(() => {
    // store hooks
    const { workspaceUserInfo, allowPermissions } = useUserPermissions();
    const { currentWorkspace } = useWorkspace();
    const { slug: workspaceSlug } = currentWorkspace || {};
    const { fetchApplications, getApplicationsForWorkspace } = useApplications()

    // derived values
    const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
    const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Applications` : undefined;
    const applications = getApplicationsForWorkspace(workspaceSlug || "");


    const { data, isLoading } = useSWR(workspaceSlug ? APPLICATIONS_LIST(workspaceSlug) : null, workspaceSlug ? async () =>
        fetchApplications() : null
    );


    if (!data || isLoading || !applications) {
        return <EmailSettingsLoader />;
    }


    if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
        return <NotAuthorizedView section="settings" />;
    }


    return (
        <>
            <PageHead title={pageTitle} />
            <section className="w-full overflow-y-auto">
                <div className="flex items-center justify-between border-b border-custom-border-100 pb-3.5">
                    <div className="flex flex-col space-y-1">
                        <h3 className="text-base font-medium">Work with your Plane data in third-party apps or you own.</h3>
                        <h4 className="text-sm">View all the integrations in use by this workspace or you</h4>
                    </div>
                    <Link href={`create`}>
                        <Button variant="primary">Build your own</Button>
                    </Link>
                </div>
                {workspaceSlug && (
                    <AppListRoot apps={applications} />
                )}
            </section>
        </>
    );
});


export default ApplicationsListPage;