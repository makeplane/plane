import React from 'react'
import { LucideProps } from 'lucide-react';
import { EUpdateStatus } from '@plane/types/src/enums';
import { StatusOptions } from '@plane/constants';


type Props = {
    icon: React.ComponentType<LucideProps>,
    label: string,
    status: EUpdateStatus,
}
const StatusPill = ({ status }: { status: EUpdateStatus }) => {
    const StatusIcon = StatusOptions[status].icon;
    const statusColor = StatusOptions[status].color;
    const statusBackgroundColor = StatusOptions[status].backgroundColor;
    return (
        <div className='flex items-center gap-2 p-1 rounded text-xs'
            style={{ color: statusColor, backgroundColor: statusBackgroundColor }}
        >
            <StatusIcon className='w-4 h-4' />
            <span>{status}</span>
        </div>
    )
}
const ActiveProjectItem = (props: Props) => {
    const { icon: IconComponent, label, status } = props;
    return (
        <div className='flex gap-2 items-center justify-between  '>
            <div className='flex items-center gap-2'>
                <div className='rounded-xl bg-custom-background-80  w-8 h-8 flex items-center justify-center'>
                    <IconComponent size={16} />
                </div>
                <p className='text-sm font-medium'>{label}</p>
            </div>
            <StatusPill status={status} />
        </div>
    )
}

export default ActiveProjectItem