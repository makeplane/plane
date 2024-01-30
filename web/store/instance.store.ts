import { observable, action, makeObservable } from "mobx";
import set from "lodash/set";
// types
import { IInstance } from "@plane/types";
// services
import { InstanceService } from "services/instance.service";

export interface IInstanceStore {
  id: string | undefined;
  instance_id: string | undefined;
  instance_name: string | undefined;
  is_activated: boolean | undefined;
  is_setup_done: boolean | undefined;
  is_signup_screen_visited: boolean | undefined;
  is_support_required: boolean | undefined;
  is_telemetry_enabled: boolean | undefined;
  license_key: string | undefined;
  namespace: string | undefined;
  version: string | undefined;
  // actions
  fetchInstanceInfo: () => Promise<IInstance>;
}

export class InstanceStore implements IInstanceStore {
  id: string | undefined;
  instance_id: string | undefined;
  instance_name: string | undefined;
  is_activated: boolean | undefined;
  is_setup_done: boolean | undefined;
  is_signup_screen_visited: boolean | undefined;
  is_support_required: boolean | undefined;
  is_telemetry_enabled: boolean | undefined;
  license_key: string | undefined;
  namespace: string | undefined;
  version: string | undefined;
  // service
  instanceService;

  constructor() {
    makeObservable(this, {
      // actions
      fetchInstanceInfo: action,
    });

    this.instanceService = new InstanceService();
  }

  updateInstanceInfo = async (data: Partial<IInstance>) => {
    Object.keys(data).forEach((key) => {
      set(this, key, data[key as keyof IInstance]);
    });
  };

  fetchInstanceInfo = async () => {
    const instance = await this.instanceService.getInstanceInfo();
    this.updateInstanceInfo(instance);
    return instance;
  };
}
