// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SignInView, UserLoggedIn } from "components/accounts";

export const LoginView = observer(() => {
  const { user: userStore } = useMobxStore();

  return (
    <>
      {userStore?.loader ? (
        <div className="relative flex h-screen w-screen items-center justify-center">Loading</div> // TODO: Add spinner instead
      ) : (
        <>{userStore.currentUser ? <UserLoggedIn /> : <SignInView />}</>
      )}
    </>
  );
});
