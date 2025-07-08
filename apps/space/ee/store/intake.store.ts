import { makeObservable, observable } from "mobx";
// plane imports
import { SitesIntakeService } from "@plane/services";
import { TIntakeIssueForm } from "@plane/types";
// types
import { TPublicCycle } from "@/types/cycle";

export interface IIntakeStore {
  // observables
  cycles: TPublicCycle[] | undefined;
  // crud actions
  publishIntakeForm: (anchor: string, data: TIntakeIssueForm) => void;
}

export class IntakeStore implements IIntakeStore {
  cycles: TPublicCycle[] | undefined = undefined;
  intakeService: SitesIntakeService;

  constructor() {
    makeObservable(this, {
      // observables
      cycles: observable,
      // fetch action
    });
    this.intakeService = new SitesIntakeService();
  }

  publishIntakeForm = async (anchor: string, data: TIntakeIssueForm) => {
    try {
      await this.intakeService.publishForm(anchor, data);
    } catch (error) {
      console.error("Error publishing intake form", error);
      throw error;
    }
  };
}
