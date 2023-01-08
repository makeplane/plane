type Props = {
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
};

const Header: React.FC<Props> = ({ breadcrumbs, left, right }) => {
  return (
    <>
      <div className="flex w-full flex-col justify-between gap-y-4 border-b border-gray-200 bg-gray-50 px-5 py-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2">
          {breadcrumbs}
          {left}
        </div>
        {right}
      </div>
    </>
  );
};

export default Header;
