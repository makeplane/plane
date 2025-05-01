import React from 'react'
import Image from 'next/image';
import { cn } from '@plane/utils'

type Props = {
    title: string;
    description?: string;
    assetPath?: string;
    className?: string;
}

const AnalyticsV2EmptyState = ({
    title,
    description,
    assetPath,
    className,
}: Props) => (
    <div
        className={cn(
            "flex items-center justify-center min-h-full min-w-full overflow-y-auto py-10 md:px-20 px-5 border border-custom-border-100 rounded-lg",
            className
        )}
    >
        <div className={cn("flex flex-col gap-5")}>
            {assetPath && (
                <Image src={assetPath} alt={title} width={384} height={250} layout="responsive" lazyBoundary="100%" />
            )}
            <div className="flex flex-col gap-1.5 flex-shrink text-center items-center">
                <h3 className={cn("text-xl font-semibold")}>{title}</h3>
                {description && <p className="text-sm text-custom-text-300">{description}</p>}
            </div>

        </div>
    </div>
)

export default AnalyticsV2EmptyState