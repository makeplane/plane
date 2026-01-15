import type { FC } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
// plane types
import { Button } from "@plane/propel/button";
import type { TIssueLinkEditableFields, TIssueServiceType } from "@plane/types";
// plane ui
import { Input, ModalCore } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// types
import type { TLinkOperations } from "./root";

export type TLinkOperationsModal = Exclude<TLinkOperations, "remove">;

export type TIssueLinkCreateFormFieldOptions = TIssueLinkEditableFields & {
  id?: string;
};

export type TIssueLinkCreateEditModal = {
  isModalOpen: boolean;
  handleOnClose?: () => void;
  linkOperations: TLinkOperationsModal;
  issueServiceType: TIssueServiceType;
};

const defaultValues: TIssueLinkCreateFormFieldOptions = {
  title: "",
  url: "",
};

export const IssueLinkCreateUpdateModal = observer(function IssueLinkCreateUpdateModal(
  props: TIssueLinkCreateEditModal
) {
  const { isModalOpen, handleOnClose, linkOperations, issueServiceType } = props;
  // i18n
  const { t } = useTranslation();
  // react hook form
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<TIssueLinkCreateFormFieldOptions>({
    defaultValues,
  });
  // store hooks
  const { issueLinkData: preloadedData, setIssueLinkData } = useIssueDetail(issueServiceType);

  const onClose = () => {
    setIssueLinkData(null);
    if (handleOnClose) handleOnClose();
  };

  const handleFormSubmit = async (formData: TIssueLinkCreateFormFieldOptions) => {
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
  }, [preloadedData, reset, isModalOpen]);

  return (
    <ModalCore isOpen={isModalOpen} handleClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-h4-medium text-secondary">
            {preloadedData?.id ? t("common.update_link") : t("common.add_link")}
          </h3>
          <div className="mt-2 space-y-3">
            <div>
              <label htmlFor="url" className="mb-2 text-secondary">
                {t("common.url")}
              </label>
              <Controller
                control={control}
                name="url"
                rules={{
                  required: "URL is required",
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
              {errors.url && (
                <span className="text-caption-sm-regular text-danger-primary">{t("common.url_is_invalid")}</span>
              )}
            </div>
            <div>
              <label htmlFor="title" className="mb-2 text-secondary">
                {t("common.display_title")}
                <span className="text-caption-xs-regular block">{t("common.optional")}</span>
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
                    placeholder={t("common.link_title_placeholder")}
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
            {`${
              preloadedData?.id
                ? isSubmitting
                  ? t("common.updating")
                  : t("common.update")
                : isSubmitting
                  ? t("common.adding")
                  : t("common.add")
            } ${t("common.link")}`}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
