import { getWeekOfMonth, isValid } from "date-fns";
import { CHART_X_AXIS_DATE_PROPERTIES, ChartXAxisDateGrouping, TO_CAPITALIZE_PROPERTIES } from "@plane/constants";
import type { ChartXAxisProperty, TChart, TChartDatum } from "@plane/types";
import {
  capitalizeFirstLetter,
  hexToHsl,
  hslToHex,
  renderFormattedDate,
  renderFormattedDateWithoutYear,
} from "@plane/utils";
//

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
    const missingValues: Record<string, number> = Object.fromEntries(missingKeys.map((key) => [key, 0]));

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
