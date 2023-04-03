import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { THEMES } from "constants/themes";

export const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      {THEMES.map((themeName) => (
        <option value={themeName}>{themeName}</option>
      ))}
    </select>
  );
};
