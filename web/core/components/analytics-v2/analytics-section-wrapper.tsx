import { cn } from '@plane/utils'
import React from 'react'

type Props = {
    title?: string,
    children: React.ReactNode
    className?: string
    subtitle?: string | null
}

const AnalyticsSectionWrapper: React.FC<Props> = (props) => {
    const { title, children, className, subtitle } = props
    return (
        <div className={cn('', className)}>
            {title && <div className='flex  gap-2 items-center mb-6 '>
                <h1 className={'text-lg font-medium'}>{title}</h1>
                {subtitle && <p className='text-lg text-custom-text-300'> • {subtitle}</p>}
            </div>}
            {children}
        </div>
    )
}

export default AnalyticsSectionWrapper