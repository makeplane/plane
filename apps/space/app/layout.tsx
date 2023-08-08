// root styles
import "styles/globals.css";

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className="antialiased w-100">
      <main>{children}</main>
    </body>
  </html>
);

export default RootLayout;
