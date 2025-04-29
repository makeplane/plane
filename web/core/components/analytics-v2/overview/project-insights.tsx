import React, { useMemo } from 'react'
import AnalyticsSectionWrapper from '../analytics-section-wrapper'
import dynamic from 'next/dynamic'
import { overviewDummyData } from '../temp-dummy-data'
import TrendPiece from '../trend-piece'
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { PROJECT_CREATED_AT_FILTER_OPTIONS } from '@plane/constants'
import { observer } from 'mobx-react'
import { AnalyticsV2Service } from '@/services/analytics-v2.service'
import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { useTranslation } from '@plane/i18n'
import { IAnalyticsRadarEntityV2, TChartData } from '@plane/types'
import AnalyticsV2EmptyState from '../empty-state'

const RadarChart = dynamic(() =>
  import("@plane/propel/charts/radar-chart").then((mod) => ({
    default: mod.RadarChart,
  }))
)

type Props = {}
const analyticsV2Service = new AnalyticsV2Service()

const ProjectInsights = observer((props: Props) => {
  const params = useParams();
  const { t } = useTranslation()
  const workspaceSlug = params.workspaceSlug as string;
  const { selectedProject, selectedDuration } = useAnalyticsV2()
  const selectedDurationLabel = useMemo(() => PROJECT_CREATED_AT_FILTER_OPTIONS.find(item => item.value === selectedDuration)?.name, [selectedDuration])

  const { data: projectInsightsData } = useSWR(
    `radar-chart-${workspaceSlug}`,
    () => analyticsV2Service.getAdvanceAnalyticsCharts<TChartData<string, string>[]>(workspaceSlug, 'projects', {
      created_at: selectedDuration
    }),
  )

  return (
    <div className="col-span-3 grid grid-cols-2 gap-10 ">
      <AnalyticsSectionWrapper title={`${t('workspace_analytics.project_insights')}`} subtitle={selectedDurationLabel} className='col-span-1'>
        {projectInsightsData && <RadarChart
          className='h-[350px]'
          data={projectInsightsData}
          dataKey='key'
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
          angleAxis={{
            key: 'name',
          }}
        />}
      </AnalyticsSectionWrapper>
      <AnalyticsSectionWrapper className='col-span-1 ' title=" ">
        <div className='text-sm text-custom-text-300'>{t('workspace_analytics.summary_of_projects')}</div>
        <div className=' border-b border-custom-border-100 py-2 mb-3'>{t('workspace_analytics.all_projects')}</div>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between text-sm text-custom-text-300'>
            <div>{t('workspace_analytics.trend_on_charts')}</div>
            <div>{t('common.work_items')}</div>
          </div>
          {projectInsightsData?.map((item) => (
            <div className='flex items-center justify-between text-sm text-custom-text-100'>
              <div>{item.name}</div>
              <div className='flex items-center gap-1'>
                {/* <TrendPiece key={item.key} size='xs' /> */}
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