import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { TRealtimeConfig } from "@plane/editor";

function stringifyConfig(config: TRealtimeConfig) {
  const sortedEntries = Object.entries(config).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  return JSON.stringify(sortedEntries);
}

const socketUrlMap = new Map<string, HocuspocusProviderWebsocket>();

export const getSocketConnection = (realtimeConfig: TRealtimeConfig) => {
  const configKey = stringifyConfig(realtimeConfig);

  console.log("socketUrlMap", socketUrlMap);
  if (socketUrlMap.has(configKey)) {
    console.log("existing socket returned");
    return socketUrlMap.get(configKey);
  } else {
    console.log("new socket returned");
    const socket = new HocuspocusProviderWebsocket({
      url: realtimeConfig.url,
      parameters: realtimeConfig.queryParams,
    });
    socketUrlMap.set(configKey, socket);
    return socket;
  }
};
