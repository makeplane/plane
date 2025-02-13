"use client";

import { FC, Fragment, useState } from "react";
import Papa from "papaparse";
import Dropzone, { Accept } from "react-dropzone";
import { TriangleAlert, CircleCheck, X, Loader } from "lucide-react";
// helpers
import { useTranslation } from "@plane/i18n";
import { cn } from "@/helpers/common.helper";

type TImportUsersFromJiraUploader = {
  handleValue: (value: string) => void;
};

const acceptFileTypes: Accept = { "text/csv": [".csv"] };

export const ImportUsersFromJiraUploader: FC<TImportUsersFromJiraUploader> = (props) => {
  // props
  const { handleValue } = props;
  // states
  const [file, setFile] = useState<File>();
  const [fileErrorType, setFileErrorType] = useState<"processing" | "error" | "missing-fields" | "success" | undefined>(
    undefined
  );

  // hooks
  const { t } = useTranslation();

  const fileErrors = {
    processing: {
      className: "text-custom-text-200",
      icon: <Loader className="flex-shrink-0 w-3.5 h-3.5 spin-in-90" />,
      message: t("file_upload.processing"),
    },
    error: {
      className: "text-red-500",
      icon: <TriangleAlert className="flex-shrink-0 w-3.5 h-3.5" />,
      message: t("file_upload.invalid"),
    },
    "missing-fields": {
      className: "text-yellow-500",
      icon: <TriangleAlert className="flex-shrink-0 w-3.5 h-3.5" />,
      message: t("file_upload.missing_fields"),
    },
    success: {
      className: "text-green-500",
      icon: <CircleCheck className="flex-shrink-0 w-3.5 h-3.5" />,
      message: t("file_upload.success", { fileName: "CSV" }),
    },
  };

  const handleFileChange = (file: File) => {
    if (file) {
      setFile(file);
      setFileErrorType("processing");
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvContent = e.target?.result as string;
        Papa.parse<string>(csvContent, {
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data;
            if (validateCsv(data)) {
              setFileErrorType("success");
              handleValue(csvContent);
            } else {
              console.error("CSV validation failed");
              setFileErrorType(undefined);
            }
          },
          error: (error: Error) => {
            console.error("Error parsing CSV:", error);
            setFileErrorType(undefined);
          },
        });
      };
      reader.onerror = (e) => {
        console.error("Error reading file:", e);
        setFileErrorType(undefined);
      };
      reader.readAsText(file);
    }
  };

  const validateCsv = (data: Array<string>): boolean => {
    if (data.length === 0) {
      console.error("CSV is empty.");
      return false;
    }
    const requiredFields = ["User name", "email"];
    const missingFields = new Set<string>();
    requiredFields.forEach((field) => {
      if (!data[0].includes(field)) {
        missingFields.add(field);
      }
    });
    if (missingFields.size > 0) {
      setFileErrorType("missing-fields");
      return false;
    }
    return true;
  };

  const handleClearFile = () => {
    setFile(undefined);
    setFileErrorType(undefined);
  };

  return (
    <Fragment>
      {/* upload/dropzone container */}
      <div className="relative border border-custom-border-300 border-dashed rounded-sm w-full min-h-28 h-full">
        <Dropzone
          multiple={false}
          accept={acceptFileTypes}
          disabled={file ? true : false}
          onDrop={(files: File[]) => {
            handleFileChange(files[0]);
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <div
              {...getRootProps()}
              className={`relative flex flex-col justify-center items-center w-full min-h-28 h-full rounded-sm text-sm outline-none focus:outline-none shadow-none ${file ? "bg-custom-background-90 cursor-not-allowed" : "cursor-pointer"
                }`}
            >
              <input
                multiple={false}
                {...getInputProps()}
                className="outline-none focus:outline-none shadow-none border-none"
              />
              <div className="text-custom-text-200">{t("file_upload.upload_text")}</div>
              <div className="pt-1 font-medium">{t("common.or")} {t("file_upload.drag_drop_text")}</div>
            </div>
          )}
        </Dropzone>
        {file && (
          <div
            className="absolute top-1 right-1 w-5 h-5 rounded-sm transition-all flex justify-center items-center bg-custom-background-100 hover:bg-custom-background-90 cursor-pointer"
            onClick={handleClearFile}
          >
            <X className="flex-shrink-0 w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* upload successful */}
      {fileErrorType && (
        <div
          className={cn("relative text-sm font-medium flex items-center gap-2", fileErrors[fileErrorType]?.className)}
        >
          {fileErrors[fileErrorType]?.icon}
          {fileErrors[fileErrorType]?.message}
        </div>
      )}
    </Fragment>
  );
};
