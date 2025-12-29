import type { FC } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane types
// plane ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TLinkEditableFields } from "@plane/types";
import { Input, ModalCore } from "@plane/ui";
import type { TLinkOperations } from "./use-links";

export type TLinkOperationsModal = Exclude<TLinkOperations, "remove">;

export type TLinkCreateFormFieldOptions = TLinkEditableFields & {
  id?: string;
};

export type TLinkCreateEditModal = {
  isModalOpen: boolean;
  handleOnClose?: () => void;
  linkOperations: TLinkOperationsModal;
  preloadedData?: TLinkCreateFormFieldOptions;
};

const defaultValues: TLinkCreateFormFieldOptions = {
  title: "",
  url: "",
};

export const LinkCreateUpdateModal = observer(function LinkCreateUpdateModal(props: TLinkCreateEditModal) {
  // props
  const { isModalOpen, handleOnClose, linkOperations, preloadedData } = props;
  // react hook form
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<TLinkCreateFormFieldOptions>({
    defaultValues,
  });
  const { t } = useTranslation();

  const onClose = () => {
    if (handleOnClose) handleOnClose();
  };

  const handleFormSubmit = async (formData: TLinkCreateFormFieldOptions) => {
    const parsedUrl = formData.url.startsWith("http") ? formData.url : `http://${formData.url}`;
    try {
      if (!formData || !formData.id) await linkOperations.create({ title: formData.title, url: parsedUrl });
      else await linkOperations.update(formData.id, { title: formData.title, url: parsedUrl });
      onClose();
    } catch (error) {
      console.error("error", error);
    }
  };

  useEffect(() => {
    if (isModalOpen) reset({ ...defaultValues, ...preloadedData });
    return () => reset(defaultValues);
  }, [preloadedData, reset, isModalOpen]);

  return (
    <ModalCore isOpen={isModalOpen} handleClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-18 font-medium text-secondary">
            {preloadedData?.id ? t("update") : t("add")} {t("home.quick_links.title")}
          </h3>
          <div className="mt-2 space-y-3">
            <div>
              <label htmlFor="url" className="mb-2 text-secondary text-14 font-medium">
                {t("link.modal.url.text")}
                <span className="text-10 block">{t("required")}</span>
              </label>
              <Controller
                control={control}
                name="url"
                rules={{
                  required: t("link.modal.url.required"),
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="url"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.url)}
                    placeholder={t("link.modal.url.placeholder")}
                    className="w-full"
                  />
                )}
              />
              {errors.url && <span className="text-11 text-danger-primary">{t("link.modal.url.required")}</span>}
            </div>
            <div>
              <label htmlFor="title" className="mb-2 text-secondary text-14 font-medium">
                {t("link.modal.title.text")}
                <span className="text-10 block">{t("optional")}</span>
              </label>
              <Controller
                control={control}
                name="title"
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="title"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.title)}
                    placeholder={t("link.modal.title.placeholder")}
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
            {preloadedData?.id ? (isSubmitting ? t("updating") : t("update")) : isSubmitting ? t("adding") : t("add")}{" "}
            {t("home.quick_links.title")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
