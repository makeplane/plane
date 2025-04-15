import {
    Github,
    Linkedin,
    Twitter,
    Facebook,
    Instagram,
    Youtube,
    Dribbble,
    Figma,
    FileText,
    FileImage,
    FileVideo,
    FileAudio,
    FileArchive,
    FileSpreadsheet,
    FileCode,
    Mail,
    Chrome,
    Link2,
  } from "lucide-react";

  
  // get-icon-for-link.ts

  export const getIconForLink = (url: string) => {
    const lowerUrl = url.toLowerCase();
  
    // Social Media
    if (lowerUrl.indexOf("github.com") !== -1) return Github;
    if (lowerUrl.indexOf("linkedin.com") !== -1) return Linkedin;
    if (lowerUrl.indexOf("twitter.com") !== -1 || lowerUrl.indexOf("x.com") !== -1) return Twitter;
    if (lowerUrl.indexOf("facebook.com") !== -1) return Facebook;
    if (lowerUrl.indexOf("instagram.com") !== -1) return Instagram;
    if (lowerUrl.indexOf("youtube.com") !== -1 || lowerUrl.indexOf("youtu.be") !== -1) return Youtube;
    if (lowerUrl.indexOf("dribbble.com") !== -1) return Dribbble;
  
    // Productivity / Tools
    if (lowerUrl.indexOf("figma.com") !== -1) return Figma;
    
    if (
      lowerUrl.indexOf("google.com") !== -1 ||
      lowerUrl.indexOf("docs.") !== -1 ||
      lowerUrl.indexOf("doc.") !== -1
    ) return FileText;
  
    // File types
    if (
      lowerUrl.indexOf(".jpg") !== -1 ||
      lowerUrl.indexOf(".jpeg") !== -1 ||
      lowerUrl.indexOf(".png") !== -1 ||
      lowerUrl.indexOf(".gif") !== -1 ||
      lowerUrl.indexOf(".bmp") !== -1 ||
      lowerUrl.indexOf(".svg") !== -1 ||
      lowerUrl.indexOf(".webp") !== -1
    ) return FileImage;
  
    if (
      lowerUrl.indexOf(".mp4") !== -1 ||
      lowerUrl.indexOf(".mov") !== -1 ||
      lowerUrl.indexOf(".avi") !== -1 ||
      lowerUrl.indexOf(".wmv") !== -1 ||
      lowerUrl.indexOf(".flv") !== -1 ||
      lowerUrl.indexOf(".mkv") !== -1
    ) return FileVideo;
  
    if (
      lowerUrl.indexOf(".mp3") !== -1 ||
      lowerUrl.indexOf(".wav") !== -1 ||
      lowerUrl.indexOf(".ogg") !== -1
    ) return FileAudio;
  
    if (
      lowerUrl.indexOf(".zip") !== -1 ||
      lowerUrl.indexOf(".rar") !== -1 ||
      lowerUrl.indexOf(".7z") !== -1 ||
      lowerUrl.indexOf(".tar") !== -1 ||
      lowerUrl.indexOf(".gz") !== -1
    ) return FileArchive;
  
    if (
      lowerUrl.indexOf(".xls") !== -1 ||
      lowerUrl.indexOf(".xlsx") !== -1 ||
      lowerUrl.indexOf(".csv") !== -1
    ) return FileSpreadsheet;
  
    if (
      lowerUrl.indexOf(".pdf") !== -1 ||
      lowerUrl.indexOf(".doc") !== -1 ||
      lowerUrl.indexOf(".docx") !== -1 ||
      lowerUrl.indexOf(".txt") !== -1
    ) return FileText;
  
    if (
      lowerUrl.indexOf(".html") !== -1 ||
      lowerUrl.indexOf(".js") !== -1 ||
      lowerUrl.indexOf(".ts") !== -1 ||
      lowerUrl.indexOf(".jsx") !== -1 ||
      lowerUrl.indexOf(".tsx") !== -1 ||
      lowerUrl.indexOf(".css") !== -1 ||
      lowerUrl.indexOf(".scss") !== -1
    ) return FileCode;
  
    // Other
    if (lowerUrl.indexOf("mailto:") !== -1) return Mail;
    if (lowerUrl.indexOf("http") === 0) return Chrome;
  
    return Link2;
  };
  