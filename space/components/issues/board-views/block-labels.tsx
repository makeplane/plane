"use client";

export const IssueBlockLabels = ({ labels }: any) => (
  <div className="relative flex items-center flex-wrap gap-1">
    {labels &&
      labels.length > 0 &&
      labels.map((_label: any) => (
        <div
          className={`h-[24px] rounded-sm flex px-1 items-center border gap-1 !bg-transparent !text-gray-700`}
          style={{ backgroundColor: `${_label?.color}10`, borderColor: `${_label?.color}50` }}
        >
          <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: `${_label?.color}` }} />
          <div className="text-sm">{_label?.name}</div>
        </div>
      ))}
  </div>
);
