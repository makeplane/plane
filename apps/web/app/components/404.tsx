import { Link } from "react-router";
import NotFoundImage from "@/app/assets/images/404.svg?url";

export default function NotFound() {
  return (
    <div className="h-screen w-full overflow-hidden bg-custom-background-100">
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="relative mx-auto h-60 w-60 lg:h-80 lg:w-80">
            <img src={NotFoundImage} alt="404 - Page not found" className="h-full w-full object-contain" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Oops! Something went wrong.</h3>
            <p className="text-sm text-custom-text-200">Sorry, the page you are looking for cannot be found.</p>
          </div>
          <Link to="/" className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
