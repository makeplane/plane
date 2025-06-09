/* eslint-disable no-useless-catch */

import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane web services
import { EProductSubscriptionEnum } from "@plane/constants";
import { PaymentService } from "@/plane-web/services/payment.service";
import selfHostedSubscriptionService from "@/plane-web/services/self-hosted-subscription.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TSelfHostedSubscription } from "@/plane-web/types/self-hosted-subscription";

const paymentService = new PaymentService();

export interface ISelfHostedSubscriptionStore {
  // observables
  licenses: Record<string, TSelfHostedSubscription>;
  isActivationModalOpen: boolean;
  // computed function
  licenseActivationByWorkspaceSlug: () => boolean;
  // helper actions
  toggleLicenseActivationModal: (isOpen?: boolean) => void;
  // actions
  fetchSubscription: (workspaceSlug: string) => Promise<TSelfHostedSubscription | undefined>;
  activateUsingLicenseKey: (workspaceSlug: string, license_key: string) => Promise<TSelfHostedSubscription | undefined>;
  activateUsingLicenseFile: (workspaceSlug: string, file: File) => Promise<TSelfHostedSubscription | undefined>;
  syncLicense: (workspaceSlug: string) => Promise<void>;
  deactivateLicense: (workspaceSlug: string) => Promise<void>;
}

export class SelfHostedSubscriptionStore implements ISelfHostedSubscriptionStore {
  // observables
  licenses: Record<string, TSelfHostedSubscription> = {};
  isActivationModalOpen = false;

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      // observables
      licenses: observable,
      isActivationModalOpen: observable.ref,
      // helper actions
      toggleLicenseActivationModal: action,
      // actions
      fetchSubscription: action,
      activateUsingLicenseKey: action,
      activateUsingLicenseFile: action,
      syncLicense: action,
      deactivateLicense: action,
    });
  }

  // computed function
  /**
   * @description get license activation by workspace slug
   * @param { string } workspaceSlug
   */
  licenseActivationByWorkspaceSlug = computedFn(() => {
    const currentSubscription = this.rootStore.workspaceSubscription.currentWorkspaceSubscribedPlanDetail;
    if (!currentSubscription) return false;
    return (
      // currentSubscription.is_self_managed &&
      currentSubscription.product !== EProductSubscriptionEnum.FREE && !!currentSubscription.subscription
    );
  });

  // actions
  toggleLicenseActivationModal = (isOpen?: boolean) => {
    this.isActivationModalOpen = isOpen ?? !this.isActivationModalOpen;
  };

  /**
   * @description fetch workspace activation
   * @param { string } workspaceSlug
   * @returns { void }
   */
  fetchSubscription = async (workspaceSlug: string): Promise<TSelfHostedSubscription | undefined> => {
    try {
      const licenseResponse = await selfHostedSubscriptionService.fetchSubscription(workspaceSlug);
      if (licenseResponse) {
        runInAction(() => {
          set(this.licenses, workspaceSlug, licenseResponse);
        });
      }
      return licenseResponse;
    } catch (error) {
      console.error("selfHostedSubscriptionService -> fetchSubscription -> error", error);
      throw error;
    }
  };

  private processLicenseActivation = async (workspaceSlug: string, license: TSelfHostedSubscription | undefined) => {
    await Promise.all([
      this.rootStore.workspaceSubscription.fetchWorkspaceSubscribedPlan(workspaceSlug),
      this.rootStore.featureFlags.fetchFeatureFlags(workspaceSlug),
    ]);
    if (license) {
      runInAction(() => {
        set(this.licenses, workspaceSlug, license);
      });
    }
  };

  /**
   * @description update worklog
   * @param { string } workspaceSlug
   * @param { string } license_key
   * @returns { TWorklog | undefined }
   */
  activateUsingLicenseKey = async (
    workspaceSlug: string,
    license_key: string
  ): Promise<TSelfHostedSubscription | undefined> => {
    if (!workspaceSlug) return undefined;

    try {
      const payload = {
        license_key: license_key,
      };
      const license = await selfHostedSubscriptionService.activateUsingLicenseKey(workspaceSlug, payload);
      await this.processLicenseActivation(workspaceSlug, license);
      return license;
    } catch (error) {
      console.error("worklog -> updateWorklogById -> error", error);
      throw error;
    }
  };

  /**
   * @description activate workspace license using license file
   * @param { string } workspaceSlug
   * @param { File } file
   * @returns { TSelfHostedSubscription | undefined }
   */
  activateUsingLicenseFile = async (
    workspaceSlug: string,
    file: File
  ): Promise<TSelfHostedSubscription | undefined> => {
    if (!workspaceSlug) return undefined;

    try {
      const license = await selfHostedSubscriptionService.activateUsingLicenseFile(workspaceSlug, file);
      await this.processLicenseActivation(workspaceSlug, license);
      return license;
    } catch (error) {
      console.error("selfHostedSubscriptionService -> activateUsingLicenseFile -> error", error);
      throw error;
    }
  };

  /**
   * @description sync license
   * @param { string } workspaceSlug
   * @returns { void }
   */
  syncLicense = async (workspaceSlug: string): Promise<void> => {
    try {
      await paymentService.refreshWorkspaceCurrentPlan(workspaceSlug);
      await Promise.all([
        this.rootStore.workspaceSubscription.fetchWorkspaceSubscribedPlan(workspaceSlug),
        this.rootStore.featureFlags.fetchFeatureFlags(workspaceSlug),
      ]);
    } catch (error) {
      console.error("selfHostedSubscriptionService -> syncLicense -> error", error);
      throw error;
    }
  };

  /**
   * @description deactivate license
   * @param { string } workspaceSlug
   * @returns { void }
   */
  deactivateLicense = async (workspaceSlug: string): Promise<void> => {
    try {
      await selfHostedSubscriptionService.deactivateLicense(workspaceSlug);
      // fetch workspace subscribed plan
      await this.rootStore.workspaceSubscription.fetchWorkspaceSubscribedPlan(workspaceSlug);
      // remove feature flags
      delete this.rootStore.featureFlags.flags[workspaceSlug];
    } catch (error) {
      console.error("selfHostedSubscriptionService -> deactivateLicense -> error", error);
      throw error;
    }
  };
}
