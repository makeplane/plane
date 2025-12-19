"use client";

import { useState } from "react";

interface EmbedInputProps {
  onEmbed: (url: string) => void;
  onCancel?: () => void;
}

export default function EmbedInput({
  onEmbed,
  onCancel,
}: EmbedInputProps) {
  const [link, setLink] = useState("");

  const handleEmbed = () => {
    if (!link.trim()) return;
    onEmbed(link.trim());
    setLink("");
  };

  return (
    <div className="bg-custom-background-90 border border-custom-border-300 rounded-md p-3 pt-1 shadow-lg z-[9999] w-75" >
      <p className="text-gray-400 text-sm mb-2">
        Works with YouTube, Figma, Google Docs and more
      </p>

      <div className="flex gap-2">
        <input
          autoFocus
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Enter or paste a link"
          className="block bg-transparent text-sm placeholder-custom-text-400 rounded-md border-[0.5px] px-3 py-2 w-full min-w-[250px] focus:outline-none focus:ring-1 border-custom-border-300 focus:ring-custom-primary-200"
          onKeyDown={(e) => e.key === "Enter" && handleEmbed()}
        />

        <button
          onClick={handleEmbed}
          className="text-white bg-custom-primary-100 hover:bg-custom-primary-200 focus:text-custom-brand-40 focus:bg-custom-primary-200 px-3 py-1.5 font-medium text-xs rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center"
        >
          Embed
        </button>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-2 text-xs text-gray-400 hover:text-gray-200"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
