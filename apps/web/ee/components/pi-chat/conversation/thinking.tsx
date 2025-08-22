import Typing from "./typing";

export const Thinking = ({ text = "Thinking" }: { text?: string }) => (
  <div className="flex">
    <span className="text-base">{text} &nbsp;</span>
    <Typing />
  </div>
);
