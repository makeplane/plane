import React, { SetStateAction, Dispatch, useRef, useState } from "react";
import { Check, LoaderCircle, MicIcon, X } from "lucide-react";
import { EditorRefApi } from "@plane/editor";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
import { PiChatService } from "@/plane-web/services/pi-chat.service";
import { TFocus, TPiLoaders } from "@/plane-web/types";
import { Waveform } from "./voice-chart";

export const SPEECH_LOADERS = ["recording", "transcribing"];

type TProps = {
  workspaceId: string;
  chatId: string;
  editorRef: React.RefObject<EditorRefApi>;
  isProjectLevel: boolean;
  isFullScreen: boolean;
  focus: TFocus;
  loader: TPiLoaders;
  setLoader: Dispatch<SetStateAction<TPiLoaders>>;
  createNewChat: (focus: TFocus, isProjectLevel: boolean, workspaceId: string) => Promise<string>;
};
const piChatService = new PiChatService();

const AudioRecorder = (props: TProps) => {
  const { workspaceId, chatId, editorRef, createNewChat, isProjectLevel, isFullScreen, focus, loader, setLoader } =
    props;

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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setLoader("");
        if (shouldSubmitRef.current) await sendToAPI(audioBlob);

        // cleanup
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(intervalIdRef.current);
        audioCtxRef.current?.close();
      };

      mediaRecorder.start();
      setLoader("recording");

      // analyser for waveform
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
    } catch (error: any) {
      setToast({
        title: error.message || "Error starting recording",
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
      if (!chatId) chatIdToUse = await createNewChat(focus, isProjectLevel, workspaceId);
      const response = await piChatService.transcribeAudio(workspaceId, formData, chatIdToUse);
      editorRef.current?.appendText(" " + response);
    } catch (err) {
      console.error("API error", err);
    } finally {
      setIsSubmitting(false);
      setLoader("");
    }
  };

  return (
    <div
      className={cn("flex items-center gap-2 ", {
        "w-full": SPEECH_LOADERS.includes(loader),
      })}
    >
      {/* record/stop button */}
      <button
        onClick={() => (loader === "recording" ? stopRecording(false) : startRecording())}
        type="button"
        disabled={isSubmitting}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full hover:bg-custom-background-80 flex-shrink-0",
          { "bg-custom-background-80": SPEECH_LOADERS.includes(loader) }
        )}
      >
        {SPEECH_LOADERS.includes(loader) ? <X className="w-4 h-4" /> : <MicIcon className="w-4 h-4" />}
      </button>

      {/* waveform / transcribing */}
      <div className="flex-1 w-full">
        {loader === "recording" ? (
          <Waveform data={waveformData} barCount={isFullScreen ? 100 : 50} />
        ) : (
          loader === "transcribing" && (
            <div className="flex gap-2 items-center justify-center">
              <span className="text-base text-custom-text-200 animate-pulse">Transcribing audio...</span>
            </div>
          )
        )}
      </div>

      {/* submit button */}
      {SPEECH_LOADERS.includes(loader) && (
        <button
          className={cn(
            "rounded-full bg-pi-700 text-white size-8 flex items-center justify-center flex-shrink-0 disabled:bg-custom-background-80"
          )}
          type="submit"
          disabled={isSubmitting}
          onClick={() => stopRecording(true)}
        >
          {isSubmitting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Check size={16} />}
        </button>
      )}
    </div>
  );
};

export default AudioRecorder;
