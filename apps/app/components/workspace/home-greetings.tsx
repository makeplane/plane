// hooks
import useUser from "hooks/use-user";
// ui
import { Loader } from "components/ui";

export const WorkspaceHomeGreetings = () => {
  // user information
  const { user } = useUser();

  const hours = new Date().getHours();

  return (
    <>
      {user ? (
        <div className="text-2xl font-medium">
          Good{" "}
          {hours >= 4 && hours < 12
            ? "Morning"
            : hours >= 12 && hours < 17
            ? "Afternoon"
            : "Evening"}
          , {user.first_name}!
        </div>
      ) : (
        <Loader>
          <Loader.Item height="2rem" width="20rem" />
        </Loader>
      )}
    </>
  );
};
