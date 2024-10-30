import { Header } from "./header";

export const PiChatRoot = () => (
  <div className="md:flex h-full bg-pi-50">
    <div className="flex flex-col flex-1 px-page-x pt-4 pb-8 relative h-full">
      {/* Header */}
      <Header />
    </div>
  </div>
);
