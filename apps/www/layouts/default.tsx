import Navbar from "@components/NavBar";
import Footer from "@components/Footer";

const DefaultLayout = (props: any) => {
  return (
    <div className="absolute min-h-[400px] h-screen w-full bg-[#00091F]">
      <div>
        <Navbar />
      </div>
      <div className="relative w-full overflow-hidden">{props.children}</div>
      <div className="">
        <Footer />
      </div>
    </div>
  );
};

export default DefaultLayout;
