import { observer } from "mobx-react-lite";
import { NextPage } from "next";
// components
import { AuthView } from "@/components/views";
// store

const Index: NextPage = observer(() => <AuthView />);

export default Index;
