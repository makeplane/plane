import { BarChart } from '@plane/propel/charts/bar-chart'
import { LineChart } from '@plane/propel/charts/line-chart'
import React from 'react'
import AnalyticsSectionWrapper from '../analytics-section-wrapper'
import { overviewDummyData } from '../temp-dummy-data'
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { observer } from 'mobx-react'
import useSWR from 'swr'
import { AnalyticsV2Service } from '@/services/analytics-v2.service'
import { useParams } from 'next/navigation'
import { AreaChart } from '@plane/propel/charts/area-chart'
import { useTranslation } from '@plane/i18n'

type Props = {}
const analyticsV2Service = new AnalyticsV2Service()
const CustomizedInsights = observer((props: Props) => {
  const { selectedDuration, selectedDurationLabel } = useAnalyticsV2()
  const params = useParams();
  const { t } = useTranslation()
  const workspaceSlug = params.workspaceSlug as string;
  const { data: customizedInsightsChartData } = useSWR(
    analyticsV2Service.getAdvanceAnalyticsCharts(workspaceSlug, 'work-items', {
      created_at: selectedDuration
    }),
    analyticsV2Service.getAdvanceAnalyticsCharts
  )

  return (
    <AnalyticsSectionWrapper title={t('workspace_analytics.customized_insights')} subtitle={selectedDurationLabel} className='col-span-1'>
      <BarChart
        className="w-full h-[350px]"
        data={overviewDummyData.work_bar_data}
        bars={overviewDummyData.work_bars}
        xAxis={{
          key: "states",
          label: "States",
        }}
        yAxis={{
          key: "no_of_projects",
          label: "No. of Projects",
        }}
      />
    </AnalyticsSectionWrapper>
  )
})

export default CustomizedInsights