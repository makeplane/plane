export const ILLUSTRATION_COLOR_TOKEN_MAP = {
  fill: {
    primary: "rgba(var(--color-background-100))", // white or #fff,
    secondary: "rgba(var(--color-background-90))", // #F4F5F5
    tertiary: "rgba(var(--color-background-80))", // #E5E7E8
  },
  stroke: {
    primary: "rgba(var(--color-text-200))", // #1D1F20
    secondary: "rgba(var(--color-border-400))", // #7A8185 or #CFD2D3
  },
};

export type TIllustrationAssetProps = {
  className?: string;
};
