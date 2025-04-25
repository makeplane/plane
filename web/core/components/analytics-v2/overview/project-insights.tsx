import React, { useMemo } from 'react'
import AnalyticsSectionWrapper from '../analytics-section-wrapper'
import dynamic from 'next/dynamic'
import { overviewDummyData } from '../temp-dummy-data'
import TrendPiece from '../trend-piece'
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { PROJECT_CREATED_AT_FILTER_OPTIONS } from '@plane/constants'
import { observer } from 'mobx-react'
const RadarChart = dynamic(() =>
  import("@plane/propel/charts/radar-chart").then((mod) => ({
    default: mod.RadarChart,
  }))
)

type Props = {}

const ProjectInsights = observer((props: Props) => {
  const { selectedProject, selectedDuration } = useAnalyticsV2()
  const selectedDurationLabel = useMemo(() => PROJECT_CREATED_AT_FILTER_OPTIONS.find(item => item.value === selectedDuration)?.name, [selectedDuration])
  return (
    <div className="col-span-3 grid grid-cols-2 gap-10 ">
      <AnalyticsSectionWrapper title='Project Insights' subtitle={selectedDurationLabel} className='col-span-1'>
        <RadarChart
          className='h-[350px]'
          data={overviewDummyData.graph_data}
          dataKey='entity'
          radars={[{
            key: 'count',
            name: 'Count',
            fill: 'rgba(var(--color-primary-300))',
            stroke: 'rgba(var(--color-primary-300))',
            fillOpacity: 0.6,
            dot: {
              r: 4,
              fillOpacity: 1,
            }
          }]}
          margin={{ top: 0, right: 40, bottom: 10, left: 40 }}
          showTooltip
        />
      </AnalyticsSectionWrapper>
      <AnalyticsSectionWrapper className='col-span-1 ' title=" ">
        <div className='text-sm text-custom-text-300'>Summary of projects</div>
        <div className=' border-b border-custom-border-100 py-2 mb-3'>All Projects</div>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between text-sm text-custom-text-300'>
            <div>Trend on charts</div>
            <div>Work items</div>
          </div>
          {overviewDummyData.graph_data.map((item) => (
            <div className='flex items-center justify-between text-sm text-custom-text-100'>
              <div>{item.entity}</div>
              <div className='flex items-center gap-1'>
                <TrendPiece key={item.entity} percentage={item.hike_percentage} size='xs' />
                <div className='text-custom-text-200'>{item.count}</div>
              </div>
            </div>
          ))}
        </div>
      </AnalyticsSectionWrapper>
    </div>
  )
})

export default ProjectInsights