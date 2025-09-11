export const getSlackThreadUrl = (teamDomain: string, channelId: string, threadTs: string) =>
  `https://${teamDomain}.slack.com/archives/${channelId}/p${threadTs}`;
