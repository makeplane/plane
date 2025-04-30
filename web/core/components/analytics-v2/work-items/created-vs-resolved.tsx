
import { useMemo } from 'react'
import { observer } from 'mobx-react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { useTranslation } from '@plane/i18n'
import { AreaChart } from '@plane/propel/charts/area-chart'
import { IChartResponseV2, TAreaItem } from '@plane/types'
import { renderFormattedDate } from '@plane/utils'
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { AnalyticsV2Service } from '@/services/analytics-v2.service'
import AnalyticsSectionWrapper from '../analytics-section-wrapper'



const analyticsV2Service = new AnalyticsV2Service()
const CreatedVsResolved = observer(() => {
    const { selectedDuration, selectedDurationLabel } = useAnalyticsV2()
    const params = useParams();
    const { t } = useTranslation()
    const workspaceSlug = params.workspaceSlug as string;
    const { data: createdVsResolvedData } = useSWR(
        `created-vs-resolved-${workspaceSlug}-${selectedDuration}`,
        () => analyticsV2Service.getAdvanceAnalyticsCharts<IChartResponseV2>(workspaceSlug, 'work-items', {
            date_filter: selectedDuration
        }),
    )
    const parsedData = useMemo(() => {
        if (!createdVsResolvedData?.data) return []
        return createdVsResolvedData.data.map((datum) => ({
            ...datum,
            [datum.key]: datum.count,
            name: renderFormattedDate(datum.key)
        }))
    }, [createdVsResolvedData])

    const areas: TAreaItem<string>[] = [
        {
            key: "completed_issues",
            label: "Resolved",
            fill: "#19803833",
            fillOpacity: 1,
            stackId: "bar-one",
            showDot: false,
            smoothCurves: true,
            strokeColor: "#198038",
            strokeOpacity: 1,
        },
        {
            key: "created_issues",
            label: "Created",
            fill: "#1192E833",
            fillOpacity: 1,
            stackId: "bar-one",
            showDot: false,
            smoothCurves: true,
            strokeColor: "#1192E8",
            strokeOpacity: 1,
        },

    ]

    return (
        <AnalyticsSectionWrapper title={t('workspace_analytics.created_vs_resolved')} subtitle={selectedDurationLabel} className='col-span-1'>
            <AreaChart
                className="w-full h-[350px]"
                data={parsedData}
                areas={areas}
                xAxis={{
                    key: "name",
                    label: "Date",
                }}
                yAxis={{
                    key: "count",
                    label: "Number of Issues",
                    offset: -30,
                    dx: -22,
                }}
                legend={{
                    align: "left",
                    verticalAlign: "bottom",
                    layout: "horizontal",
                    wrapperStyles: {
                        justifyContent: "start",
                        alignContent: "start",
                        paddingLeft: "40px",
                        paddingTop: "10px",
                    }
                }}
            />
        </AnalyticsSectionWrapper>
    )
})

export default CreatedVsResolved