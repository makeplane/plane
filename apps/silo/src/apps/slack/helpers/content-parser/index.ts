import {
  ContentParser,
  ExternalMentionParserExtension,
  IParserExtension,
  PlaneMentionParserExtension,
} from "@plane/etl/parser";

export type TSlackContentParserConfig = {
  userMap: Map<string, string>;
  teamDomain: string;
};

export const getSlackContentParser = (config: TSlackContentParserConfig) => {
  const extensions: IParserExtension[] = [
    // For channels - process first since they're less likely to have entity mappings
    new ExternalMentionParserExtension({
      mentionSymbol: "#",
      entityMap: new Map<string, string>(), // Empty map for channels
      fallbackOptions: {
        replaceWithLink(mention) {
          return [`Slack Channel: ${mention}`, `https://${config.teamDomain}.slack.com/archives/${mention}`];
        },
      },
    }),
    // For users - process second since they might have entity mappings
    new ExternalMentionParserExtension({
      mentionSymbol: "@",
      entityMap: config.userMap,
      fallbackOptions: {
        replaceWithLink(mention) {
          return [`Slack User: ${mention}`, `https://${config.teamDomain}.slack.com/team/${mention}`];
        },
      },
    }),

    new ExternalMentionParserExtension({
      mentionSymbol: "!",
      entityMap: new Map<string, string>(),
      fallbackOptions: {
        replaceWithLink(mention) {
          // TODO: Check this
          return [`Slack Broadcast: ${mention}`, `https://${config.teamDomain}.slack.com/team/${mention}`];
        },
      },
    }),
  ];

  return new ContentParser(extensions, [], []);
};

export type TPlaneContentParserConfig = {
  workspaceSlug: string;
  appBaseUrl: string;
  userMap: Map<string, string>; // Map of slack user id to plane user id
};

export const getPlaneContentParser = (config: TPlaneContentParserConfig) => {
  const extensions: IParserExtension[] = [
    new PlaneMentionParserExtension({
      callback: (mentionData) => {
        const user = config.userMap.get(mentionData.entityIdentifier ?? "");
        if (!user) {
          return {
            type: "link",
            label: "Plane User",
            link: `${config.appBaseUrl}/${config.workspaceSlug}/profile/${mentionData.entityIdentifier}`,
          };
        } else {
          return {
            type: "text",
            text: `<@${user}>`,
          };
        }
      },
    }),
  ];

  return new ContentParser(extensions, [], []);
};
