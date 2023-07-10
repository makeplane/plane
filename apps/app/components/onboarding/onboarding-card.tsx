import React from "react";
import Image from "next/image";

interface IOnboardingCard {
  step: string;
  title: string;
  description: React.ReactNode | string;
  imgURL: string;
}

type Props = {
  data: IOnboardingCard;
  gradient?: boolean;
};

export const OnboardingCard: React.FC<Props> = ({ data, gradient = false }) => (
  <div
    className={`flex flex-col items-center justify-center gap-7 rounded-[10px] px-14 pt-10 text-center ${
      gradient ? "bg-gradient-to-b from-[#C1DDFF] via-brand-base to-transparent" : ""
    }`}
  >
    <div className="h-44 w-full">
      <Image src={data.imgURL} height="180" width="450" alt={data.title} />
    </div>
    <h3 className="text-2xl font-medium">{data.title}</h3>
    <p className="text-base text-custom-text-200">{data.description}</p>
    <span className="text-base text-custom-text-200">{data.step}</span>
  </div>
);
