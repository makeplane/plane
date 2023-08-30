export interface IUserStore {
  currentUser: any | null;
  getUserAsync: () => void;
}
