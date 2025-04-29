import { cn } from '@plane/utils'
import React from 'react'

type Props = {
  title?: string,
  children: React.ReactNode
  className?: string
  subtitle?: string | null,
  actions?: React.ReactNode
}

const AnalyticsSectionWrapper: React.FC<Props> = (props) => {
  const { title, children, className, subtitle, actions } = props
  return (
    <div className={cn('', className)}>
      <div className='flex items-center justify-between  gap-4 mb-6 '>
        {title && <div className='flex  gap-2 items-center '>
          <h1 className={'text-lg font-medium'}>{title}</h1>
          {subtitle && <p className='text-lg text-custom-text-300'> • {subtitle}</p>}
        </div>}
        {actions}
      </div>
      {children}
    </div>
  )
}

export default AnalyticsSectionWrapper