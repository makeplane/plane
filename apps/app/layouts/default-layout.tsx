// layouts
import Container from "layouts/container";
// types
import type { Props } from "./types";

const DefaultLayout: React.FC<Props> = ({ meta, children }) => (
  <Container meta={meta}>
    <div className="w-full h-screen overflow-auto bg-gray-50">
      <>{children}</>
    </div>
  </Container>
);

export default DefaultLayout;
