import { useState } from "react";
import { mutate } from "swr";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { APITokenService } from "@plane/services";
import type { IApiToken } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { renderFormattedDate, csvDownload } from "@plane/utils";
// constants
import { API_TOKENS_LIST } from "@/constants/fetch-keys";
// local imports
import { CreateApiTokenForm } from "./form";
import { GeneratedTokenDetails } from "./generated-token-details";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// services
const apiTokenService = new APITokenService();

export function CreateApiTokenModal(props: Props) {
  const { isOpen, onClose } = props;
  // states
  const [neverExpires, setNeverExpires] = useState<boolean>(false);
  const [generatedToken, setGeneratedToken] = useState<IApiToken | null | undefined>(null);

  const handleClose = () => {
    onClose();

    setTimeout(() => {
      setNeverExpires(false);
      setGeneratedToken(null);
    }, 350);
  };

  const downloadSecretKey = (data: IApiToken) => {
    const csvData = {
      Title: data.label,
      Description: data.description,
      Expiry: data.expired_at ? (renderFormattedDate(data.expired_at)?.replace(",", " ") ?? "") : "Never expires",
      "Secret key": data.token ?? "",
    };

    csvDownload(csvData, `secret-key-${Date.now()}`);
  };

  const handleCreateToken = async (data: Partial<IApiToken>) => {
    // make the request to generate the token
    await apiTokenService
      .create(data)
      .then((res) => {
        setGeneratedToken(res);
        downloadSecretKey(res);

        mutate<IApiToken[]>(
          API_TOKENS_LIST,
          (prevData) => {
            if (!prevData) return;

            return [res, ...prevData];
          },
          false
        );
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err.message || err.detail,
        });

        throw err;
      });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={() => {}} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {generatedToken ? (
        <GeneratedTokenDetails handleClose={handleClose} tokenDetails={generatedToken} />
      ) : (
        <CreateApiTokenForm
          handleClose={handleClose}
          neverExpires={neverExpires}
          toggleNeverExpires={() => setNeverExpires((prevData) => !prevData)}
          onSubmit={handleCreateToken}
        />
      )}
    </ModalCore>
  );
}
