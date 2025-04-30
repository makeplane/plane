import { observer } from 'mobx-react'
import { useTranslation } from '@plane/i18n'
import AnalyticsSectionWrapper from '../analytics-section-wrapper'
import PriorityChart from './priority-chart'

const CustomizedInsights = observer(() => {
  const { t } = useTranslation()

  return (
    <AnalyticsSectionWrapper title={t('workspace_analytics.customized_insights')} className='col-span-1'>
      <PriorityChart />
    </AnalyticsSectionWrapper>
  )
})

export default CustomizedInsights