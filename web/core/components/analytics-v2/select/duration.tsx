// plane package imports
import React, { ReactNode } from 'react'
import { Calendar } from 'lucide-react'
import { ANALYTICS_V2_DURATION_FILTER_OPTIONS } from '@plane/constants'
import { useTranslation } from '@plane/i18n'
import { CustomSearchSelect } from '@plane/ui'
// plane web components
// components
import { TDropdownProps } from '@/components/dropdowns/types'

type Props = TDropdownProps & {
  value: string | null
  onChange: (val: typeof ANALYTICS_V2_DURATION_FILTER_OPTIONS[number]['value']) => void
  //optional
  button?: ReactNode
  dropdownArrow?: boolean
  dropdownArrowClassName?: string
  onClose?: () => void
  renderByDefault?: boolean
  tabIndex?: number
}

function DurationDropdown({
  placeholder = "Duration",
  onChange,
  value
}: Props) {
  useTranslation()

  const options = ANALYTICS_V2_DURATION_FILTER_OPTIONS.map((option) => ({
    value: option.value,
    query: option.name,
    content: (
      <div className="flex items-center gap-2 max-w-[300px]">
        <span className="flex-grow truncate">{option.name}</span>
      </div>
    ),
  }));
  return (
    <CustomSearchSelect
      value={value ? [value] : []}
      onChange={onChange}
      options={options}
      label={
        <div className="flex items-center gap-2 p-1 ">
          <Calendar className="w-4 h-4" />
          {value ? ANALYTICS_V2_DURATION_FILTER_OPTIONS.find(opt => opt.value === value)?.name : placeholder}
        </div>
      }
    />
  )
}

export default DurationDropdown