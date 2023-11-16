import { FC } from "react";
import { useForm } from "react-hook-form";
// ui
import { Input } from "@plane/ui";
// types
import { IInstance } from "types/instance";

export interface IInstanceGeneralForm {
  data: IInstance;
}

export interface GeneralFormValues {
  instance_name: string;
  namespace: string | null;
  is_telemetry_enabled: boolean;
}

export const InstanceGeneralForm: FC<IInstanceGeneralForm> = (props) => {
  const { data } = props;

  const {} = useForm<GeneralFormValues>({
    defaultValues: {
      instance_name: data.instance_name,
      namespace: data.namespace,
      is_telemetry_enabled: data.is_telemetry_enabled,
    },
  });

  return (
    <div className="p-5">
      <div className="my-2 ">
        <label>Instance Name</label>
        <Input name="instance_name" />
      </div>
      <div className="my-2">
        <label>Instance ID</label>
        <Input name="instance_id" value={data.instance_id} disabled={true} />
      </div>
      <div className="my-2">
        <label>Namespace</label>
        <Input name="namespace" />
      </div>
    </div>
  );
};
