// next
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";

type Props = {
  links: {
    label: string;
    href: string;
  }[];
};

const SettingsSidebar: React.FC<Props> = ({ links }) => {
  const router = useRouter();

  return (
    <nav className="h-screen w-72 border-r border-gray-200">
      <div className="mt-16 p-2 pl-6">
        <h2 className="flex items-center gap-2 text-lg font-medium leading-5">Settings</h2>
        <div className="mt-6 space-y-1">
          {links.map((link, index) => (
            <h4 key={index}>
              <Link href={link.href}>
                <a
                  className={`${
                    link.href === router.asPath
                      ? "bg-gray-200 text-gray-900"
                      : "hover:bg-gray-100 focus:bg-gray-100"
                  } flex items-center gap-3 rounded-md p-2 text-xs font-medium outline-none`}
                >
                  {link.label}
                </a>
              </Link>
            </h4>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default SettingsSidebar;
