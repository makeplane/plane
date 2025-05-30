export type TStepperBlock<T> = {
  key: T;
  icon?: () => JSX.Element;
  i18n_title: string;
  i18n_description: string;
  component: () => JSX.Element;
  prevStep: T | undefined;
  nextStep: T | undefined;
};

export type TStepper<T> = {
  logo?: string;
  serviceName: string;
  steps: TStepperBlock<T>[];
  currentStepIndex: number;
  redirectCallback?: () => void;
};

export type TStepperNavigation<T> = {
  currentStep: TStepperBlock<T>;
  handleStep: (direction: "previous" | "next") => void;
  children?: React.ReactNode;
};
