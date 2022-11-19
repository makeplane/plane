import React from "react";
// next js
import Link from "next/link";
// hooks
import useUser from "lib/hooks/useUser";

const DefaultTopBar: React.FC = () => {
  const { user } = useUser();

  return (
    <div className="flex justify-between items-center px-4 h-16 sm:px-6 md:justify-start md:space-x-10 absolute top-0 w-full">
      <div className="w-full flex items-center justify-between">
        <div>
          <Link href="/">
            <a className="flex">
              <span className="sr-only">Plane</span>
              <h2 className="text-2xl font-semibold">
                Plan<span className="text-indigo-600">e</span>
              </h2>
            </a>
          </Link>
        </div>
        {user && (
          <div>
            <p className="text-sm text-gray-500">
              logged in as {user.first_name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DefaultTopBar;
