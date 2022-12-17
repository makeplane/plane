type Props = {
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
};

const Header: React.FC<Props> = ({ breadcrumbs, left, right }) => {
  return (
    <>
      <div className="w-full bg-gray-50 border-b border-gray-200 flex justify-between items-center px-5 py-4">
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
