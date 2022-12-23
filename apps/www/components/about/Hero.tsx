const Hero = () => {
  return (
    <div className="bg-[#00091F] relative w-full overflow-visible">
      <div className="absolute w-[100vw] z-0">
        <img src="/background/hero.svg" className="w-full h-full" alt="" />
      </div>
      <div className="container mx-auto px-5 pt-20 pb-16 text-center lg:pt-20 text-white relative z-20">
        <div className="text-center text-xl tracking-widest">P L A N E</div>
        <div className="text-4xl md:text-6xl max-w-[700px] mx-auto mt-10">
          Want to know <br /> <span className="text-gradient">About Us</span>?
        </div>
        <div className="text-center max-w-md mx-auto mt-6 text-lg font-thin">
          Lorem ipsum dolor sit amet consectetur. Amet lacus iaculis ipsum nisi
          justo tortor ut justo.
        </div>
      </div>
    </div>
  );
};

export default Hero;
