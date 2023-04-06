import {
  CssIcon,
  CsvIcon,
  DocIcon,
  FigmaIcon,
  HtmlIcon,
  JavaScriptIcon,
  JpgIcon,
  PdfIcon,
  PngIcon,
  SheetIcon,
  SvgIcon,
  TxtIcon,
} from "components/icons";

export const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "pdf":
      return <PdfIcon height={28} width={28} />;
    case "csv":
      return <CsvIcon height={28} width={28} />;
    case "xlsx":
      return <SheetIcon height={28} width={28} />;
    case "css":
      return <CssIcon height={28} width={28} />;
    case "doc":
      return <DocIcon height={28} width={28} />;
    case "fig":
      return <FigmaIcon height={28} width={28} />;
    case "html":
      return <HtmlIcon height={28} width={28} />;
    case "png":
      return <PngIcon height={28} width={28} />;
    case "jpg":
      return <JpgIcon height={28} width={28} />;
    case "js":
      return <JavaScriptIcon height={28} width={28} />;
    case "txt":
      return <TxtIcon height={28} width={28} />;
    case "svg":
      return <SvgIcon height={28} width={28} />;

    default:
      return <DocIcon height={28} width={28}/>;
  }
};
