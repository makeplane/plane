export type TProjectStateIcon = {
  width?: string;
  height?: string;
  color?: string;
  className?: string | undefined;
};

export type TSvgIcons = React.SVGAttributes<SVGElement> & TProjectStateIcon;
