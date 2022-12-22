// next
import Image from "next/image";
import Link from "next/link";
// icons
import User from "public/user.png";
// types
import { IModule } from "types";
// common
import { renderShortNumericDateFormat } from "constants/common";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

type Props = {
  module: IModule;
};

const SingleModuleCard: React.FC<Props> = ({ module }) => {
  return (
    <div key={module.id} className="border bg-white p-3 rounded-md">
      <Link href={`/projects/${module.project}/modules/${module.id}`}>
        <a>{module.name}</a>
      </Link>
      <div className="grid grid-cols-4 gap-2 text-xs mt-4">
        <div className="space-y-2">
          <h6 className="text-gray-500">LEAD</h6>
          <div>
            {module.lead_detail?.avatar && module.lead_detail.avatar !== "" ? (
              <div className="h-5 w-5 border-2 border-white rounded-full">
                <Image
                  src={module.lead_detail.avatar}
                  height="100%"
                  width="100%"
                  className="rounded-full"
                  alt={module.lead_detail.first_name}
                />
              </div>
            ) : (
              <div className="h-5 w-5 bg-gray-700 text-white border-2 border-white grid place-items-center rounded-full capitalize">
                {module.lead_detail?.first_name && module.lead_detail.first_name !== ""
                  ? module.lead_detail.first_name.charAt(0)
                  : module.lead_detail?.email.charAt(0)}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h6 className="text-gray-500">MEMBERS</h6>
          <div className="flex items-center gap-1 text-xs">
            {module.members && module.members.length > 0 ? (
              module?.members_detail?.map((member, index: number) => (
                <div
                  key={index}
                  className={`relative z-[1] h-5 w-5 rounded-full ${index !== 0 ? "-ml-2.5" : ""}`}
                >
                  {member?.avatar && member.avatar !== "" ? (
                    <div className="h-5 w-5 border-2 bg-white border-white rounded-full">
                      <Image
                        src={member.avatar}
                        height="100%"
                        width="100%"
                        className="rounded-full"
                        alt={member?.first_name}
                      />
                    </div>
                  ) : (
                    <div className="h-5 w-5 bg-gray-700 text-white border-2 border-white grid place-items-center rounded-full capitalize">
                      {member?.first_name && member.first_name !== ""
                        ? member.first_name.charAt(0)
                        : member?.email?.charAt(0)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-5 w-5 border-2 bg-white border-white rounded-full">
                <Image
                  src={User}
                  height="100%"
                  width="100%"
                  className="rounded-full"
                  alt="No user"
                />
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h6 className="text-gray-500">END DATE</h6>
          <div className="flex items-center gap-1 border rounded shadow-sm px-1.5 py-0.5 cursor-pointer text-xs w-min whitespace-nowrap">
            <CalendarDaysIcon className="h-3 w-3" />
            {renderShortNumericDateFormat(module.target_date ?? "")}
          </div>
        </div>
        <div className="space-y-2">
          <h6 className="text-gray-500">STATUS</h6>
          <div className="capitalize">{module.status}</div>
        </div>
      </div>
    </div>
  );
};

export default SingleModuleCard;
