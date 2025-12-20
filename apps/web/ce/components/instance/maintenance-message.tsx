export function MaintenanceMessage() {
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-18 font-semibold text-primary text-left">
          &#x1F6A7; Looks like Plane didn&apos;t start up correctly!
        </h1>
        <span className="text-14 font-medium text-secondary text-left">
          Some services might have failed to start. Please check your container logs to identify and resolve the issue.
        </span>
      </div>
    </>
  );
}
