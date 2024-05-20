"use client";

import Image from "next/image";
// assets
import UserLoggedInImage from "public/user-logged-in.svg";

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="grid h-full w-full place-items-center p-6">
        <div className="text-center">
          <div className="mx-auto grid h-52 w-52 place-items-center rounded-full bg-custom-background-80">
            <div className="h-32 w-32">
              <Image src={UserLoggedInImage} alt="User already logged in" />
            </div>
          </div>
          <h1 className="mt-12 text-3xl font-semibold">Not Found</h1>
          <p className="mt-4">Please enter the appropriate project URL to view the issue board.</p>
        </div>
      </div>
    </div>
  );
}
