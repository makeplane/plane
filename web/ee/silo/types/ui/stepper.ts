export type TStepperBlock<T> = {
  key: T;
  icon?: () => JSX.Element;
  title: string;
  description: string;
  component: () => JSX.Element;
  prevStep: T | undefined;
  nextStep: T | undefined;
};

export type TStepper<T> = {
  logo?: string;
  steps: TStepperBlock<T>[];
  currentStepIndex: number;
};

export type TStepperNavigation<T> = {
  currentStep: TStepperBlock<T>;
  handleStep: (direction: "previous" | "next") => void;
  children?: React.ReactNode;
};
