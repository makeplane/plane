// Intercom chat support removed for self-hosted government deployment

export interface IUseChatSupport {
  openChatSupport: () => void;
  isEnabled: boolean;
}

export const useChatSupport = (): IUseChatSupport => {
  return {
    openChatSupport: () => {},
    isEnabled: false,
  };
};
