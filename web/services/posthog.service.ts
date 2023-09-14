import APIService from "./api.service";

class PosthogService extends APIService {
  constructor() {
    super("");
  }
  capture(event: string, data: any = {}, user: any = {}) {
    this.request({
      method: "post",
      url: `${process.env.NEXT_PUBLIC_POSTHOG_HOST || ""}/capture/`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        properties: {
          user,
          ...data,
        },
        distinct_id: user?.email,
        event,
      },
    });
  }
}

export default PosthogService;
