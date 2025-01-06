export const hideFloatingBot = () => {
  const floatingBot = document.getElementById("floating-bot");
  if (floatingBot) {
    floatingBot.style.display = "none";
  }
};

export const showFloatingBot = () => {
  const floatingBot = document.getElementById("floating-bot");
  if (floatingBot) {
    floatingBot.style.display = "flex";
  }
};
