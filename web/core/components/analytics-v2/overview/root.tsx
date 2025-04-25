import React from 'react'
import AnalyticsWrapper from '../analytics-wrapper'
import TotalInsights from '../total-insights'
import ProjectInsights from './project-insights'
import ActiveProjects from "./active-projects"

type Props = {}

const Overview: React.FC<Props> = (props) => {
  return (
    <AnalyticsWrapper title="Overview" >
      <div className='flex flex-col gap-14'>
        <TotalInsights analyticsType='overview' />
        <div className='gap-14 grid grid-cols-5'>
          <ProjectInsights />
          <ActiveProjects />
        </div>
      </div>
    </AnalyticsWrapper>
  )
}

export { Overview }