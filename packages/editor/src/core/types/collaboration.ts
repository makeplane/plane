export type TServerHandler = {
  onConnect?: () => void;
  onServerError?: () => void;
};
