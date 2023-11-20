export const getUserRole = (role: number) => {
  switch (role) {
    case 5:
      return "GUEST";
    case 10:
      return "VIEWER";
    case 15:
      return "MEMBER";
    case 20:
      return "ADMIN";
  }
};
