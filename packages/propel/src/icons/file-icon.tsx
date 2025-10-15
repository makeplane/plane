import type { FC } from "react";
import {
  AudioIcon,
  CssIcon,
  CsvIcon,
  DefaultIcon,
  DocumentIcon,
  FigmaIcon,
  HtmlIcon,
  JavaScriptIcon,
  JpgIcon,
  PdfIcon,
  PngIcon,
  RarIcon,
  SheetIcon,
  SvgIcon,
  TxtIcon,
  VideoIcon,
  ZipIcon,
} from "./attachment";

export type FileIconProps = {
  extension: string;
  size?: number;
};

export const FileIcon: FC<FileIconProps> = (props) => {
  const { extension, size = 28 } = props;

  switch (extension) {
    case "pdf":
      return <PdfIcon height={size} width={size} />;
    case "csv":
      return <CsvIcon height={size} width={size} />;
    case "xlsx":
      return <SheetIcon height={size} width={size} />;
    case "css":
      return <CssIcon height={size} width={size} />;
    case "doc":
      return <DocumentIcon height={size} width={size} />;
    case "fig":
      return <FigmaIcon height={size} width={size} />;
    case "html":
      return <HtmlIcon height={size} width={size} />;
    case "png":
      return <PngIcon height={size} width={size} />;
    case "jpg":
      return <JpgIcon height={size} width={size} />;
    case "js":
      return <JavaScriptIcon height={size} width={size} />;
    case "txt":
      return <TxtIcon height={size} width={size} />;
    case "svg":
      return <SvgIcon height={size} width={size} />;
    case "mp3":
      return <AudioIcon height={size} width={size} />;
    case "wav":
      return <AudioIcon height={size} width={size} />;
    case "mp4":
      return <VideoIcon height={size} width={size} />;
    case "wmv":
      return <VideoIcon height={size} width={size} />;
    case "mkv":
      return <VideoIcon height={size} width={size} />;
    case "zip":
      return <ZipIcon height={size} width={size} />;
    case "rar":
      return <RarIcon height={size} width={size} />;

    default:
      return <DefaultIcon height={size} width={size} />;
  }
};
