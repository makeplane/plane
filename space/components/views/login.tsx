// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SignInView, UserLoggedIn } from "components/accounts";

export const LoginView = observer(() => {
  const { user: userStore } = useMobxStore();

  if (!userStore.currentUser) return <SignInView />;

  return <UserLoggedIn />;
});
