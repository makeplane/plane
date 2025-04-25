
// plane package imports
import { useTranslation } from '@plane/i18n';
import { IAnalyticsResponseV2, TAnalyticsTabsV2Base } from '@plane/types';
import useSWR from 'swr';
//hooks
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2';
//services
import { AnalyticsV2Service } from '@/services/analytics-v2.service';
// plane web components
import InsightCard from './insight-card';
import { observer } from 'mobx-react-lite';
import { useParams } from 'next/navigation';
import { insightsFields } from '@plane/constants';


const analyticsV2Service = new AnalyticsV2Service();

const TotalInsights: React.FC<{ analyticsType: TAnalyticsTabsV2Base }> = observer(({ analyticsType }) => {
    const params = useParams();
    const workspaceSlug = params.workspaceSlug as string;
    const { t } = useTranslation()
    const { selectedDuration, selectedProject } = useAnalyticsV2()

    const { data: totalInsightsData, isLoading } = useSWR(`total-insights-${analyticsType}-${selectedDuration}-${selectedProject}`,
        () => analyticsV2Service.getAdvanceAnalytics<IAnalyticsResponseV2>(workspaceSlug, analyticsType, {
            date_filter: selectedDuration,
            ...(selectedProject ? { project_ids: selectedProject } : {})
        }))

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10'>
            {insightsFields[analyticsType].map((item: string) => (
                <InsightCard key={`${analyticsType}-${item}`} isLoading={isLoading} data={totalInsightsData?.[item]} label={t(`workspace_analytics.${item}`)} />
            ))}
        </div>
    )
})

export default TotalInsights;