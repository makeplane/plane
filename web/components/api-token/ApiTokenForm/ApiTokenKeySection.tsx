import { Button } from "@plane/ui";
import useToast from "hooks/use-toast";
import { Copy } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { IApiToken } from "types/api_token";

interface IApiTokenKeySection {
  generatedToken: IApiToken | null | undefined;
  renderExpiry: () => string;
  setDeleteTokenModal: Dispatch<SetStateAction<boolean>>;
}

export const ApiTokenKeySection = ({ generatedToken, renderExpiry, setDeleteTokenModal }: IApiTokenKeySection) => {
  const { setToastAlert } = useToast();

  return generatedToken ? (
    <div className={`mt-${generatedToken ? "8" : "16"}`}>
      <p className="font-medium text-base pb-2">Api key created successfully</p>
      <p className="text-sm pb-4 w-[80%] text-custom-text-400/60">
        Save this API key somewhere safe. You will not be able to view it again once you close this page or reload this
        page.
      </p>
      <Button variant="neutral-primary" className="py-3 w-[85%] flex justify-between items-center">
        <p className="font-medium text-base">{generatedToken.token}</p>

        <Copy
          size={18}
          color="#B9B9B9"
          onClick={() => {
            navigator.clipboard.writeText(generatedToken.token);
            setToastAlert({
              message: "The Secret key has been successfully copied to your clipboard",
              type: "success",
              title: "Copied to clipboard",
            });
          }}
        />
      </Button>
      <p className="mt-2 text-sm text-custom-text-400/60">
        {generatedToken.expired_at ? "Expires on " + renderExpiry() : "Never Expires"}
      </p>
      <button
        className="border py-3 px-5 text-custom-primary-100 text-sm mt-8 rounded-md border-custom-primary-100 w-fit font-medium"
        onClick={(e) => {
          e.preventDefault();
          setDeleteTokenModal(true);
        }}
      >
        Revoke
      </button>
    </div>
  ) : null;
};
