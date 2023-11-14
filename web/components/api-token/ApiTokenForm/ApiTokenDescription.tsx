import { TextArea } from "@plane/ui";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { IApiToken } from "types/api_token";
import { IApiFormFields } from "./types";
import { Dispatch, SetStateAction } from "react";

interface IApiTokenDescription {
  generatedToken: IApiToken | null | undefined;
  control: Control<IApiFormFields, any>;
  focusDescription: boolean;
  setFocusTitle: Dispatch<SetStateAction<boolean>>;
  setFocusDescription: Dispatch<SetStateAction<boolean>>;
}

export const ApiTokenDescription = ({
  generatedToken,
  control,
  focusDescription,
  setFocusTitle,
  setFocusDescription,
}: IApiTokenDescription) => (
  <Controller
    control={control}
    name="description"
    render={({ field: { value, onChange } }) =>
      focusDescription ? (
        <TextArea
          id="description"
          name="description"
          autoFocus={true}
          onBlur={() => {
            setFocusDescription(false);
          }}
          value={value}
          defaultValue={value}
          onChange={onChange}
          placeholder="Description"
          className="mt-3"
          rows={3}
        />
      ) : (
        <p
          onClick={() => {
            if (generatedToken != null) return;
            setFocusTitle(false);
            setFocusDescription(true);
          }}
          className={`${value.length === 0 ? "text-custom-text-400/60" : "text-custom-text-300"} text-lg pt-3`}
        >
          {value.length != 0 ? value : "Description"}
        </p>
      )
    }
  />
);
