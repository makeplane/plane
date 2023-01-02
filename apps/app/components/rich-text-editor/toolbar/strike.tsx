import { useCommands, useActive } from "@remirror/react";

export const StrikeButton = () => {
  const { toggleStrike } = useCommands();
  return <button onClick={toggleStrike}>Strike</button>;
};
