"use client";

import { observer } from "mobx-react";
// components
import { PageHeader } from "@/components/core";
import { InstanceSignUpForm } from "@/components/user-authentication-forms";

const RootPage = observer(() => (
  <>
    <PageHeader title="General Settings - God Mode" />
    <InstanceSignUpForm />
  </>
));

export default RootPage;
