import { API_BASE_URL } from "@plane/constants";
import APIService from "../api.service";

export default class IntakeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
}
