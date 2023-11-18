import { FC, ReactNode } from "react";
// layouts
import { UserAuthWrapper } from "layouts/auth-layout";
// components
import { InstanceAdminSidebar } from "./sidebar";
import { InstanceAdminHeader } from "./header";

export interface IInstanceAdminLayout {
  children: ReactNode;
}

export const InstanceAdminLayout: FC<IInstanceAdminLayout> = (props) => {
  const { children } = props;

  return (
    <>
      <UserAuthWrapper>
        <div className="relative flex h-screen w-full overflow-hidden">
          <InstanceAdminSidebar />
          <main className="relative flex flex-col h-full w-full overflow-hidden bg-custom-background-100">
            <InstanceAdminHeader />
            <div className="h-full w-full overflow-hidden">
              <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">
                <>{children}</>
              </div>
            </div>
          </main>
        </div>
      </UserAuthWrapper>
    </>
  );
};
