import { Logo } from "@plane/ui";
import { getFileURL } from "@/helpers/file.helper";
import { TProject } from "@/plane-web/types";

type THeroSection = {
  project: TProject;
};
export const HeroSection = (props: THeroSection) => {
  const { project } = props;

  return (
    <div>
      <div className="relative h-[118px] w-full ">
        <img
          src={getFileURL(
            project.cover_image_url ??
              "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
          )}
          alt={project.name}
          className="absolute left-0 top-0 h-full w-full object-cover"
        />
      </div>
      <div className="relative px-page-x pt-page-y mt-2">
        <div className="absolute -top-[27px] h-10 w-10 flex-shrink-0 grid place-items-center rounded bg-custom-background-80">
          <Logo logo={project.logo_props} size={18} />
        </div>
        <div className="font-bold text-xl">{project.name}</div>
      </div>
    </div>
  );
};
