// components
import { UserLoggedIn } from "@/components/accounts";
import { AuthView } from "@/components/views";
// services
import { UserService } from "@/services/user.service";

const userServices = new UserService();

export default async function HomePage() {
  const user = await userServices
    .currentUser()
    .then((user) => ({ ...user, isAuthenticated: true }))
    .catch(() => ({ isAuthenticated: false }));

  if (user.isAuthenticated) {
    return <UserLoggedIn />;
  }

  return <AuthView />;
}
