type TProps = {
  text: string;
};

export const ConjunctionLabel: React.FC<TProps> = (props) => {
  const { text } = props;

  return <p className="leading-4 text-sm text-custom-primary-100 font-medium font-mono uppercase">{text}</p>;
};
