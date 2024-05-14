// components
import { UserLoggedIn } from "@/components/accounts";
import { InstanceNotReady, InstanceFailureView } from "@/components/instance";
import { AuthView } from "@/components/views";
// helpers
// import { EPageTypes } from "@/helpers/authentication.helper";
// import { useInstance, useUser } from "@/hooks/store";
// wrapper
// import { AuthWrapper } from "@/lib/wrappers";
// lib
import { AppProvider } from "@/lib/app-providers";
// services
import { InstanceService } from "@/services/instance.service";
import { UserService } from "@/services/user.service";

const userServices = new UserService();
const instanceService = new InstanceService();

export default async function HomePage() {
  const instanceDetails = await instanceService.getInstanceInfo().catch(() => undefined);
  const user = await userServices
    .currentUser()
    .then((user) => ({ ...user, isAuthenticated: true }))
    .catch(() => ({ isAuthenticated: false }));

  if (!instanceDetails) {
    return <InstanceFailureView />;
  }

  if (!instanceDetails?.instance?.is_setup_done) {
    <InstanceNotReady />;
  }

  if (user.isAuthenticated) {
    return <UserLoggedIn />;
  }

  return (
    <AppProvider initialState={{ instance: instanceDetails.instance }}>
      <AuthView />
    </AppProvider>
  );
}
