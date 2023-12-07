import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
// layouts
import { AdminAuthWrapper, UserAuthWrapper } from "layouts/auth-layout";
// components
import { InstanceAdminSidebar } from "./sidebar";
import { InstanceAdminHeader } from "./header";
import { InstanceSetupView } from "components/instance";
// store
import { useMobxStore } from "lib/mobx/store-provider";

export interface IInstanceAdminLayout {
  children: ReactNode;
}

export const InstanceAdminLayout: FC<IInstanceAdminLayout> = observer((props) => {
  const { children } = props;
  // store
  const {
    instance: { instance },
  } = useMobxStore();

  if (instance?.is_setup_done === false) return <InstanceSetupView />;

  return (
    <>
      <UserAuthWrapper>
        <AdminAuthWrapper>
          <div className="relative flex h-screen w-full overflow-hidden">
            <InstanceAdminSidebar />
            <main className="relative flex flex-col h-full w-full overflow-hidden bg-custom-background-100">
              <InstanceAdminHeader />
              <div className="h-full w-full overflow-hidden px-10 py-12">
                <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">
                  <>{children}</>
                </div>
              </div>
            </main>
          </div>
        </AdminAuthWrapper>
      </UserAuthWrapper>
    </>
  );
});
