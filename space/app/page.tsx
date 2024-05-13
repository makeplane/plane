// components
import { UserLoggedIn } from "@/components/accounts";
import { AuthView } from "@/components/views";
// helpers
// import { EPageTypes } from "@/helpers/authentication.helper";
// import { useInstance, useUser } from "@/hooks/store";
// wrapper
// import { AuthWrapper } from "@/lib/wrappers";
// services
import { UserService } from "@/services/user.service";

const userServices = new UserService();

export default async function HomePage() {
  const user = await userServices
    .currentUser()
    .then((user) => ({ ...user, isAuthenticated: true }))
    .catch(() => ({ isAuthenticated: false }));

  // const { data } = useInstance();

  // console.log("data", data);
  console.log("user", user);

  if (user.isAuthenticated) {
    return <UserLoggedIn />;
  }

  // return <>Login View</>;
  return <AuthView />;
}
