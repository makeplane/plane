import { FC } from 'react'
import { observer } from "mobx-react";
import { Row } from '@plane/ui';
//store
import { useIssueDetail } from "@/hooks/store"
//components
import { IssueIdentifier } from '@/plane-web/components/issues';
export interface INotificationItem {
    issueId: string;
    notificationsCount: number;
}
export const NotificationItem: FC<INotificationItem> = observer((props)=>{
    const { issueId, notificationsCount } = props;
    const { issue: { getIssueById }} = useIssueDetail();
    const issueDetail = getIssueById(issueId);

    if(!issueDetail) return null
    return (
        <div className="border-b">
            <Row>
                <IssueIdentifier issueId={issueDetail.id} projectId={issueDetail.project_id || ""} textContainerClassName="text-xs" />
            </Row>
        </div>
    )
})