/* eslint-disable @typescript-eslint/no-namespace */
// file: /Users/saurabhkumar/work/plane-ee/silo/src/middleware/external-api-token.middleware.ts

import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { env } from "@/env";
import { responseHandler } from "@/helpers/response-handler";

export const validateUserAuthentication = () => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userEndpoint = encodeURI(`${env.API_BASE_URL}/api/users/me`);
        // Fetch external API token
        const userResponse = await axios.get(userEndpoint, {
            headers: {
                'Cookie': req.headers.cookie,
            }
        });

        // Attach token to request
        const { id } = userResponse && userResponse.data;

        if (!id) {
            return responseHandler(res, 401, { error: "Invalid Credentials" });
        }

        // Attach token to request for downstream use
        req.userId = id;

        // TODO: validate if user is part of that workspace
        next();
    } catch (error) {
        return responseHandler(res, 500, error);
    }
};


// Extend Request interface to include externalApiToken
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}
