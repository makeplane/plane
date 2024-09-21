import Image from "next/image";
// assets
import SomethingWentWrongImage from "public/something-went-wrong.svg";

export const SomethingWentWrongError = () => (
  <div className="grid min-h-screen w-full place-items-center p-6">
    <div className="text-center">
      <div className="mx-auto grid h-52 w-52 place-items-center rounded-full bg-custom-background-80">
        <div className="grid h-32 w-32 place-items-center">
          <Image src={SomethingWentWrongImage} alt="Oops! Something went wrong" />
        </div>
      </div>
      <h1 className="mt-12 text-3xl font-semibold">Oops! Something went wrong.</h1>
      <p className="mt-4 text-custom-text-300">The public board does not exist. Please check the URL.</p>
    </div>
  </div>
);
