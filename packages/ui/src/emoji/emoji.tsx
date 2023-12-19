import React, { FC } from "react";
// emoji-picker-react
import { Emoji } from "emoji-picker-react";

export interface ICustomEmoji {
  emojiId: string;
  size?: number;
}
export const CustomEmoji: FC<ICustomEmoji> = ({ emojiId, size = 24 }) => <Emoji unified={emojiId} size={size} />;
