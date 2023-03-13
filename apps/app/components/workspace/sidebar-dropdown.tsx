import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
// hooks
import useUser from "hooks/use-user";
import useTheme from "hooks/use-theme";
import useWorkspaces from "hooks/use-workspaces";
// services
import userService from "services/user.service";
import authenticationService from "services/authentication.service";
// components
import { Avatar, Loader, Tooltip } from "components/ui";
// helper
import { truncateText } from "helpers/string.helper";

// types
import { IWorkspace } from "types";

// Static Data
const userLinks = (workspaceSlug: string) => [
  {
    name: "Workspace Settings",
    href: `/${workspaceSlug}/settings`,
  },
  {
    name: "Workspace Invites",
    href: "/invitations",
  },
  {
    name: "My Profile",
    href: `/${workspaceSlug}/me/profile`,
  },
];

export const WorkspaceSidebarDropdown = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // fetching user details
  const { user, mutateUser } = useUser();
  // fetching theme context
  const { collapsed: sidebarCollapse } = useTheme();
  // fetching workspaces
  const { activeWorkspace, workspaces } = useWorkspaces();

  const handleWorkspaceNavigation = (workspace: IWorkspace) => {
    userService
      .updateUser({
        last_workspace_id: workspace?.id,
      })
      .then(() => {
        mutateUser();
        router.push(`/${workspace.slug}/`);
      })
      .catch((err) => console.error(err));
  };

  const handleSignOut = async () => {
    await authenticationService
      .signOut()
      .then((response) => {
        console.log("user signed out", response);
      })
      .catch((error) => {
        console.log("Failed to sign out", error);
      })
      .finally(() => {
        mutateUser();
        router.push("/signin");
      });
  };

  return (
    <div className="relative">
      <Menu as="div" className="col-span-4 inline-block w-full p-5 text-left">
        <div className="flex w-full items-center justify-between gap-2.5">
          <Menu.Button
            className={`inline-flex w-full items-center rounded-md px-1 py-2 text-sm font-semibold text-gray-700 focus:outline-none `}
          >
            <div className="flex w-full items-center gap-x-2 rounded-md bg-gray-100 px-2 py-1.5">
              <div className="relative flex h-6 w-6 items-center justify-center rounded bg-gray-700 p-2 uppercase text-white">
                {activeWorkspace?.logo && activeWorkspace.logo !== "" ? (
                  <Image
                    src={activeWorkspace.logo}
                    alt="Workspace Logo"
                    layout="fill"
                    objectFit="cover"
                    className="rounded"
                  />
                ) : (
                  activeWorkspace?.name?.charAt(0) ?? "..."
                )}
              </div>

              {!sidebarCollapse && (
                <p className="text-base">
                  {activeWorkspace?.name
                    ? activeWorkspace.name.length > 17
                      ? `${activeWorkspace.name.substring(0, 15)}...`
                      : activeWorkspace.name
                    : "Loading..."}
                </p>
              )}
            </div>
          </Menu.Button>

          {!sidebarCollapse && (
            <Link href={`/${workspaceSlug}/me/profile`}>
              <a>
                <div className="flex flex-grow justify-end">
                  <Avatar user={user} height="32px" width="32px" fontSize="14px" />
                </div>
              </a>
            </Link>
          )}
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items
            className="fixed left-2 z-20 mt-1  flex w-full max-w-[17rem] origin-top-left flex-col rounded-md
          bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <div className="flex flex-col items-start justify-start gap-3 px-5 py-3">
              <Menu.Item as="div" className="text-sm text-gray-500">
                {user?.email}
              </Menu.Item>
              <span className="text-sm font-semibold text-gray-500">Workspace</span>

              {workspaces ? (
                <div className="flex h-full w-full flex-col items-start justify-start gap-3.5">
                  {workspaces.length > 0 ? (
                    workspaces.map((workspace) => (
                      <Menu.Item key={workspace.id}>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() => handleWorkspaceNavigation(workspace)}
                            className="flex w-full items-center justify-between gap-1 rounded-md text-sm text-gray-900"
                          >
                            <div className="flex items-center justify-start gap-2.5">
                              <span className="relative flex h-6 w-6 items-center justify-center rounded bg-gray-700 p-2 text-xs uppercase text-white">
                                {workspace?.logo && workspace.logo !== "" ? (
                                  <Image
                                    src={workspace.logo}
                                    alt="Workspace Logo"
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded"
                                  />
                                ) : (
                                  activeWorkspace?.name?.charAt(0) ?? "N"
                                )}
                              </span>

                              <h5 className="text-sm">
                                {truncateText(workspace.name, 18)}
                              </h5>
                            </div>
                            <span className="p-1">
                              <CheckIcon
                                className={`h-3 w-3.5 text-gray-600 ${
                                  active || workspace.id === activeWorkspace?.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                            </span>
                          </button>
                        )}
                      </Menu.Item>
                    ))
                  ) : (
                    <p>No workspace found!</p>
                  )}
                  <Menu.Item
                    as="button"
                    type="button"
                    onClick={() => {
                      router.push("/create-workspace");
                    }}
                    className="flex w-full items-center gap-1 text-sm text-gray-600"
                  >
                    <PlusIcon className="h-3 w-3 text-gray-600" />
                    Create Workspace
                  </Menu.Item>
                </div>
              ) : (
                <div className="w-full">
                  <Loader className="space-y-2">
                    <Loader.Item height="30px" />
                    <Loader.Item height="30px" />
                  </Loader>
                </div>
              )}
            </div>
            <div className="flex w-full flex-col items-start justify-start gap-2 border-t border-t-gray-200 px-3 py-2 text-sm">
              {userLinks(workspaceSlug as string).map((link, index) => (
                <Menu.Item
                  key={index}
                  as="div"
                  className="flex w-full items-center justify-start rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <Link href={link.href}>
                    <a>{link.name}</a>
                  </Link>
                </Menu.Item>
              ))}
            </div>
            <div className="w-full border-t border-t-gray-200 px-3 py-2">
              <Menu.Item
                as="button"
                type="button"
                className="flex w-full items-center justify-start rounded px-2 py-1 text-sm text-red-600 hover:bg-gray-100"
                onClick={handleSignOut}
              >
                Sign out
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};
