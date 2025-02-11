import { SentryInstance } from '@/sentry-config'
import { Response } from 'express'

const { APP_ENV } = process.env

export const responseHandler = (
    res: Response,
    status: number,
    data: any = {},
    extras: any = undefined
) => {
    switch (status) {
        case 200: {
            return res.status(status).json({
                status,
                message: 'Successful',
                data,
                extras
            })
        }
        case 201: {
            return res.status(status).json({
                status,
                message: 'Created',
                data,
                extras
            })
        }
        case 400: {
            return res.status(status).json({
                status,
                message: 'Bad Request',
                errors: data,
                extras
            })
        }
        case 401: {
            return res.status(status).json({
                status,
                message: 'Unauthorized',
                errors: data,
                extras
            })
        }
        case 403: {
            return res.status(status).json({
                status,
                message: 'Permission Denied',
                errors: data,
                extras
            })
        }
        case 404: {
            return res.status(status).json({
                status,
                message: 'Not Found',
                errors: data,
                extras
            })
        }
        case 409: {
            return res.status(status).json({
                status,
                message: 'Conflict Occurred',
                errors: data,
                extras
            })
        }
        case 429: {
            return res.status(status).json({
                status,
                message: 'You have exceeded the request limit. Try After 1 hr',
                errors: data,
                extras
            })
        }
        case 500: {
            // TODO: sentry push
            SentryInstance?.captureException(data)
            return res.status(status).json({
                status,
                message: 'Internal Server Error',
                errors: APP_ENV !== 'production' ? data : {},
                extras
            })
        }
        default: {
            SentryInstance?.captureException(data)
            return res.status(status).json({
                status: 500,
                message: 'Default Internal Server Error',
                extras
            })
        }
    }
}