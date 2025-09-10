export const MaintenanceMessage = () => {
  const linkMap = [
    {
      key: "mail_to",
      label: "Contact Support",
      value: "mailto:support@plane.so",
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-xl font-semibold text-custom-text-100 text-left">
          &#x1F6A7; Looks like Plane didn&apos;t start up correctly!
        </h1>
        <span className="text-base font-medium text-custom-text-200 text-left">
          Some services might have failed to start. Please check your container logs to identify and resolve the issue.
          If you&apos;re stuck, reach out to our support team for more help.
        </span>
      </div>
      <div className="flex items-center justify-start gap-6 mt-1">
        {linkMap.map((link) => (
          <div key={link.key}>
            <a
              href={link.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-custom-primary-100 hover:underline text-sm"
            >
              {link.label}
            </a>
          </div>
        ))}
      </div>
    </>
  );
};
