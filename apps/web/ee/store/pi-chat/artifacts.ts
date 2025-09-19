import { action, makeObservable, observable, runInAction } from "mobx";
// plane imports
// plane web imports
import { computedFn } from "mobx-utils";
import { PiChatService } from "@/plane-web/services/pi-chat.service";
import { TArtifact } from "@/plane-web/types";

export type TVersionHistory = {
  latest: string;
  history: string[];
};

export interface IArtifactsStore {
  dataMap: Record<string, TArtifact>; // version_id -> artifact data
  chatArtifactsMap: Record<string, string[]>; // chat_id -> artifacts
  versionHistory: Record<string, TVersionHistory>; // artifact_id -> version history
  getGroupedArtifacts: (artifactIds: string[]) => {
    successful: TArtifact[];
    failed: TArtifact[];
  };
  getArtifact: (artifactId: string) => TArtifact | undefined;
  getArtifactsByChatId: (chatId: string) => (TArtifact | undefined)[];
  getArtifactByVersion: (versionId: string) => TArtifact | undefined;
  fetchArtifactsByChatId: (chatId: string) => void;
}

export class ArtifactsStore implements IArtifactsStore {
  dataMap: Record<string, TArtifact> = {};
  versionHistory: Record<string, TVersionHistory> = {};
  chatArtifactsMap: Record<string, string[]> = {};
  //services
  piChatService;

  constructor() {
    makeObservable(this, {
      //observables
      dataMap: observable,
      versionHistory: observable,
      chatArtifactsMap: observable,
      // computed
      // actions
      fetchArtifactsByChatId: action,
      initArtifacts: action,
      updateArtifacts: action,
    });

    //services
    this.piChatService = new PiChatService();
  }

  getGroupedArtifacts = computedFn((artifactIds: string[]) => {
    const response: {
      successful: TArtifact[];
      failed: TArtifact[];
    } = {
      successful: [],
      failed: [],
    };

    artifactIds.forEach((artifactId) => {
      const artifact = this.getArtifact(artifactId);
      if (!artifact) return;
      if (artifact?.success) {
        response.successful.push(artifact);
      } else {
        response.failed.push(artifact);
      }
    });
    return response;
  });

  getArtifactsByChatId = computedFn(
    (chatId: string) => this.chatArtifactsMap[chatId]?.map((artifactId) => this.getArtifact(artifactId)) || []
  );

  getArtifact = computedFn((artifactId: string) => {
    const latestVersion = this.versionHistory[artifactId]?.latest || "";
    if (!latestVersion) return undefined;
    return this.dataMap[latestVersion];
  });

  getArtifactByVersion = computedFn((versionId: string) => {
    if (!versionId) return undefined;
    return this.dataMap[versionId];
  });

  initArtifacts = async (artifactId: string, data: TArtifact) => {
    const versionId = data.artifact_id; // TODO: Change to version_id later
    this.versionHistory[artifactId] = {
      latest: versionId,
      history: [versionId],
    };
    this.dataMap[versionId] = data;
  };

  updateArtifacts = async (versionId: string, data: Partial<TArtifact>) => {
    runInAction(() => {
      this.dataMap[versionId] = {
        ...this.dataMap[versionId],
        ...data,
      };
    });
  };

  fetchArtifactsByChatId = async (chatId: string) => {
    const response = await this.piChatService.listArtifacts(chatId);
    response.forEach((artifact) => {
      this.initArtifacts(artifact.artifact_id, artifact);
    });
    this.chatArtifactsMap[chatId] = response.map((artifact) => artifact.artifact_id);
  };
}
