import { action, makeObservable, observable } from "mobx";

export class LabelFormState {
    isUpdating: boolean = false;
    showLabelForm: boolean = false;

    constructor() {
        makeObservable(this, {
            isUpdating: observable,
            showLabelForm: observable,
            setIsUpdating: action,
            setLabelForm: action,
        })
    }
    
    setIsUpdating = (v: boolean) => {
        this.isUpdating = v
    }

    setLabelForm = (v: boolean) => {
        this.showLabelForm = v
    }
}

export const labelFormState = new LabelFormState();
