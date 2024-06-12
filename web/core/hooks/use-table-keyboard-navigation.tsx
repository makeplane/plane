export const useTableKeyboardNavigation = () => {
  const getPreviousRow = (element: HTMLElement) => {
    const previousRow = element.closest("tr")?.previousSibling;

    if (previousRow) return previousRow;
    //if previous row does not exist in the parent check the row with the header of the table
    return element.closest("tbody")?.previousSibling?.childNodes?.[0];
  };

  const getNextRow = (element: HTMLElement) => {
    const nextRow = element.closest("tr")?.nextSibling;

    if (nextRow) return nextRow;
    //if next row does not exist in the parent check the row with the body of the table
    return element.closest("thead")?.nextSibling?.childNodes?.[0];
  };

  const handleKeyBoardNavigation = function (e: React.KeyboardEvent<HTMLTableElement>) {
    const element = e.target as HTMLElement;

    if (!(element?.tagName === "TD" || element?.tagName === "TH")) return;

    let c: HTMLElement | null = null;
    if (e.key == "ArrowRight") {
      // Right Arrow
      c = element.nextSibling as HTMLElement;
    } else if (e.key == "ArrowLeft") {
      // Left Arrow
      c = element.previousSibling as HTMLElement;
    } else if (e.key == "ArrowUp") {
      // Up Arrow
      const index = Array.prototype.indexOf.call(element?.parentNode?.childNodes || [], element);
      const prevRow = getPreviousRow(element);

      c = prevRow?.childNodes?.[index] as HTMLElement;
    } else if (e.key == "ArrowDown") {
      // Down Arrow
      const index = Array.prototype.indexOf.call(element?.parentNode?.childNodes || [], element);
      const nextRow = getNextRow(element);

      c = nextRow?.childNodes[index] as HTMLElement;
    } else if (e.key == "Enter" || e.key == "Space") {
      e.preventDefault();
      (element?.querySelector(".clickable") as HTMLElement)?.click();
      return;
    }

    if (!c) return;

    e.preventDefault();
    c?.focus();
    c?.scrollIntoView({ behavior: "smooth", block: "center", inline: "end" });
  };

  return handleKeyBoardNavigation;
};
