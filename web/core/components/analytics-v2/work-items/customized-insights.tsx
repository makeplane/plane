import { BarChart } from '@plane/propel/charts/bar-chart'
import { LineChart } from '@plane/propel/charts/line-chart'
import React from 'react'
import AnalyticsSectionWrapper from '../analytics-section-wrapper'
import { overviewDummyData } from '../temp-dummy-data'
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { observer } from 'mobx-react'

type Props = {}

const CustomizedInsights = observer((props: Props) => {
  const { selectedDuration, selectedDurationLabel } = useAnalyticsV2()
  return (
    <AnalyticsSectionWrapper title='Customized Insights' subtitle={selectedDurationLabel} className='col-span-1'>
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