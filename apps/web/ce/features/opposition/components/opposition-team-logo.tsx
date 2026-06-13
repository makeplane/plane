"use client";
import React, { useState } from "react";

interface Props {
  path: string | null;
  name: string;
}

export const TeamLogo = ({ path, name }: Props) => {
  const [error, setError] = useState(false);


  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http") || imagePath.startsWith("data:")) return imagePath;
    return `${process.env.NEXT_PUBLIC_CP_SERVER_URL}/blobs/${imagePath}`;
  };

  const fullUrl = path ? getImageUrl(path) : null;


  if (fullUrl && !error) {
    return (
      <img
        src={fullUrl}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    );
  }


  return (
    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl bg-zinc-900">
      {name.charAt(0).toUpperCase()}
    </div>
  );
};