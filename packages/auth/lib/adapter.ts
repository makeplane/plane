import axios from "axios";

// export default function PlaneAuthAdapter(BASE_URL: string) {
//   return {
//     createUser: async (data: any) =>
//       await axios
//         .post(BASE_URL + "/api/auth/register/", {
//           ...data,
//         })
//         .then((res) => res.data),
//     getUser: async (id: string) =>
//       await axios.get(BASE_URL + `/api/user/${id}/`).then((res) => res.data),
//     getUserByEmail: async (email: string) =>
//       await axios
//         .post(BASE_URL + "/api/auth/check/", { email })
//         .then((res) => res.data),
//     getUserByAccount: async (provider_id: string) =>
//       await axios
//         .post(BASE_URL + "/api/auth/account-check/", { provider_id })
//         .then((res) => res.data),
//     updateUser: async ({ id, ...data }: any) =>
//       await axios
//         .put(BASE_URL + `/api/user/${id}/`, { data })
//         .then((res) => res.data),
//     deleteUser: async (id: string) =>
//       await axios.delete(BASE_URL + `/api/user/${id}/`),
//     createVerificationToken: async (data: any) =>
//       await axios.post(BASE_URL + "/api/auth/token/", data),
//     useVerificationToken: async (token: string) =>
//       await axios.post(BASE_URL + "/api/auth/verify/", { token }),
//     linkAccount: async (data: any) =>
//       await axios.post(BASE_URL + "/api/auth/accounts/", data),
//     unlinkAccount: async (provider_id: string) =>
//       await axios.delete(BASE_URL + `/api/auth/accounts/${provider_id}`),
//   };
// }

export default function PlaneAuthAdapter(BASE_URL: string) {
  return {
    async createUser(data: any) {
      console.log("CREATE_USER");
      return await axios
        .post(`${BASE_URL}/api/auth/register/`, { ...data })
        .then((res) => {
          console.log(res.data);
          return { id: res.data.id, ...res.data };
        })
        .catch(() => {});
    },
    async getUser(id: string) {
      console.log("GET_USER");
      await axios
        .get(`${BASE_URL}/api/auth/users/${id}/`)
        .then((res) => res.data)
        .catch(() => {});
    },
    async getUserByEmail(email: string) {
      console.log("GET_USER_EMAIL");
      await axios
        .post(`${BASE_URL}/api/auth/email-check/`, { email })
        .then((res) => res.data)
        .catch(() => {});
    },
    async getUserByAccount({
      providerAccountId,
      provider,
    }: {
      providerAccountId: string;
      provider: string;
    }) {
      console.log("GET_USER_ACCOUNT");
      await axios
        .get(`${BASE_URL}/api/auth/accounts/${provider}/${providerAccountId}/`)
        .then((res) => res.data)
        .catch(() => {});
    },
    async linkAccount(data: any) {
      console.log("LINK_USER_ACCOUNT");
      const { provider, providerAccountId } = data;
      await axios
        .post(
          `${BASE_URL}/api/auth/accounts/${provider}/${providerAccountId}/`,
          { ...data }
        )
        .then((res) => res.data)
        .catch(() => {});
    },
    // async createSession({
    //   sessionToken,
    //   userId,
    //   expires,
    // }: {
    //   sessionToken: string;
    //   userId: string;
    //   expires: Date;
    // }) {
    //   console.log("CREATE_SESSION");
    //   return await axios
    //     .post(`${BASE_URL}/api/auth/sessions/`, {
    //       token: sessionToken,
    //       user: userId,
    //       expires: expires,
    //     })
    //     .then((res) => {
    //       const { session } = res.data;
    //       const { token, user } = session;
    //       console.log(user)
    //       return { sessionToken: token, user: user };
    //     })
    //     .catch(() => {});
    // },
    // async getSessionAndUser(sessionToken: string) {
    //   console.log("GET_SESSION_USER");
    //   return await axios
    //     .get(`${BASE_URL}/api/auth/sessions/${sessionToken}/`)
    //     .then((res) => {
    //       const { session, user } = res.data;
    //       return {
    //         session: {
    //           sessionToken: session.token,
    //           user: session.user,
    //           expires: new Date(session.expires),
    //         },
    //         user: user,
    //       };
    //     })
    //     .catch(() => {});
    // },
  };
}
