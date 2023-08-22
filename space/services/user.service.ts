// services
import APIService from "services/api.service";

class UserService extends APIService {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async currentUser(): Promise<any> {
    return this.get("/api/users/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default UserService;
