import { getWeekOfMonth, isValid } from "date-fns";
import { CHART_X_AXIS_DATE_PROPERTIES, ChartXAxisDateGrouping, ChartXAxisProperty, TO_CAPITALIZE_PROPERTIES } from "@plane/constants";
import { TChart, TChartColorScheme, TChartDatum } from "@plane/types";
import { capitalizeFirstLetter, hexToHsl, hslToHex, renderFormattedDate } from "@plane/utils";
import { renderFormattedDateWithoutYear } from "@/helpers/date-time.helper";


export const CHART_COLOR_PALETTES: {
  key: TChartColorScheme;
  i18n_label: string;
  light: string[];
  dark: string[];
}[] = [
    {
      key: "modern",
      i18n_label: "dashboards.widget.color_palettes.modern",
      light: [
        "#6172E8",
        "#8B6EDB",
        "#E05F99",
        "#29A383",
        "#CB8A37",
        "#3AA7C1",
        "#F1B24A",
        "#E84855",
        "#50C799",
        "#B35F9E",
      ],
      dark: [
        "#6B7CDE",
        "#8E9DE6",
        "#D45D9E",
        "#2EAF85",
        "#D4A246",
        "#29A7C1",
        "#B89F6A",
        "#D15D64",
        "#4ED079",
        "#A169A4",
      ],
    },
    {
      key: "horizon",
      i18n_label: "dashboards.widget.color_palettes.horizon",
      light: [
        "#E76E50",
        "#289D90",
        "#F3A362",
        "#E9C368",
        "#264753",
        "#8A6FA0",
        "#5B9EE5",
        "#7CC474",
        "#BA7DB5",
        "#CF8640",
      ],
      dark: [
        "#E05A3A",
        "#1D8A7E",
        "#D98B4D",
        "#D1AC50",
        "#3A6B7C",
        "#7D6297",
        "#4D8ACD",
        "#569C64",
        "#C16A8C",
        "#B77436",
      ],
    },
    {
      key: "earthen",
      i18n_label: "dashboards.widget.color_palettes.earthen",
      light: [
        "#386641",
        "#6A994E",
        "#A7C957",
        "#E97F4E",
        "#BC4749",
        "#9E2A2B",
        "#80CED1",
        "#5C3E79",
        "#526EAB",
        "#6B5B95",
      ],
      dark: [
        "#497752",
        "#7BAA5F",
        "#B8DA68",
        "#FA905F",
        "#CD585A",
        "#AF3B3C",
        "#91DFE2",
        "#6D4F8A",
        "#637FBC",
        "#7C6CA6",
      ],
    },
  ];

const getDateGroupingName = (date: string, dateGrouping: ChartXAxisDateGrouping): string => {
  if (!date || ["none", "null"].includes(date.toLowerCase())) return "None";

  const formattedData = new Date(date);
  const isValidDate = isValid(formattedData);

  if (!isValidDate) return date;

  const year = formattedData.getFullYear();
  const currentYear = new Date().getFullYear();

  const isCurrentYear = year === currentYear;

  let parsedName: string | undefined;

  switch (dateGrouping) {
    case ChartXAxisDateGrouping.DAY:
      if (isCurrentYear) parsedName = renderFormattedDateWithoutYear(formattedData);
      else parsedName = renderFormattedDate(formattedData);
      break;
    case ChartXAxisDateGrouping.WEEK: {
      const month = renderFormattedDate(formattedData, "MMM");
      parsedName = `${month}, Week ${getWeekOfMonth(formattedData)}`;
      break;
    }
    case ChartXAxisDateGrouping.MONTH:
      if (isCurrentYear) parsedName = renderFormattedDate(formattedData, "MMM");
      else parsedName = renderFormattedDate(formattedData, "MMM, yyyy");
      break;
    case ChartXAxisDateGrouping.YEAR:
      parsedName = `${year}`;
      break;
    default:
      parsedName = date;
  }

  return parsedName ?? date;
};

export const parseChartData = (
  data: TChart | null | undefined,
  xAxisProperty: ChartXAxisProperty | null | undefined,
  groupByProperty: ChartXAxisProperty | null | undefined,
  xAxisDateGrouping: ChartXAxisDateGrouping | null | undefined
): TChart => {
  if (!data) {
    return {
      data: [],
      schema: {},
    };
  }
  const widgetData = structuredClone(data.data);
  const schema = structuredClone(data.schema);
  const allKeys = Object.keys(schema);
  const updatedWidgetData: TChartDatum[] = widgetData.map((datum) => {
    const keys = Object.keys(datum);
    const missingKeys = allKeys.filter((key) => !keys.includes(key));
    const missingValues: Record<string, number> = Object.fromEntries(missingKeys.map(key => [key, 0]));

    if (xAxisProperty) {
      // capitalize first letter if xAxisProperty is in TO_CAPITALIZE_PROPERTIES and no groupByProperty is set
      if (TO_CAPITALIZE_PROPERTIES.includes(xAxisProperty)) {
        datum.name = capitalizeFirstLetter(datum.name);
      }

      // parse timestamp to visual date if xAxisProperty is in WIDGET_X_AXIS_DATE_PROPERTIES
      if (CHART_X_AXIS_DATE_PROPERTIES.includes(xAxisProperty)) {
        datum.name = getDateGroupingName(datum.name, xAxisDateGrouping ?? ChartXAxisDateGrouping.DAY);
      }
    }

    return {
      ...datum,
      ...missingValues,
    };
  });

  // capitalize first letter if groupByProperty is in TO_CAPITALIZE_PROPERTIES
  const updatedSchema = schema;
  if (groupByProperty) {
    if (TO_CAPITALIZE_PROPERTIES.includes(groupByProperty)) {
      Object.keys(updatedSchema).forEach((key) => {
        updatedSchema[key] = capitalizeFirstLetter(updatedSchema[key]);
      });
    }

    if (CHART_X_AXIS_DATE_PROPERTIES.includes(groupByProperty)) {
      Object.keys(updatedSchema).forEach((key) => {
        updatedSchema[key] = getDateGroupingName(updatedSchema[key], xAxisDateGrouping ?? ChartXAxisDateGrouping.DAY);
      });
    }
  }

  return {
    data: updatedWidgetData,
    schema: updatedSchema,
  };
};

export const generateExtendedColors = (baseColorSet: string[], targetCount: number) => {
  const colors = [...baseColorSet];
  const baseCount = baseColorSet.length;

  if (targetCount <= baseCount) {
    return colors.slice(0, targetCount);
  }

  // Convert base colors to HSL
  const baseHSL = baseColorSet.map(hexToHsl);

  // Calculate average saturation and lightness from base colors
  const avgSat = baseHSL.reduce((sum, hsl) => sum + hsl.s, 0) / baseHSL.length;
  const avgLight = baseHSL.reduce((sum, hsl) => sum + hsl.l, 0) / baseHSL.length;

  // Sort base colors by hue for better distribution
  const sortedBaseHSL = [...baseHSL].sort((a, b) => a.h - b.h);

  // Generate additional colors for each base color
  const colorsNeeded = targetCount - baseCount;
  const colorsPerBase = Math.ceil(colorsNeeded / baseCount);

  for (let i = 0; i < baseCount; i++) {
    const baseColor = sortedBaseHSL[i];
    const nextBaseColor = sortedBaseHSL[(i + 1) % baseCount];

    // Calculate hue distance to next base color
    const hueDistance = (nextBaseColor.h - baseColor.h + 360) % 360;
    const hueParts = colorsPerBase + 1;

    // Narrower ranges for more consistency
    const satRange = [Math.max(40, avgSat - 5), Math.min(60, avgSat + 5)];
    const lightRange = [Math.max(40, avgLight - 5), Math.min(60, avgLight + 5)];

    for (let j = 1; j <= colorsPerBase; j++) {
      if (colors.length >= targetCount) break;

      // Create evenly spaced hue variations between base colors
      const hueStep = (hueDistance / hueParts) * j;
      const newHue = (baseColor.h + hueStep) % 360;

      // Keep saturation and lightness closer to base color
      const newSat = baseColor.s * 0.8 + avgSat * 0.2;
      const newLight = baseColor.l * 0.8 + avgLight * 0.2;

      // Ensure values stay within desired ranges
      const finalSat = Math.max(satRange[0], Math.min(satRange[1], newSat));
      const finalLight = Math.max(lightRange[0], Math.min(lightRange[1], newLight));

      colors.push(
        hslToHex({
          h: newHue,
          s: finalSat,
          l: finalLight,
        })
      );
    }
  }

  return colors.slice(0, targetCount);
};