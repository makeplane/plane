import React, { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { Button, Input, ModalCore } from "@plane/ui";
// hooks
import useKeypress from "@/hooks/use-keypress";
import { useCustomers } from "@/plane-web/hooks/store";

export type TLinkFormData = {
  url: string | undefined;
};
type TProps = {
  setLinkData: (link: string | undefined) => void;
  preloadedData?: TLinkFormData;
  onSubmit?: (link: string) => Promise<void>;
  id: string;
};

const defaultValues = {
  url: "",
};

export const SourceCreateUpdateModal: FC<TProps> = observer((props) => {
  // props
  const { setLinkData, preloadedData, id } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const {
    formState: { errors },
    handleSubmit,
    control,
    reset,
  } = useForm<TLinkFormData>({
    defaultValues,
  });
  const { requestSourceModalId, toggleRequestSourceModal } = useCustomers();

  const handleClose = () => {
    toggleRequestSourceModal(null);
  };

  const handleFormSubmit = async (data: TLinkFormData) => {
    const parsedUrl = data.url?.startsWith("http") ? data.url : `http://${data.url}`;
    setLinkData(parsedUrl);
    handleClose();
  };

  useEffect(() => {
    if (requestSourceModalId) reset({ ...defaultValues, ...preloadedData });
    return () => reset(defaultValues);
  }, [preloadedData, reset, requestSourceModalId]);

  useKeypress("Escape", () => {
    if (requestSourceModalId === id) handleClose();
  });

  return (
    <ModalCore isOpen={requestSourceModalId === id}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-xl font-medium text-custom-text-200">
            {preloadedData?.url ? t("customers.requests.form.source.update") : t("customers.requests.form.source.add")}
          </h3>
          <div className="mt-2 space-y-3">
            <div>
              <label htmlFor="url" className="mb-2 text-custom-text-200 text-base font-medium">
                {t("customers.requests.form.source.url.label")}
              </label>
              <Controller
                control={control}
                name="url"
                rules={{
                  required: t("customers.requests.form.source.url.required"),
                  pattern: {
                    value:
                      /^(https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                    message: t("customers.requests.form.source.url.invalid"),
                  },
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="url"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.url)}
                    placeholder={t("common.type_or_paste_a_url")}
                    className="w-full"
                  />
                )}
              />
              {errors.url && <span className="text-xs text-red-500">{errors.url.message}</span>}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {t("submit")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
