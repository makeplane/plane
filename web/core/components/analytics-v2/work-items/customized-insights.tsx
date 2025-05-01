import { observer } from 'mobx-react'
import { useForm } from 'react-hook-form'
import { ChartXAxisProperty, ChartYAxisMetric } from '@plane/constants'
import { useTranslation } from '@plane/i18n'
import { IAnalyticsV2Params } from '@plane/types'
import AnalyticsSectionWrapper from '../analytics-section-wrapper'
import { AnalyticsV2SelectParams } from '../select/analytics-params'
import PriorityChart from './priority-chart'

const CustomizedInsights = observer(() => {
  const { t } = useTranslation()
  const { control, watch } = useForm<IAnalyticsV2Params>({
    defaultValues: {
      x_axis: ChartXAxisProperty.PRIORITY,
      y_axis: ChartYAxisMetric.WORK_ITEM_COUNT,
    },
  })

  const params = {
    x_axis: watch('x_axis'),
    y_axis: watch('y_axis'),
    group_by: watch('group_by'),
  }

  return (
    <AnalyticsSectionWrapper title={t('workspace_analytics.customized_insights')} className='col-span-1'
      actions={
        <AnalyticsV2SelectParams
          control={control}
        />
      }
    >
      <PriorityChart x_axis={params.x_axis} y_axis={params.y_axis} group_by={params.group_by} />
    </AnalyticsSectionWrapper>
  )
})

export default CustomizedInsights