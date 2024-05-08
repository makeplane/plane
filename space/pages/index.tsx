import { observer } from "mobx-react-lite";
import { NextPage } from "next";
// components
import { AuthView } from "@/components/views";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// wrapper
import { AuthWrapper } from "@/lib/wrappers";

const Index: NextPage = observer(() => (
  <AuthWrapper pageType={EPageTypes.INIT}>
    <AuthView />
  </AuthWrapper>
));

export default Index;
