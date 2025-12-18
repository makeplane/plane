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
    <div className="bg-gray-800 text-white p-4 rounded-md w-full max-w-md">
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
          className="flex-1 px-3 py-2 rounded-md border border-gray-600 bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && handleEmbed()}
        />

        <button
          onClick={handleEmbed}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
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
