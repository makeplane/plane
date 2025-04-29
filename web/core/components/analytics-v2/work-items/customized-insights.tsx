import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { AnalyticsV2Service } from '@/services/analytics-v2.service'
import { useTranslation } from '@plane/i18n'
import { observer } from 'mobx-react'
import { useParams } from 'next/navigation'
import AnalyticsSectionWrapper from '../analytics-section-wrapper'
import PriorityChart from './priority-chart'

type Props = {}
const analyticsV2Service = new AnalyticsV2Service()
const CustomizedInsights = observer((props: Props) => {
  const { selectedDuration, selectedDurationLabel } = useAnalyticsV2()
  const params = useParams();
  const { t } = useTranslation()
  const workspaceSlug = params.workspaceSlug as string;

  return (
    <AnalyticsSectionWrapper title={t('workspace_analytics.customized_insights')} subtitle={selectedDurationLabel} className='col-span-1'>
      <PriorityChart />
    </AnalyticsSectionWrapper>
  )
})

export default CustomizedInsights