import { Control, Controller, FieldErrors } from "react-hook-form";
import { Input } from "@plane/ui";
import { IExtendedWebhook } from "types/webhook";

interface IWebHookInput {
  control: Control<IExtendedWebhook, any>;
  errors: FieldErrors<IExtendedWebhook>;
}

export const WebHookInput = ({ control, errors }: IWebHookInput) => (
  <div>
    <div className="font-medium text-sm">URL</div>
    <Controller
      control={control}
      name="url"
      rules={{
        required: "URL is Required",
        validate: (value) => (/^(ftp|http|https):\/\/[^ "]+$/.test(value) ? true : "Enter a valid URL"),
      }}
      render={({ field: { onChange, value } }) => (
        <Input
          className="w-full h-11"
          onChange={onChange}
          value={value}
          id="url"
          autoComplete="off"
          placeholder="Enter URL"
        />
      )}
    />
    {errors.url && <p className="py-2 text-sm text-red-500">{errors.url.message}</p>}
  </div>
);
