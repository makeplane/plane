import { observer } from 'mobx-react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { useTranslation } from '@plane/i18n'
import { TChartData } from '@plane/types'
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { AnalyticsV2Service } from '@/services/analytics-v2.service'
// import useSWR from 'swr'
import AnalyticsSectionWrapper from '../analytics-section-wrapper'
import AnalyticsV2EmptyState from '../empty-state'
import { ProjectInsightsLoader } from '../loaders'

const RadarChart = dynamic(() =>
  import("@plane/propel/charts/radar-chart").then((mod) => ({
    default: mod.RadarChart,
  }))
)


const analyticsV2Service = new AnalyticsV2Service()

const ProjectInsights = observer(() => {
  const params = useParams();
  const { t } = useTranslation()
  const workspaceSlug = params.workspaceSlug as string;
  const { selectedDuration, selectedDurationLabel } = useAnalyticsV2()

  const { data: projectInsightsData, isLoading: isLoadingProjectInsight } = useSWR(
    `radar-chart-${workspaceSlug}`,
    () => analyticsV2Service.getAdvanceAnalyticsCharts<TChartData<string, string>[]>(workspaceSlug, 'projects', {
      created_at: selectedDuration
    }),
  )


  return (
    <AnalyticsSectionWrapper title={`${t('workspace_analytics.project_insights')}`} subtitle={selectedDurationLabel} className='md:col-span-3'>
      {isLoadingProjectInsight ? <ProjectInsightsLoader /> :
        projectInsightsData && projectInsightsData?.length == 0 ?
          <AnalyticsV2EmptyState
            title={t('workspace_analytics.empty_state_v2.project_insights.title')}
            description={t('workspace_analytics.empty_state_v2.project_insights.description')}
            className='h-[200px]'
          /> :
          <div className='lg:flex gap-8'>
            {projectInsightsData && <RadarChart
              className='h-[350px] w-full lg:w-3/5'
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
            <div className='w-full lg:w-2/5'>
              <div className='text-sm text-custom-text-300'>{t('workspace_analytics.summary_of_projects')}</div>
              <div className=' border-b border-custom-border-100 py-2 mb-3'>{t('workspace_analytics.all_projects')}</div>
              <div className='flex flex-col gap-4'>
                <div className='flex items-center justify-between text-sm text-custom-text-300'>
                  <div>{t('workspace_analytics.trend_on_charts')}</div>
                  <div>{t('common.work_items')}</div>
                </div>
                {projectInsightsData?.map((item) => (
                  <div key={item.key} className='flex items-center justify-between text-sm text-custom-text-100'>
                    <div>{item.name}</div>
                    <div className='flex items-center gap-1'>
                      {/* <TrendPiece key={item.key} size='xs' /> */}
                      <div className='text-custom-text-200'>{item.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>}
    </AnalyticsSectionWrapper>

  )
})

export default ProjectInsights