// plane imports
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
};

export function DocumentContentLoader(props: Props) {
  const { className } = props;

  return (
    <div className={cn("document-editor-loader", className)}>
      <Loader className="relative space-y-4">
        <div className="space-y-2">
          <div className="py-2">
            <Loader.Item width="100%" height="36px" />
          </div>
          <Loader.Item width="80%" height="22px" />
          <div className="relative flex items-center gap-2">
            <Loader.Item width="30px" height="30px" />
            <Loader.Item width="30%" height="22px" />
          </div>
          <div className="py-2">
            <Loader.Item width="60%" height="36px" />
          </div>
          <Loader.Item width="70%" height="22px" />
          <Loader.Item width="30%" height="22px" />
          <div className="relative flex items-center gap-2">
            <Loader.Item width="30px" height="30px" />
            <Loader.Item width="30%" height="22px" />
          </div>
          <div className="py-2">
            <Loader.Item width="50%" height="30px" />
          </div>
          <Loader.Item width="100%" height="22px" />
          <div className="py-2">
            <Loader.Item width="30%" height="30px" />
          </div>
          <Loader.Item width="30%" height="22px" />
          <div className="relative flex items-center gap-2">
            <div className="py-2">
              <Loader.Item width="30px" height="30px" />
            </div>
            <Loader.Item width="30%" height="22px" />
          </div>
        </div>
      </Loader>
    </div>
  );
}
