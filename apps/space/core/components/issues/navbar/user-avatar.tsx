import { Fragment, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { usePopper } from "react-popper";
import { LogOut } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { AuthService } from "@plane/services";
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useUser } from "@/hooks/store/use-user";

const authService = new AuthService();

export const UserAvatar = observer(function UserAvatar() {
  const pathName = usePathname();
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const labels = searchParams.get("labels") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const peekId = searchParams.get("peekId") || undefined;
  // hooks
  const { data: currentUser, signOut } = useUser();
  // states
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 40],
        },
      },
    ],
  });

  // derived values
  const { queryParam } = queryParamGenerator({ peekId, board, state, priority, labels });

  return (
    <div className="relative mr-2">
      {currentUser?.id ? (
        <div>
          <Popover as="div">
            <Popover.Button as={Fragment}>
              <button ref={setReferenceElement} className="flex items-center gap-2 rounded-sm border border-subtle p-2">
                <Avatar
                  name={currentUser?.display_name}
                  src={getFileURL(currentUser?.avatar_url)}
                  shape="square"
                  size="sm"
                  showTooltip={false}
                />
                <h6 className="text-11 font-medium text-secondary">
                  {currentUser?.display_name ||
                    `${currentUser?.first_name} ${currentUser?.first_name}` ||
                    currentUser?.email ||
                    "User"}
                </h6>
              </button>
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel>
                <div
                  className="z-10 overflow-hidden rounded-sm border border-subtle bg-surface-1 shadow-raised-200 p-1"
                  ref={setPopperElement}
                  style={styles.popper}
                  {...attributes.popper}
                >
                  {csrfToken && (
                    <form method="POST" action={`${API_BASE_URL}/auth/spaces/sign-out/`} onSubmit={signOut}>
                      <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
                      <input type="hidden" name="next_path" value={`${pathName}?${queryParam}`} />
                      <button
                        type="submit"
                        className="flex items-center gap-2 rounded-sm p-2 whitespace-nowrap hover:bg-layer-transparent-hover text-13 min-w-36 cursor-pointer"
                      >
                        <LogOut size={12} className="shrink-0 text-danger-primary" />
                        <div>Sign out</div>
                      </button>
                    </form>
                  )}
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>
        </div>
      ) : (
        <div className="flex-shrink-0">
          <Link href={`/?next_path=${pathName}?${queryParam}`}>
            <Button variant="secondary">Sign in</Button>
          </Link>
        </div>
      )}
    </div>
  );
});
