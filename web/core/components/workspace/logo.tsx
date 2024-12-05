// helpers
import { cn } from "@plane/editor";
import { getFileURL } from "@/helpers/file.helper";

type Props = {
  logo: string | null | undefined;
  name: string | undefined;
  classNames?: string;
};

export const WorkspaceLogo = (props: Props) => (
  <div
    className={cn(
      `relative grid h-6 w-6 flex-shrink-0 place-items-center uppercase ${
        !props.logo && "rounded bg-custom-primary-500 text-white"
      } ${props.classNames ? props.classNames : ""}`
    )}
  >
    {props.logo && props.logo !== "" ? (
      <img
        src={getFileURL(props.logo)}
        className="absolute left-0 top-0 h-full w-full rounded object-cover"
        alt="Workspace Logo"
      />
    ) : (
      (props.name?.charAt(0) ?? "...")
    )}
  </div>
);
