// next imports
import Image from "next/image";

const FeaturesTable = () => {
  const tableData = [
    {
      name: "Lorem ipsum",
      free: true,
      pro: true,
      enterprise: true
    },
    {
      name: "Lorem ipsum",
      free: true,
      pro: true,
      enterprise: true
    },
    {
      name: "Lorem ipsum",
      free: true,
      pro: true,
      enterprise: true
    },
    {
      name: "Lorem ipsum",
      free: true,
      pro: true,
      enterprise: true
    },
    {
      name: "Lorem ipsum",
      free: false,
      pro: true,
      enterprise: true
    },
    {
      name: "Lorem ipsum",
      free: false,
      pro: false,
      enterprise: true
    }
  ];
  return (
    <div className="w-full pb-20">
      <div className="container px-5 mx-auto overflow-auto">
        <table className="min-w-full">
          <thead className="rounded">
            <tr className="h-[50px]">
              <th
                scope="col"
                className="px-3 text-left font-medium text-[#ffffff] text-xl"
              >
                Lorem ipsum
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left font-medium text-[#ffffff] text-xl"
              >
                <div className="mb-14">Cloud Free</div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left font-medium text-[#ffffff] text-xl"
              >
                <div className="mb-14"> Cloud Pro</div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left font-medium text-[#ffffff] text-xl"
              >
                <div className="mb-14">Enterprise</div>
              </th>
            </tr>
          </thead>
          <tbody
            className="card-gradient mt-10 rounded-lg text-[#C0C0C0] divide-y divide-[#2A3144]"
          >
            {tableData.map((data: any) => (
              <tr key={`data-${data.id}`} className="m-2 h-[50px] rounded-lg">
                <td className="whitespace-nowrap px-3 py-4 text-">
                  {data.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4">
                  {data.free && (
                    <div className="flex-shrink-0 relative w-[24px] h-[24px]">
                      <Image
                        src="/icons/check-circle.svg"
                        className="w-full h-full object-contain rounded"
                        layout="fill"
                        alt="user"
                      />
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  {" "}
                  {data.pro && (
                    <div className="flex-shrink-0 relative w-[24px] h-[24px]">
                      <Image
                        src="/icons/check-circle.svg"
                        className="w-full h-full object-contain rounded"
                        layout="fill"
                        alt="user"
                      />
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  {data.enterprise && (
                    <div className="flex-shrink-0 relative w-[24px] h-[24px]">
                      <Image
                        src="/icons/check-circle.svg"
                        className="w-full h-full object-contain rounded"
                        layout="fill"
                        alt="user"
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <div className="mt-10"></div>
          <div className="text-white mb-4 text-xl px-3">Lorem ipsum</div>
          <tbody className="card-gradient mt-10 rounded overflow-hidden text-[#C0C0C0] divide-y divide-[#2A3144]">
            {tableData.map((data: any) => (
              <tr key={`data-${data.id}`} className="m-2 h-[50px]">
                <td className="whitespace-nowrap px-3 py-4 text-">
                  {data.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  {data.free && (
                    <div className="flex-shrink-0 relative w-[24px] h-[24px]">
                      <Image
                        src="/icons/check-circle.svg"
                        className="w-full h-full object-contain rounded"
                        layout="fill"
                        alt="user"
                      />
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  {" "}
                  {data.pro && (
                    <div className="flex-shrink-0 relative w-[24px] h-[24px]">
                      <Image
                        src="/icons/check-circle.svg"
                        className="w-full h-full object-contain rounded"
                        layout="fill"
                        alt="user"
                      />
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  {data.enterprise && (
                    <div className="flex-shrink-0 relative w-[24px] h-[24px]">
                      <Image
                        src="/icons/check-circle.svg"
                        className="w-full h-full object-contain rounded"
                        layout="fill"
                        alt="user"
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeaturesTable;
