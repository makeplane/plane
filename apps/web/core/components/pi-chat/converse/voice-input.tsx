/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { SetStateAction, Dispatch } from "react";
import React, { useRef, useState } from "react";
import { LoaderCircle, MicIcon } from "lucide-react";
import { CheckIcon, CloseIcon } from "@plane/propel/icons";
import type { TPiChatEditorRefApi } from "@plane/editor";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { PiChatService } from "@/services/pi-chat.service";
import type { TFocus, TPiLoaders } from "@/types";
import { Waveform } from "./voice-chart";

// eslint-disable-next-line react-refresh/only-export-components
export const SPEECH_LOADERS = ["recording", "transcribing"];

type TProps = {
  workspaceId: string;
  chatId: string | undefined;
  editorRef: React.RefObject<TPiChatEditorRefApi>;
  isProjectLevel: boolean;
  isFullScreen: boolean;
  focus: TFocus;
  loader: TPiLoaders;
  mode: string;
  is_websearch_enabled: boolean;
  setLoader: Dispatch<SetStateAction<TPiLoaders>>;
  createNewChat: (
    focus: TFocus,
    mode: string,
    isProjectLevel: boolean,
    workspaceId: string,
    is_websearch_enabled: boolean
  ) => Promise<string>;
};
const piChatService = new PiChatService();

function AudioRecorder(props: TProps) {
  const {
    workspaceId,
    chatId,
    editorRef,
    createNewChat,
    isProjectLevel,
    isFullScreen,
    focus,
    loader,
    setLoader,
    mode,
    is_websearch_enabled,
  } = props;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waveformData, setWaveformData] = useState<{ index: number; amplitude: number }[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const shouldSubmitRef = useRef<boolean>(false);
  const intervalIdRef = useRef<number>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setLoader("");
        if (shouldSubmitRef.current) void sendToAPI(audioBlob);

        // cleanup
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(intervalIdRef.current);
        void audioCtxRef.current?.close();
      };

      mediaRecorder.start();
      setLoader("recording");

      // analyser for waveform
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, no-unsafe-optional-chaining
      const audioCtx = new (window.AudioContext || (window as any)?.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128; // keep small, we resample later
      source.connect(analyser);

      audioCtxRef.current = audioCtx;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      intervalIdRef.current = window.setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);
        const amplitudes = Array.from(dataArray).map((v, i) => ({
          index: i,
          amplitude: v - 128,
        }));
        setWaveformData(amplitudes);
      }, 80); // adjust speed
    } catch (error: unknown) {
      setToast({
        title: (error as Error)?.message || "Error starting recording",
        message: "Enable mic access to dictate",
        type: TOAST_TYPE.ERROR,
      });
    }
  };

  const stopRecording = (shouldSubmit: boolean = false) => {
    mediaRecorderRef.current?.stop();
    shouldSubmitRef.current = shouldSubmit;
    if (shouldSubmit) {
      setIsSubmitting(true);
    }
  };

  const sendToAPI = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      setLoader("transcribing");
      let chatIdToUse = chatId;
      if (!chatIdToUse)
        chatIdToUse = await createNewChat(focus, mode, isProjectLevel, workspaceId, is_websearch_enabled);
      const response = await piChatService.transcribeAudio(workspaceId, formData, chatIdToUse);
      editorRef.current?.appendText(" " + response);
    } catch (err) {
      console.error("API error", err);
    } finally {
      setIsSubmitting(false);
      setLoader("");
    }
  };
  if (!SPEECH_LOADERS.includes(loader))
    return (
      <button
        onClick={() => void startRecording()}
        type="button"
        disabled={isSubmitting}
        className={cn("flex items-center justify-center w-8 h-8 rounded-full hover:bg-layer-1 flex-shrink-0")}
      >
        <MicIcon className="w-4 h-4" />
      </button>
    );

  return (
    <div
      className={cn("flex items-center gap-2 ", {
        "w-full": SPEECH_LOADERS.includes(loader),
      })}
    >
      {/* record/stop button */}
      <button
        onClick={() => (loader === "recording" ? stopRecording(false) : void startRecording())}
        type="button"
        disabled={isSubmitting}
        className={cn("flex items-center justify-center w-8 h-8 rounded-full hover:bg-layer-1 flex-shrink-0", {
          "bg-layer-1": SPEECH_LOADERS.includes(loader),
        })}
      >
        {SPEECH_LOADERS.includes(loader) ? (
          <CloseIcon className="w-4 h-4 text-icon-secondary" />
        ) : (
          <MicIcon className="w-4 h-4 text-icon-secondary" />
        )}
      </button>

      {/* waveform / transcribing */}
      <div className="flex-1 w-full">
        {loader === "recording" ? (
          <Waveform data={waveformData} barCount={isFullScreen ? 100 : 50} />
        ) : (
          loader === "transcribing" && (
            <div className="flex gap-2 items-center justify-center">
              <span className="text-body-xs-medium text-placeholder animate-pulse">Transcribing audio...</span>
            </div>
          )
        )}
      </div>

      {/* submit button */}
      {SPEECH_LOADERS.includes(loader) && (
        <button
          className={cn(
            "rounded-full bg-layer-1 text-icon-secondary size-8 flex items-center justify-center flex-shrink-0 disabled:bg-layer-1"
          )}
          type="submit"
          disabled={isSubmitting}
          onClick={() => stopRecording(true)}
        >
          {isSubmitting ? <LoaderCircle className="size-3.5 animate-spin" /> : <CheckIcon width={16} height={16} />}
        </button>
      )}
    </div>
  );
}

export default AudioRecorder;
