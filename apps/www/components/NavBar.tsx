import { Fragment } from "react";
// next imports
import Link from "next/link";
import { useRouter } from "next/router";
import { Popover, Transition } from "@headlessui/react";
import Image from "next/image";
// icons
import { MenuIcon, XIcon } from "@heroicons/react/outline";

const Header = () => {
  const router = useRouter();

  const MobileNavLink = ({ href, children }: any) => {
    return (
      <Popover.Button
        onClick={() => router.push(href)}
        className="block text-left"
      >
        <div className=" w-full hover:bg-gray-200 p-2">{children}</div>
      </Popover.Button>
    );
  };

  const navLinks = [
    { title: "Pricing", href: "/pricing" },
    { title: "Change-Log", href: "/change-log" },
    { title: "Documentation", href: "/docs" },
    { title: "Github", href: "https://github.com/makeplane/plane" }
  ];

  const MobileNavigation = () => {
    return (
      <Popover>
        <Popover.Button
          className="relative z-10 flex h-8 w-8 items-center justify-center outline-none"
          aria-label="Toggle Navigation"
        >
          {({ open }) =>
            open ? <XIcon width="28px" /> : <MenuIcon width="28px" />
          }
        </Popover.Button>
        <Transition.Root>
          <Transition.Child
            as={Fragment}
            enter="duration-150 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="duration-150 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Overlay className="fixed inset-0  bg-gray-300 bg-opacity-50" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="duration-150 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Popover.Panel
              as="div"
              className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white text-black p-4 text-lg tracking-tight  shadow-xl ring-1 outline-none"
            >
              {navLinks.map((data: any, index: number) => (
                <Fragment key={index}>
                  <MobileNavLink href={data.href}>{data.title}</MobileNavLink>
                </Fragment>
              ))}
              <hr className="m-2 border-slate-300/40" />
              <MobileNavLink href="/login">Sign in</MobileNavLink>
            </Popover.Panel>
          </Transition.Child>
        </Transition.Root>
      </Popover>
    );
  };

  return (
    <>
      <div className="w-full text-center text-white bg-[#001842] py-5 px-4">
        Plane is open source. Star our GitHub repo!
      </div>
      <div className="nav-border-gradient py-[1.5px] relative z-0">
        <div className="bg-[#00091F]">
          <header className="py-4 text-white nav-gradient relative z-10 ">
            <div className="container mx-auto px-5">
              <nav className="relative z-50 flex items-center justify-between">
                <div className="flex items-center md:gap-x-12 w-52">
                  <Link href="/" aria-label="Home">
                    <a title="Plan Everything" className="text-3xl">
                      <div className="flex-shrink-0 relative w-[30px] h-[30px]">
                        <Image
                          src={"/logo/plane.svg"}
                          className="w-full h-full object-cover rounded"
                          layout="fill"
                          alt="user"
                        />
                      </div>
                    </a>
                  </Link>
                </div>
                <div className="hidden md:flex md:gap-x-6">
                  {navLinks.map((data: any, index: number) => (
                    <Link key={index} href={data.href}>
                      <a
                        className={`inline-block rounded-lg py-1 px-2  ${
                          router.pathname.includes(data.href)
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        {data.title}
                      </a>
                    </Link>
                  ))}
                </div>
                <div className="flex items-center gap-x-5 md:gap-x-8 w-52 justify-end">
                  <div className="hidden md:block">
                    <Link href="/">
                      <a>Sign In</a>
                    </Link>
                  </div>
                  <Link href="http://app.plane.so" target="_blank">
                    <a className="button-gradient p-[1px] rounded text-white flex-shrink-0">
                      <div className="p-2 py-1 bg-[#001842] rounded">
                        <div className="text-gradient">Join Alpha</div>
                      </div>
                    </a>
                  </Link>
                  <div className="-mr-1 md:hidden">
                    <MobileNavigation />
                  </div>
                </div>
              </nav>
            </div>
          </header>
        </div>
      </div>
    </>
  );
};

export default Header;
