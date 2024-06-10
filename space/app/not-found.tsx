"use client";

import Image from "next/image";
// assets
import UserLoggedInImage from "public/user-logged-in.svg";

const NotFound = () => (
  <div className="h-screen w-screen grid place-items-center">
    <div className="text-center">
      <div className="mx-auto size-52 grid place-items-center rounded-full bg-custom-background-80">
        <div className="size-32">
          <Image src={UserLoggedInImage} alt="User already logged in" />
        </div>
      </div>
      <h1 className="mt-12 text-3xl font-semibold">Not Found</h1>
      <p className="mt-4">Please enter the appropriate project URL to view the issue board.</p>
    </div>
  </div>
);

export default NotFound;
