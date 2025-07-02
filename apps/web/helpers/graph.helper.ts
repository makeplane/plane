// ------------ DEPRECATED (Use re-charts and its helpers instead) ------------

export const generateYAxisTickValues = (data: number[]) => {
  if (!data || !Array.isArray(data) || data.length === 0) return [];

  const minValue = 0;
  const maxValue = Math.max(...data);

  const valueRange = maxValue - minValue;

  let tickInterval = 1;

  if (valueRange < 10) tickInterval = 1;
  else if (valueRange < 20) tickInterval = 2;
  else if (valueRange < 50) tickInterval = 5;
  else tickInterval = (Math.ceil(valueRange / 100) * 100) / 10;

  const tickValues: number[] = [];
  let tickValue = minValue;
  while (tickValue <= maxValue) {
    tickValues.push(tickValue);
    tickValue += tickInterval;
  }

  return tickValues;
};
