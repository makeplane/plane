import { useForm } from "react-hook-form";

import { addDays, renderDateFormat } from "helpers/date-time.helper";
import { IApiToken } from "types/api_token";
import { csvDownload } from "helpers/download.helper";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useState } from "react";
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
import { ApiTokenService } from "services/api_token.service";
import { ApiTokenTitle } from "./ApiTokenTitle";
import { ApiTokenDescription } from "./ApiTokenDescription";
import { ApiTokenExpiry, expiryOptions } from "./ApiTokenExpiry";
import { Button } from "@plane/ui";
import { ApiTokenKeySection } from "./ApiTokenKeySection";

interface IApiTokenForm {
  generatedToken: IApiToken | null | undefined;
  setGeneratedToken: Dispatch<SetStateAction<IApiToken | null | undefined>>;
  setDeleteTokenModal: Dispatch<SetStateAction<boolean>>;
}

const apiTokenService = new ApiTokenService();
export const ApiTokenForm = ({ generatedToken, setGeneratedToken, setDeleteTokenModal }: IApiTokenForm) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [neverExpires, setNeverExpire] = useState<boolean>(false);
  const [focusTitle, setFocusTitle] = useState<boolean>(false);
  const [focusDescription, setFocusDescription] = useState<boolean>(false);
  const [selectedExpiry, setSelectedExpiry] = useState<number>(1);

  const { setToastAlert } = useToast();
  const { theme: themStore } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      never_expires: false,
      title: "",
      description: "",
    },
  });

  const getExpiryDate = (): string | null => {
    if (neverExpires === true) return null;
    return addDays({ date: new Date(), days: expiryOptions[selectedExpiry].days }).toISOString();
  };

  function renderExpiry(): string {
    return renderDateFormat(addDays({ date: new Date(), days: expiryOptions[selectedExpiry].days }), true);
  }

  const downloadSecretKey = (token: IApiToken) => {
    const csvData = {
      Label: token.label,
      Description: token.description,
      Expiry: renderDateFormat(token.expired_at ?? null),
      "Secret Key": token.token,
    };
    csvDownload(csvData, `Secret-key-${Date.now()}`);
  };

  const generateToken = async (data: any) => {
    if (!workspaceSlug) return;
    setLoading(true);
    await apiTokenService
      .createApiToken(workspaceSlug.toString(), {
        label: data.title,
        description: data.description,
        expired_at: getExpiryDate(),
      })
      .then((res) => {
        setGeneratedToken(res);
        downloadSecretKey(res);
        setLoading(false);
      })
      .catch((err) => {
        setToastAlert({
          message: err.message,
          type: "error",
          title: "Error",
        });
      });
  };

  return (
    <form
      onSubmit={handleSubmit(generateToken, (err) => {
        if (err.title) {
          setFocusTitle(true);
        }
      })}
      className={`${themStore.sidebarCollapsed ? "xl:w-[50%] lg:w-[60%] " : "w-[60%]"} mx-auto py-8`}
    >
      <div className="border-b border-custom-border-200 pb-4">
        <ApiTokenTitle
          generatedToken={generatedToken}
          control={control}
          errors={errors}
          focusTitle={focusTitle}
          setFocusTitle={setFocusTitle}
          setFocusDescription={setFocusDescription}
        />
        {errors.title && focusTitle && <p className=" text-red-600">{errors.title.message}</p>}
        <ApiTokenDescription
          generatedToken={generatedToken}
          control={control}
          focusDescription={focusDescription}
          setFocusTitle={setFocusTitle}
          setFocusDescription={setFocusDescription}
        />
      </div>

      {!generatedToken && (
        <div className="mt-12">
          <>
            <ApiTokenExpiry
              neverExpires={neverExpires}
              selectedExpiry={selectedExpiry}
              setSelectedExpiry={setSelectedExpiry}
              setNeverExpire={setNeverExpire}
              renderExpiry={renderExpiry}
              control={control}
            />
            <Button variant="primary" type="submit">
              {loading ? "generating..." : "Add Api key"}
            </Button>
          </>
        </div>
      )}
      <ApiTokenKeySection
        generatedToken={generatedToken}
        renderExpiry={renderExpiry}
        setDeleteTokenModal={setDeleteTokenModal}
      />
    </form>
  );
};
