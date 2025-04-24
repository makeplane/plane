export const getDescriptionPlaceholder = (isFocused: boolean, description: string | undefined): string => {
  const isDescriptionEmpty = !description || description === "<p></p>" || description.trim() === "";
  if (!isDescriptionEmpty || isFocused) return "Press '/' for commands...";
  else return "Click to add description";
};
