export const positionEditorElement = (editor: any, rect: any) => {
  if (window) {
    if (rect === null) {
      editor.style.opacity = "0";
      editor.style.top = "-1000px";
      editor.style.left = "-1000px";
    } else {
      editor.style.opacity = "1";
      editor.style.top = `${
        rect.top + rect.height + window.pageYOffset + 10
      }px`;
      editor.style.left = `${
        rect.left + window.pageXOffset - editor.offsetWidth / 2 + rect.width / 2
      }px`;
    }
  }
};

export const getValidatedValue = (value: string) => {
  const defaultValue =
    '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

  if (value) {
    try {
      const json = JSON.parse(value);
      return JSON.stringify(json);
    } catch (error) {
      return defaultValue;
    }
  }

  return defaultValue;
};
