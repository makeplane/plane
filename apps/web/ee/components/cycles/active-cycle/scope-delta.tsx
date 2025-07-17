import { TrendingDown, TrendingUp } from "lucide-react";
import { TCycleProgress } from "@plane/types";
type Props = {
  data: Partial<TCycleProgress>[] | null;
  dataToday: Partial<TCycleProgress> | undefined;
};
const ScopeDelta = (props: Props) => {
  const { data, dataToday } = props;
  if (!data || !dataToday) return null;
  const prevIndex = data.findIndex((d) => d.date === dataToday.date) - 1;

  if (prevIndex < 0) return null;
  const prevData = data[prevIndex];

  if (prevData.scope === dataToday.scope || !prevData.scope) return null;
  const delta =
    prevData.scope === 0 ? 100 : Math.abs(((dataToday.scope || 0) - prevData.scope!) / prevData.scope!) * 100;
  return (
    <div className="flex text-indigo-400 font-medium">
      {prevData.scope! < dataToday.scope! ? (
        <>
          <TrendingUp className="w-[12px] h-[12px] my-auto mr-1" /> +
        </>
      ) : (
        <>
          <TrendingDown className="w-[14px] h-[14px] my-auto mr-1" /> -
        </>
      )}
      {Math.round(delta)}%
    </div>
  );
};
export default ScopeDelta;
