import { useEffect, useMemo, useState } from "react";
import { Button } from "@plane/propel/button";
import { CustomSelect, Input, EModalWidth, ModalCore } from "@plane/ui";
import { DEVICE_FORM_DEFAULT_VALUES } from "../devices.types";
import type { TDeviceFormMode, TDeviceFormOptions, TDeviceFormValues } from "../devices.types";

type TDeviceFormModalProps = {
  isOpen: boolean;
  mode: TDeviceFormMode;
  isSubmitting: boolean;
  initialValues: TDeviceFormValues;
  options: TDeviceFormOptions;
  onClose: () => void;
  onSubmit: (values: TDeviceFormValues) => void;
};

type TFormErrors = Partial<Record<keyof TDeviceFormValues, string>>;

const validateForm = (values: TDeviceFormValues): TFormErrors => {
  const errors: TFormErrors = {};

  if (values.pin.trim().length > 0 && values.pin.trim().length !== 6) errors.pin = "PIN must be 6 characters";

  return errors;
};

export const DeviceFormModal = ({
  isOpen,
  mode,
  isSubmitting,
  initialValues,
  options,
  onClose,
  onSubmit,
}: TDeviceFormModalProps) => {
  const [formValues, setFormValues] = useState<TDeviceFormValues>(DEVICE_FORM_DEFAULT_VALUES);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormValues(initialValues);
      setSubmitted(false);
    }
  }, [initialValues, isOpen]);

  const formErrors = useMemo(() => validateForm(formValues), [formValues]);
  const hasErrors = Object.keys(formErrors).length > 0;
  const selectedUserLabel = options.users.find((user) => user.id === formValues.userId)?.label ?? "Select user";

  const handleFieldChange = <K extends keyof TDeviceFormValues>(field: K, value: TDeviceFormValues[K]) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (hasErrors) return;

    onSubmit({
      ...formValues,
      pin: formValues.pin.trim(),
      appName: formValues.appName.trim(),
      deviceName: formValues.deviceName.trim(),
      deviceType: formValues.deviceType.trim(),
      deviceCode: formValues.deviceCode.trim(),
    });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.LG}>
      <div className="space-y-4 p-5">
        <h3 className="text-xl font-medium text-custom-text-100">
          {mode === "edit" ? "Update device" : "Register new device"}
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-custom-text-200" htmlFor="device-app-name">
              Application Name
            </label>
            <CustomSelect
              value={formValues.appName}
              onChange={(value: string) => handleFieldChange("appName", value)}
              label={<span className="truncate">{formValues.appName || "Select application"}</span>}
              className="w-full"
              buttonClassName={submitted && formErrors.appName ? "border-red-500" : ""}
              input
            >
              <CustomSelect.Option value="">Select application</CustomSelect.Option>
              {options.applications.map((application) => (
                <CustomSelect.Option key={application} value={application}>
                  {application}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
            {submitted && formErrors.appName && <p className="text-xs text-red-500">{formErrors.appName}</p>}
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-custom-text-200" htmlFor="device-name">
              Device Name
            </label>
            <Input
              id="device-name"
              value={formValues.deviceName}
              onChange={(event) => handleFieldChange("deviceName", event.target.value)}
              placeholder="Device Name"
              className="w-full"
              hasError={submitted && !!formErrors.deviceName}
            />
            {submitted && formErrors.deviceName && <p className="text-xs text-red-500">{formErrors.deviceName}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-custom-text-200" htmlFor="device-type">
              Device type
            </label>
            <CustomSelect
              value={formValues.deviceType}
              onChange={(value: string) => handleFieldChange("deviceType", value)}
              label={<span className="truncate">{formValues.deviceType || "Select device type"}</span>}
              className="w-full"
              buttonClassName={submitted && formErrors.deviceType ? "border-red-500" : ""}
              input
            >
              <CustomSelect.Option value="">Select device type</CustomSelect.Option>
              {options.deviceTypes.map((deviceType) => (
                <CustomSelect.Option key={deviceType} value={deviceType}>
                  {deviceType}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
            {submitted && formErrors.deviceType && <p className="text-xs text-red-500">{formErrors.deviceType}</p>}
          </div>

          {/* <div className="space-y-1">
            <label className="text-sm font-medium text-custom-text-200" htmlFor="device-user-id">
              User
            </label>
            <CustomSelect
              value={formValues.userId}
              onChange={(value: number | null) => handleFieldChange("userId", value)}
              label={<span className="truncate">{selectedUserLabel}</span>}
              className="w-full"
              buttonClassName={submitted && formErrors.userId ? "border-red-500" : ""}
              input
            >
              <CustomSelect.Option value={null}>Select user</CustomSelect.Option>
              {options.users.map((user) => (
                <CustomSelect.Option key={user.id} value={user.id}>
                  {user.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
            {submitted && formErrors.userId && <p className="text-xs text-red-500">{formErrors.userId}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-custom-text-200" htmlFor="device-device-id">
              Device ID
            </label>
            <Input
              id="device-device-id"
              value={formValues.deviceCode}
              onChange={(event) => handleFieldChange("deviceCode", event.target.value)}
              placeholder="Device ID"
              className="w-full"
              hasError={submitted && !!formErrors.deviceCode}
            />
            {submitted && formErrors.deviceCode && <p className="text-xs text-red-500">{formErrors.deviceCode}</p>}
          </div> */}

          <div className="space-y-1">
            <label className="text-sm font-medium text-custom-text-200" htmlFor="device-pin">
              PIN
            </label>
            <Input
              id="device-pin"
              value={formValues.pin}
              onChange={(event) => handleFieldChange("pin", event.target.value)}
              placeholder="6-digit PIN"
              className="w-full"
              maxLength={6}
              hasError={submitted && !!formErrors.pin}
            />
            {submitted && formErrors.pin && <p className="text-xs text-red-500">{formErrors.pin}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200 px-5 py-4">
        <Button variant="neutral-primary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} loading={isSubmitting}>
          {mode === "edit" ? "Update" : "Save"}
        </Button>
      </div>
    </ModalCore>
  );
};
