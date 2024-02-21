import axios from "axios";

const googleSignIn = async ({ account, user }: any) => {
  console.log("SIGN IN CALLBACKS");
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const userResponse = await axios
      .post(BASE_URL + "/api/auth/google/", {
        provider_account_id: account?.providerAccountId,
        access_token: account?.access_token,
        access_token_expired_at: account?.expires_at,
        meta: {
          id_token: account?.id_token,
        },
        email: user?.email,
        first_name: user?.name,
        avatar: user.image,
      })
      .then((res) => res.data);
    user.id = userResponse?.id;
    user.email = userResponse?.email;
    user.first_name = userResponse?.first_name;
    user.last_name = userResponse?.last_name;
    user.avatar = userResponse?.avatar;
    user.display_name = userResponse?.display_name;
    user.is_bot = userResponse?.is_bot;
    return true;
  } catch (err) {
    return false;
  }
};

const githubSignIn = async ({ account, user }: any) => {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const userResponse = await axios
      .post(BASE_URL + "/api/auth/google/", {
        provider_account_id: account?.providerAccountId,
        access_token: account?.access_token,
        access_token_expired_at: account?.expires_at,
        meta: {
          id_token: account?.id_token,
        },
        email: user?.email,
        first_name: user?.name,
        avatar: user.image,
      })
      .then((res) => res.data);
    user.id = userResponse?.id;
    user.email = userResponse?.email;
    user.first_name = userResponse?.first_name;
    user.last_name = userResponse?.last_name;
    user.avatar = userResponse?.avatar;
    user.display_name = userResponse?.display_name;
    user.is_bot = userResponse?.is_bot;
    return true;
  } catch (err) {
    return false;
  }
};

export const signIn = async ({ account, user }: any) => {
  if (account.provider === "google") {
    return await googleSignIn({ account, user });
  }
  if (account.provider === "github") {
    return await githubSignIn({ account, user });
  }
  return false;
};
