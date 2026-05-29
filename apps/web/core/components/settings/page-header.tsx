import { Header } from "@plane/ui";

type Props = {
  leftItem?: React.ReactNode;
  rightItem?: React.ReactNode;
};

export function SettingsPageHeader(props: Props) {
  const { leftItem, rightItem } = props;

  return (
    <Header>
      {leftItem && <Header.LeftItem>{leftItem}</Header.LeftItem>}
      {rightItem && <Header.RightItem>{rightItem}</Header.RightItem>}
    </Header>
  );
}
