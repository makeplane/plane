import React, { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { Dialog, Transition } from "@headlessui/react";
// services
import { APITokenService } from "services/api_token.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { CreateApiTokenForm, GeneratedTokenDetails } from "components/api-token";
// helpers
import { csvDownload } from "helpers/download.helper";
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { IApiToken } from "@plane/types";
// fetch-keys
import { API_TOKENS_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// services
const apiTokenService = new APITokenService();

export const CreateApiTokenModal: React.FC<Props> = (props) => {
  const { isOpen, onClose } = props;
  // states
  const [neverExpires, setNeverExpires] = useState<boolean>(false);
  const [generatedToken, setGeneratedToken] = useState<IApiToken | null | undefined>(null);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // toast alert
  const { setToastAlert } = useToast();

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
      Expiry: data.expired_at ? renderFormattedDate(data.expired_at)?.replace(",", " ") ?? "" : "Never expires",
      "Secret key": data.token ?? "",
    };

    csvDownload(csvData, `secret-key-${Date.now()}`);
  };

  const handleCreateToken = async (data: Partial<IApiToken>) => {
    if (!workspaceSlug) return;

    // make the request to generate the token
    await apiTokenService
      .createApiToken(workspaceSlug.toString(), data)
      .then((res) => {
        setGeneratedToken(res);
        downloadSecretKey(res);

        mutate<IApiToken[]>(
          API_TOKENS_LIST(workspaceSlug.toString()),
          (prevData) => {
            if (!prevData) return;

            return [res, ...prevData];
          },
          false
        );
      })
      .catch((err) => {
        setToastAlert({
          message: err.message,
          type: "error",
          title: "Error",
        });

        throw err;
      });
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={() => {}}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="grid h-full w-full place-items-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 p-5 px-4 text-left shadow-custom-shadow-md transition-all sm:w-full sm:max-w-2xl">
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
