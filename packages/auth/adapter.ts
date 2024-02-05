import axios from "axios";

export default function PlaneAuthAdapter(BASE_URL: string) {
  return {
    createUser: async (data: any) =>
      await axios
        .post(BASE_URL + "/api/auth/register/", {
          ...data,
        })
        .then((res) => res.data),
    getUser: async (id: string) =>
      await axios.get(BASE_URL + `/api/user/${id}/`).then((res) => res.data),
    getUserByEmail: async (email: string) =>
      await axios
        .post(BASE_URL + "/api/auth/check/", { email })
        .then((res) => res.data),
    getUserByAccount: async (provider_id: string) =>
      await axios
        .post(BASE_URL + "/api/auth/account-check/", { provider_id })
        .then((res) => res.data),
    updateUser: async ({ id, ...data }: any) =>
      await axios
        .put(BASE_URL + `/api/user/${id}/`, { data })
        .then((res) => res.data),
    deleteUser: async (id: string) =>
      await axios.delete(BASE_URL + `/api/user/${id}/`),
    createVerificationToken: async (data: any) =>
      await axios.post(BASE_URL + "/api/auth/token/", data),
    useVerificationToken: async (token: string) =>
      await axios.post(BASE_URL + "/api/auth/verify/", { token }),
    linkAccount: async (data: any) =>
      await axios.post(BASE_URL + "/api/auth/accounts/", data),
    unlinkAccount: async (provider_id: string) =>
      await axios.delete(BASE_URL + `/api/auth/accounts/${provider_id}`),
  };
}
