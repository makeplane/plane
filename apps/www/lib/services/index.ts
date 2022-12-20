import axios from "axios";
// api routes

export const APIFetcher = async (url: any) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
};
