export const HeadingComp = ({
  heading,
  onClick,
}: {
  heading: string;
  onClick: (event: React.MouseEvent<HTMLParagraphElement, MouseEvent>) => void;
}) => (
  <h3
    onClick={onClick}
    className="ml-4 mt-3 cursor-pointer text-sm font-medium leading-[125%] tracking-tight hover:text-custom-primary max-md:ml-2.5"
    role="button"
  >
    {heading}
  </h3>
);

export const SubheadingComp = ({
  subHeading,
  onClick,
}: {
  subHeading: string;
  onClick: (event: React.MouseEvent<HTMLParagraphElement, MouseEvent>) => void;
}) => (
  <p
    onClick={onClick}
    className="ml-6 mt-2 cursor-pointer text-xs font-medium tracking-tight text-gray-400 hover:text-custom-primary"
    role="button"
  >
    {subHeading}
  </p>
);

export const HeadingThreeComp = ({
  heading,
  onClick,
}: {
  heading: string;
  onClick: (event: React.MouseEvent<HTMLParagraphElement, MouseEvent>) => void;
}) => (
  <p
    onClick={onClick}
    className="ml-8 mt-2 cursor-pointer text-xs font-medium tracking-tight text-gray-400 hover:text-custom-primary"
    role="button"
  >
    {heading}
  </p>
);
