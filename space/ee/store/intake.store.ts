import { makeObservable, observable } from "mobx";
import { TPublicCycle } from "@/types/cycle";
import { TIntakeIssueForm } from "@/types/intake";
import { IntakeService } from "../services/intake.service";

export interface IIntakeStore {
  // observables
  cycles: TPublicCycle[] | undefined;
  // crud actions
  publishIntakeForm: (anchor: string, data: TIntakeIssueForm) => void;
}

export class IntakeStore implements IIntakeStore {
  cycles: TPublicCycle[] | undefined = undefined;
  intakeService: IntakeService;

  constructor() {
    makeObservable(this, {
      // observables
      cycles: observable,
      // fetch action
    });
    this.intakeService = new IntakeService();
  }

  publishIntakeForm = async (anchor: string, data: TIntakeIssueForm) => {
    try {
      await this.intakeService.publishForm(anchor, data);
    } catch (error) {
      throw error;
    }
  };
}
