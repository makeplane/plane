/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "@plane/react-theme";
import { Moon, Sun } from "lucide-react";

export const NavbarTheme = observer(function NavbarTheme() {
  // states
  const [appTheme, setAppTheme] = useState("light");
  // theme
  const { setTheme, theme } = useTheme();

  const handleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    if (!theme) return;
    setAppTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={handleTheme}
      className="relative grid size-7 place-items-center rounded-sm bg-layer-transparent hover:bg-layer-transparent-hover text-primary"
    >
      {appTheme === "light" ? <Moon className="shrink-0 size-3.5" /> : <Sun className="shrink-0 size-3.5" />}
    </button>
  );
});
