import React from 'react'
import AnalyticsWrapper from '../analytics-wrapper'
import TotalInsights from '../total-insights'
import CustomizedInsights from './customized-insights'
import WorkItemsInsightTable from './workitems-insight-table'
import CreatedVsResolved from './created-vs-resolved'


type Props = {}

const WorkItems: React.FC<Props> = (props) => {
  return (
    <AnalyticsWrapper title="Work Items" >
      <div className='flex flex-col gap-14'>
        <TotalInsights analyticsType='work-items' />
        <CustomizedInsights />
        <CreatedVsResolved />
        <WorkItemsInsightTable />
      </div>
    </AnalyticsWrapper>
  )
}

export { WorkItems }