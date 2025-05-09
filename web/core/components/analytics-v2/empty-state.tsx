import React from 'react'
import Image from 'next/image';
// plane package imports
import { cn } from '@plane/utils'
import { useResolvedAssetPath } from '@/hooks/use-resolved-asset-path';

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
}: Props) => {
  const backgroundReolvedPath = useResolvedAssetPath({ basePath: "/empty-state/analytics-v2/empty-grid-background" });

  return (
    <div
      className={cn(
        "flex items-center justify-center h-full w-full overflow-y-auto py-10 md:px-20 px-5 border border-custom-border-100 rounded-lg",
        className
      )}
    >
      <div className={cn("flex flex-col items-center")}>
        {assetPath && (
          <div className="relative max-w-[200px] max-h-[200px] flex justify-center items-center">
            <Image
              src={assetPath}
              alt={title}
              width={100}
              height={100}
              layout="fixed"
              className='h-2/3 w-2/3 z-10'
            />
            <div className="absolute inset-0">
              <Image
                src={backgroundReolvedPath}
                alt={title}
                width={100}
                height={100}
                layout="fixed"
                className='h-full w-full'
              />
            </div>

          </div>
        )}
        <div className="flex flex-col gap-1.5 flex-shrink text-center items-center">
          <h3 className={cn("text-xl font-semibold")}>{title}</h3>
          {description && <p className="text-sm text-custom-text-300">{description}</p>}
        </div>

      </div>
    </div >
  )
}
export default AnalyticsV2EmptyState


