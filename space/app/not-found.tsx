"use client";

import Image from "next/image";
// assets
import SomethingWentWrongImage from "public/something-went-wrong.svg";

const NotFound = () => (
  <div className="h-screen w-screen grid place-items-center">
    <div className="text-center">
      <div className="mx-auto size-32 md:size-52 grid place-items-center rounded-full bg-custom-background-80">
        <div className="size-16 md:size-32 grid place-items-center">
          <Image src={SomethingWentWrongImage} alt="User already logged in" />
        </div>
      </div>
      <h1 className="mt-8 md:mt-12 text-xl md:text-3xl font-semibold">That didn{"'"}t work</h1>
      <p className="mt-2 md:mt-4 text-sm md:text-base">
        Check the URL you are entering in the browser{"'"}s address bar and try again.
      </p>
    </div>
  </div>
);

export default NotFound;
