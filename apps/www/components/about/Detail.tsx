// next imports
import Image from "next/image";

const Details = () => {
  return (
    <div className="bg-[#00091F] my-20 pt-10 relative">
      <div className="container mx-auto px-5 gap-6 text-white">
        <div className="text-4xl my-10 mt-20">Our Mission</div>
        <div className="max-w-4xl">
          The mission of Plane is to provide a powerful and user-friendly issue
          planning and tracking tool that is open-source and accessible to teams
          of all sizes. Our goal is to enable teams to easily plan, progress,
          and track their work, to improve collaboration, efficiency, and
          productivity.
        </div>
        <div className="text-4xl my-10 mt-20">Our Vision</div>
        <div className="max-w-4xl">
          Our vision for Plane is to be the leading open-source alternative to
          proprietary tools like JIRA and to provide teams with a flexible,
          customizable, and easy-to-use platform for managing their work. We aim
          to provide a range of features and integrations that make it easy for
          teams to collaborate, communicate, and stay on top of their projects
          without the need for expensive or complex software.
        </div>
      </div>
    </div>
  );
};

export default Details;
