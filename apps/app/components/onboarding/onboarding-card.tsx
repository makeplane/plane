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
};

export const OnboardingCard: React.FC<Props> = ({ data }) => (
  <>
    <div className="h-44 w-full">
      <Image src={data.imgURL} height="180" width="450" alt={data.title} />
    </div>
    <h3 className="text-3xl font-medium">{data.title}</h3>
    <p className="text-base text-gray-400">{data.description}</p>
    <span className="text-base text-gray-400">{data.step}</span>
  </>
);
