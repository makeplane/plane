import { FC } from "react";
import Link from "next/link";
import Image from "next/image";
// images
import userImage from "/public/user.png";

export const TequilaLoginButton: FC = () => (
  <div className="w-full flex justify-center items-center px-[3px]">
    <Link href="/api/login">
      <button className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-200 p-2 text-sm font-medium text-gray-600 duration-300 hover:bg-gray-50">
        <Image src={userImage} height={22} width={22} color="#000" alt="Tequila Logo" />
        <span>Sign In with Tequila</span>
      </button>
    </Link>
  </div>
);
