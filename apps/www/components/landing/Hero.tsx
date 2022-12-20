// next imports
import Image from "next/image";

const Hero = () => {
  return (
    <div className="relative ">
      <div className="bg-[#00091F] relative">
        <div className="absolute w-[100vw]">
          <img src="/background/hero.svg" className="w-full" alt="" />
        </div>
        {/* <div className="absolute w-full">
          <div className="flex-shrink-0 relative w-[100vw] h-[100vh]">
            <Image
              src={"/background/hero.svg"}
              className="w-full h-full object-cover rounded"
              layout="fill"
              alt="user"
            />
          </div>
        </div> */}
        <div className="container mx-auto px-5 pt-20 pb-16 text-center lg:pt-20 text-white relative z-20">
          <div className="text-center text-xl tracking-widest">P L A N E</div>
          <div className="text-4xl md:text-6xl max-w-[750px] mx-auto mt-10">
            <span className="text-gradient">Issue Tracking</span> tool you’ll
            fall in love with.
          </div>
          <div className="text-center max-w-xs mx-auto mt-6 text-lg font-thin">
            Plane helps you track your issues, epics, and product roadmaps.
          </div>
          <div className="max-w-md mx-auto flex items-center mt-8 gap-4">
            <button className="button-gradient text-white w-full rounded-lg py-2">
              Sign Up
            </button>
            <button className="border text-white w-full rounded-lg py-2">
              Read the Docs
            </button>
          </div>
        </div>

        <div className="container px-5 mx-auto relative z-20 md:mt-40">
          <div className="hidden lg:block absolute w-full h-full -top-40">
            <Image
              className="object-fill z-10"
              layout="fill"
              width="500"
              height="100%"
              src="/background/hero-dots.svg"
              alt="img"
            />
          </div>
          <div className="flex-shrink-0 relative w-full h-80 md:h-[600px] lg:h-[700px]">
            <Image
              src={"/images/demo.png"}
              className="w-full h-full object-contain rounded "
              layout="fill"
              alt="user"
            />
          </div>

          <div className="text-white mt-10 lg:mt-56 text-2xl md:text-5xl font-thin	max-w-6xl">
            With its intuitive UI and powerful features, Plane makes it easy to
            plan and track projects, assign tasks to team members, and monitor
            progress.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
