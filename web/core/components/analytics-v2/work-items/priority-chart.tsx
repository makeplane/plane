import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { AnalyticsV2Service } from '@/services/analytics-v2.service'
import { BarChart } from '@plane/propel/charts/bar-chart'
import { ICustomizedInsightsChartV2 } from '@plane/types'
import { observer } from 'mobx-react'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import useSWR from 'swr'
import { priorityBars } from '../utils'

type Props = {}
const analyticsV2Service = new AnalyticsV2Service()
const PriorityChart = observer((props: Props) => {
  const { selectedDuration, selectedDurationLabel } = useAnalyticsV2()
  const params = useParams();

  const workspaceSlug = params.workspaceSlug as string;
  const { data: customizedInsightsChartData } = useSWR(
    `customized-insights-chart-${workspaceSlug}`,
    () => analyticsV2Service.getAdvanceAnalyticsCharts<ICustomizedInsightsChartV2>(workspaceSlug, 'custom-work-items', {
      created_at: selectedDuration
    }),
  )

  const parsedData = useMemo(() => {
    if (!customizedInsightsChartData?.data) return []
    return customizedInsightsChartData.data.map((datum) => ({
      ...datum,
      [datum.key]: datum.count
    }))

  }, [customizedInsightsChartData?.data])

  return (
    <BarChart
      className="w-full h-[370px]"
      data={parsedData}
      bars={priorityBars}
      xAxis={{
        key: "name",
      }}
      yAxis={{
        key: "count",
        label: "No of Work Items",
      }}

    />
  )
})

export default PriorityChart