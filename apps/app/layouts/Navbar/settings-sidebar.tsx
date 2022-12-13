// next
import Link from "next/link";
import { useRouter } from "next/router";

type Props = {
  links: Array<{
    label: string;
    href: string;
  }>;
};

const SettingsSidebar: React.FC<Props> = ({ links }) => {
  const router = useRouter();

  return (
    <nav className="h-screen w-72 border-r border-gray-200">
      <div className="h-full p-2 pt-4">
        <h2 className="text-lg font-medium leading-5">Settings</h2>
        <div className="mt-3">
          {links.map((link, index) => (
            <h4 key={index}>
              <Link href={link.href}>
                <a
                  className={`${
                    link.href === router.asPath
                      ? "bg-theme text-white"
                      : "hover:bg-indigo-100 focus:bg-indigo-100"
                  } flex items-center gap-3 p-2 text-xs font-medium rounded-md outline-none`}
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
