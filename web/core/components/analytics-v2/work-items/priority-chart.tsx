import { useMemo } from 'react'
import { observer } from 'mobx-react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { BarChart } from '@plane/propel/charts/bar-chart'
import { IChartResponseV2 } from '@plane/types'
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { AnalyticsV2Service } from '@/services/analytics-v2.service'
import { priorityBars } from '../utils'

const analyticsV2Service = new AnalyticsV2Service()
const PriorityChart = observer(() => {
  const { selectedDuration } = useAnalyticsV2()
  const params = useParams();

  const workspaceSlug = params.workspaceSlug as string;
  const { data: customizedInsightsChartData } = useSWR(
    `customized-insights-chart-${workspaceSlug}-${selectedDuration}`,
    () => analyticsV2Service.getAdvanceAnalyticsCharts<IChartResponseV2>(workspaceSlug, 'custom-work-items', {
      date_filter: selectedDuration
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