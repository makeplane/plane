export const generatePayload = (data: any) => {
  const payload = {
    args: [], // args
    kwargs: {
      data,
    }, // kwargs
    other_data: {}, // other data
  };

  return payload;
};
