import React, { useCallback, useState } from "react";
import { Button } from "../button";
import { Input } from "../form-fields";
import Dropzone from "react-dropzone";
import { cn } from "../../helpers";

type Props = {
  onChange: (url: string) => void;
  uploadFile: (file: File) => Promise<string>;
};

export const ProjectLogoCustomImagePicker: React.FC<Props> = (props) => {
  const { onChange, uploadFile } = props;
  // states
  const [externalURL, setExternalURL] = useState("");

  const handleFormSubmit = useCallback(() => {
    if (!externalURL || externalURL.trim() === "") return;
    onChange(externalURL);
  }, [externalURL]);

  const handleUpload = useCallback((files: File[]) => {
    if (files.length > 1) return;
    const acceptedFile = files[0];
    if (!acceptedFile) return;
    uploadFile(acceptedFile).then((url) => {
      onChange(url);
    });
  }, []);

  return (
    <>
      <div className="flex items-center gap-1">
        <Input
          type="url"
          className="flex-grow"
          placeholder="Paste link to an image..."
          value={externalURL}
          onChange={(e) => setExternalURL(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleFormSubmit();
          }}
          required
          autoFocus
        />
        <Button className="flex-shrink-0" size="sm" onClick={handleFormSubmit}>
          Submit
        </Button>
      </div>
      <Dropzone
        onDrop={handleUpload}
        multiple={false}
        accept={{
          "image/*": [".png", ".jpg", ".jpeg", ".webp"],
        }}
        maxSize={5 * 1024 * 1024}
      >
        {({ getRootProps, getInputProps, isDragActive, fileRejections }) => (
          <div
            className={cn(
              "bg-custom-background-90 text-sm text-center text-custom-text-400 hover:text-custom-text-300 rounded grid place-items-center h-32 cursor-pointer transition-colors",
              {
                "bg-custom-background-80 text-custom-text-300": isDragActive,
                "bg-red-500/20 text-red-500 hover:text-red-500": fileRejections.length > 0,
              }
            )}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            {fileRejections.length > 0 ? (
              <p>
                {fileRejections[0].errors[0].code === "file-too-large"
                  ? "The image size cannot exceed 5 MB."
                  : "Please upload a valid file."}
              </p>
            ) : (
              <p>
                Drag 'n' drop some files here,
                <br />
                or click to select files
              </p>
            )}
          </div>
        )}
      </Dropzone>
    </>
  );
};
