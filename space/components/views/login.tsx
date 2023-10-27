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
        <div className="relative w-screen h-screen flex justify-center items-center">Loading</div>
      ) : (
        <>{userStore.currentUser ? <UserLoggedIn /> : <SignInView />}</>
      )}
    </>
  );
});
