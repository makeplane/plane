// next
import Link from "next/link";
// hooks
import useUser from "lib/hooks/useUser";
// types
import { ICycle } from "types";
import SingleStat from "./single-stat";

type Props = {
  cycles: ICycle[];
};

const CycleStatsView: React.FC<Props> = ({ cycles }) => {
  return (
    <>
      {cycles.map((cycle) => (
        <SingleStat key={cycle.id} cycle={cycle} />
      ))}
    </>
  );
};

export default CycleStatsView;
