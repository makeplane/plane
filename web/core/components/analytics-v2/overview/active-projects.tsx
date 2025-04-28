import React from 'react'
import AnalyticsSectionWrapper from '../analytics-section-wrapper'
import { overviewDummyData } from '../temp-dummy-data'
import ActiveProjectItem from './active-project-item'
import { EUpdateStatus } from '@plane/types/src/enums'
import { useTranslation } from '@plane/i18n'
type Props = {}

const ActiveProjects = (props: Props) => {
    const { t } = useTranslation()
    return (
        <AnalyticsSectionWrapper title={`${t('workspace_analytics.active_projects')}`} subtitle='last 30 days' className='col-span-2'>
            <div className='flex flex-col gap-4'>
                {overviewDummyData.active_projects.map((project) => (
                    <ActiveProjectItem key={project.label} icon={project.icon} label={project.label} status={project.status as EUpdateStatus} />
                ))}
            </div>
        </AnalyticsSectionWrapper>
    )
}



export default ActiveProjects
