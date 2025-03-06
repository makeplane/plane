import { CaseSensitive, ChartArea, ChartColumnBig, ChartPie, ChartSpline, LifeBuoy, LucideIcon } from "lucide-react";
// plane imports
import { EWidgetChartTypes } from "@plane/constants";

type Props = {
  className?: string;
  type: EWidgetChartTypes;
};

export const WidgetChartTypeIcon: React.FC<Props> = (props) => {
  const { className, type } = props;

  let Icon: LucideIcon | null = null;

  switch (type) {
    case EWidgetChartTypes.BAR_CHART:
      Icon = ChartColumnBig;
      break;
    case EWidgetChartTypes.LINE_CHART:
      Icon = ChartSpline;
      break;
    case EWidgetChartTypes.AREA_CHART:
      Icon = ChartArea;
      break;
    case EWidgetChartTypes.DONUT_CHART:
      Icon = LifeBuoy;
      break;
    case EWidgetChartTypes.PIE_CHART:
      Icon = ChartPie;
      break;
    case EWidgetChartTypes.TEXT:
      Icon = CaseSensitive;
      break;
    default:
      Icon = null;
  }

  return Icon ? <Icon className={className} /> : null;
};
