import { Input } from "@plane/ui";
import { Dispatch, SetStateAction } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { IApiToken } from "types/api_token";
import { IApiFormFields } from "./types";

interface IApiTokenTitle {
  generatedToken: IApiToken | null | undefined;
  errors: FieldErrors<IApiFormFields>;
  control: Control<IApiFormFields, any>;
  focusTitle: boolean;
  setFocusTitle: Dispatch<SetStateAction<boolean>>;
  setFocusDescription: Dispatch<SetStateAction<boolean>>;
}

export const ApiTokenTitle = ({
  generatedToken,
  errors,
  control,
  focusTitle,
  setFocusTitle,
  setFocusDescription,
}: IApiTokenTitle) => (
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
          autoFocus={true}
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
          className={`${value.length === 0 ? "text-custom-text-400/60" : ""} font-medium text-[24px]`}
        >
          {value.length != 0 ? value : "Api Title"}
        </p>
      )
    }
  />
);
