// context
import { useChart } from "../hook";

export const ChartViewRoot = () => {
  const { view, viewData, dispatch } = useChart();

  console.log("state", view);
  console.log("state", viewData);
  console.log("state", dispatch);

  return (
    <div className="relative h-full w-full border border-red-500">
      <div className="relative flex h-full w-full overflow-hidden overflow-x-auto border border-green-500">
        {Array.from(Array(12).keys()).map((_itemRoot: any, _idxRoot: any) => (
          <div key={_idxRoot} className="relative flex flex-col border-2 border-red-500">
            <div>Hello</div>
            <div className="flex">
              {Array.from(Array(60).keys()).map((_item: any, _idx: any) => (
                <div
                  key={_idx}
                  className="relative flex !w-[30px] flex-col overflow-hidden border border-black"
                >
                  <div className="flex-shrink-0 border border-green-500">
                    <div>{_item + 1}</div>
                  </div>
                  <div className=" h-full w-full"> </div>
                  <div className="flex-shrink-0 border border-green-500">d </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
