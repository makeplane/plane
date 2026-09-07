/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Every user-facing string in the attendance control, in one place.
 *
 * Deliberately not routed through `@workspaces/i18n`: the navbar this mounts into
 * hardcodes its own labels, and adding a locale key here would mean a JSON file
 * in all twenty locale directories to keep the i18n sync check green.
 */
export const ATTENDANCE_STRINGS = {
  checkIn: "Check in",
  checkOut: "Check out",
  locating: "Getting your location…",
  checkedInAt: (time: string) => `Checked in at ${time}`,
  todayTotal: (hours: string) => `${hours} today`,

  checkedInToast: "Checked in",
  checkedOutToast: "Checked out",

  notLinkedTitle: "Attendance isn't set up for your account",
  notLinked: (email: string) =>
    `Your Workspaces account (${email}) doesn't match an employee record in Odoo. Ask HR to check your work email.`,

  // The fix differs per geolocation failure, so each one says its own thing —
  // a single generic message here turns straight into support tickets.
  locationDenied: "Allow location for this site to check in — use the padlock in the address bar.",
  locationUnavailable: "Your device couldn't get a location. Move somewhere with a clearer signal and try again.",
  locationTimeout: "Getting your location took too long. Try again.",
  locationUnsupported: "Location needs a secure (HTTPS) connection, so check-in isn't available here.",

  failedTitle: "Something went wrong",
  checkInFailed: "Couldn't check you in. Try again in a moment.",
  checkOutFailed: "Couldn't check you out. Try again in a moment.",
} as const;
