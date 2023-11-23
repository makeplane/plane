import { Dispatch, FC, SetStateAction } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
// ui
import { Input } from "@plane/ui";
// types
import { IApiToken } from "types/api_token";
import type { APIFormFields } from "./index";

interface APITokenTitleProps {
  generatedToken: IApiToken | null | undefined;
  errors: FieldErrors<APIFormFields>;
  control: Control<APIFormFields, any>;
  focusTitle: boolean;
  setFocusTitle: Dispatch<SetStateAction<boolean>>;
  setFocusDescription: Dispatch<SetStateAction<boolean>>;
}

export const APITokenTitle: FC<APITokenTitleProps> = (props) => {
  const { generatedToken, errors, control, focusTitle, setFocusTitle, setFocusDescription } = props;

  return (
    <Controller
      control={control}
      name="title"
      rules={{
        required: "Title is required",
        maxLength: {
          value: 255,
          message: "Title should be less than 255 characters",
        },
      }}
      render={({ field: { value, onChange, ref } }) =>
        focusTitle ? (
          <Input
            id="title"
            name="title"
            type="text"
            inputSize="md"
            onBlur={() => {
              setFocusTitle(false);
            }}
            onError={() => {
              console.log("error");
            }}
            autoFocus
            value={value}
            onChange={onChange}
            ref={ref}
            hasError={!!errors.title}
            placeholder="Title"
            className="resize-none text-xl w-full"
          />
        ) : (
          <p
            onClick={() => {
              if (generatedToken != null) return;
              setFocusDescription(false);
              setFocusTitle(true);
            }}
            role="button"
            className={`${value.length === 0 ? "text-custom-text-400/60" : ""} font-medium text-[24px]`}
          >
            {value.length != 0 ? value : "Api Title"}
          </p>
        )
      }
    />
  );
};
