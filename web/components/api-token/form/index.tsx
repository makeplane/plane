import { Dispatch, SetStateAction, useState, FC } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
// helpers
import { addDays, renderDateFormat } from "helpers/date-time.helper";
import { csvDownload } from "helpers/download.helper";
// types
import { IApiToken } from "types/api_token";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import useToast from "hooks/use-toast";
// services
import { APITokenService } from "services/api_token.service";
// components
import { APITokenTitle } from "./token-title";
import { APITokenDescription } from "./token-description";
import { APITokenExpiry, EXPIRY_OPTIONS } from "./token-expiry";
import { APITokenKeySection } from "./token-key-section";
// ui
import { Button } from "@plane/ui";

interface APITokenFormProps {
  generatedToken: IApiToken | null | undefined;
  setGeneratedToken: Dispatch<SetStateAction<IApiToken | null | undefined>>;
  setDeleteTokenModal: Dispatch<SetStateAction<boolean>>;
}

export interface APIFormFields {
  never_expires: boolean;
  title: string;
  description: string;
}

const apiTokenService = new APITokenService();

export const APITokenForm: FC<APITokenFormProps> = (props) => {
  const { generatedToken, setGeneratedToken, setDeleteTokenModal } = props;
  // states
  const [loading, setLoading] = useState<boolean>(false);
  const [neverExpires, setNeverExpire] = useState<boolean>(false);
  const [focusTitle, setFocusTitle] = useState<boolean>(false);
  const [focusDescription, setFocusDescription] = useState<boolean>(false);
  const [selectedExpiry, setSelectedExpiry] = useState<number>(1);
  // hooks
  const { setToastAlert } = useToast();
  // store
  const {
    theme: { sidebarCollapsed },
  } = useMobxStore();
  // router
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
    return addDays({ date: new Date(), days: EXPIRY_OPTIONS[selectedExpiry].days }).toISOString();
  };

  function renderExpiry(): string {
    return renderDateFormat(addDays({ date: new Date(), days: EXPIRY_OPTIONS[selectedExpiry].days }), true);
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
      className={`${sidebarCollapsed ? "xl:w-[50%] lg:w-[60%] " : "w-[60%]"} mx-auto py-8`}
    >
      <div className="border-b border-custom-border-200 pb-4">
        <APITokenTitle
          generatedToken={generatedToken}
          control={control}
          errors={errors}
          focusTitle={focusTitle}
          setFocusTitle={setFocusTitle}
          setFocusDescription={setFocusDescription}
        />
        {errors.title && focusTitle && <p className=" text-red-600">{errors.title.message}</p>}
        <APITokenDescription
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
            <APITokenExpiry
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
      <APITokenKeySection
        generatedToken={generatedToken}
        renderExpiry={renderExpiry}
        setDeleteTokenModal={setDeleteTokenModal}
      />
    </form>
  );
};
