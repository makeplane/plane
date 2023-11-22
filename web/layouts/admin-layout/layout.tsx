import { FC, ReactNode } from "react";
// layouts
import { AdminAuthWrapper, UserAuthWrapper } from "layouts/auth-layout";
// components
import { InstanceAdminSidebar } from "./sidebar";

export interface IInstanceAdminLayout {
  children: ReactNode;
  header: ReactNode;
}

export const InstanceAdminLayout: FC<IInstanceAdminLayout> = (props) => {
  const { children, header } = props;

  return (
    <>
      <UserAuthWrapper>
        <AdminAuthWrapper>
          <div className="relative flex h-screen w-full overflow-hidden">
            <InstanceAdminSidebar />
            <main className="relative flex flex-col h-full w-full overflow-hidden bg-custom-background-100">
              {header}
              <div className="h-full w-full overflow-hidden">
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
};
