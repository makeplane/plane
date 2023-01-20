import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
// hooks
import useUser from "hooks/use-user";
import useTheme from "hooks/use-theme";
import useWorkspaces from "hooks/use-workspaces";
// services
import userService from "services/user.service";
import authenticationService from "services/authentication.service";
// components
import { Loader } from "components/ui";

// types
import { IWorkspace } from "types";

// Static Data
const userLinks = (workspaceSlug: string) => [
  {
    name: "My Profile",
    href: `/${workspaceSlug}/me/profile`,
  },
  {
    name: "Workspace Invites",
    href: "/invitations",
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
      <Menu as="div" className="col-span-4 inline-block w-full text-left">
        <div className="w-full">
          <Menu.Button
            className={`inline-flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-semibold text-gray-700 focus:outline-none ${
              !sidebarCollapse
                ? "border border-gray-300 shadow-sm hover:bg-gray-50 focus:bg-gray-50"
                : ""
            }`}
          >
            <div className="flex items-center gap-x-1">
              <div className="relative flex h-5 w-5 items-center justify-center rounded bg-gray-700 p-4 uppercase text-white">
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
                <p className="ml-1 text-left">
                  {activeWorkspace?.name
                    ? activeWorkspace.name.length > 17
                      ? `${activeWorkspace.name.substring(0, 17)}...`
                      : activeWorkspace.name
                    : "Loading..."}
                </p>
              )}
            </div>
            {!sidebarCollapse && (
              <div className="flex flex-grow justify-end">
                <ChevronDownIcon className="ml-2 h-3 w-3" aria-hidden="true" />
              </div>
            )}
          </Menu.Button>
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
          <Menu.Items className="fixed left-2 z-20 mt-1 w-full max-w-[14rem] origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="divide-y px-1 py-2">
              <div>
                <Menu.Item as="div" className="px-2 pb-2 text-xs">
                  {user?.email}
                </Menu.Item>
              </div>
              <div className="py-2">
                {workspaces ? (
                  <>
                    {workspaces.length > 0 ? (
                      workspaces.map((workspace) => (
                        <Menu.Item key={workspace.id}>
                          {({ active }) => (
                            <button
                              type="button"
                              onClick={() => handleWorkspaceNavigation(workspace)}
                              className={`${
                                active ? "bg-gray-100" : ""
                              } flex w-full items-center gap-2 rounded-md p-2 text-sm text-gray-900`}
                            >
                              <div className="relative flex h-5 w-5 items-center justify-center rounded bg-gray-700 p-4 uppercase text-white">
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
                              </div>
                              <div className="text-left">
                                <h5 className="text-sm">{workspace.name}</h5>
                                <div className="text-xs text-gray-500">
                                  {workspace.total_members} members
                                </div>
                              </div>
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
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-gray-100"
                    >
                      <PlusIcon className="h-3 w-3" />
                      Create Workspace
                    </Menu.Item>
                  </>
                ) : (
                  <div className="w-full">
                    <Loader className="space-y-2">
                      <Loader.Item height="30px" />
                      <Loader.Item height="30px" />
                    </Loader>
                  </div>
                )}
              </div>
              <div className="space-y-1 pt-2 text-xs">
                {userLinks(workspaceSlug as string).map((link, index) => (
                  <Menu.Item key={index} as="div">
                    <Link href={link.href}>
                      <a className="block rounded px-2 py-1 text-left hover:bg-gray-100">
                        {link.name}
                      </a>
                    </Link>
                  </Menu.Item>
                ))}
                <Menu.Item
                  as="button"
                  type="button"
                  className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
                  onClick={handleSignOut}
                >
                  Sign out
                </Menu.Item>
              </div>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};
