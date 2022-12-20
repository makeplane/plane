const Hero = () => {
  return (
    <div className="bg-[#00091F] relative w-full overflow-visible">
      <div className="absolute w-[100vw] z-0">
        <img src="/background/hero.svg" className="w-full" alt="" />
      </div>
      <div className="container mx-auto px-5 pt-20 pb-20 text-center lg:pt-20 text-white relative z-20">
        <div className="text-center text-xl tracking-widest">P L A N E</div>
        <div className="text-4xl md:text-6xl max-w-[700px] mx-auto mt-10">
          No-brainer <span className="text-gradient">Pricing</span> for
          everyone.
        </div>
        <div className="text-center max-w-md mx-auto mt-6 text-lg font-thin">
          Get started with Plane for free. Upgrade to Pro for unlimited support,
          file uploads, and access to premium features.
        </div>
      </div>
    </div>
  );
};

export default Hero;
