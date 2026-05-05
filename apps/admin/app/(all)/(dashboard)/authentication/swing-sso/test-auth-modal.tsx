/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane internal packages
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { Input } from "@plane/propel/input";
// helpers
import { API_BASE_URL } from "@plane/constants";

type TestResult = {
  success: boolean;
  result_code?: string;
  auth_result?: string;
  employee_no?: string;
  response_time_ms?: number;
  plane_user_found?: boolean;
  plane_user_email?: string;
  error_code?: number;
  error_message?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SwingSSOTestAuthModal({ isOpen, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    if (!username || !password) return;
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/instances/swing-sso/test/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as TestResult;
      setResult(data);
    } catch {
      setResult({ success: false, error_message: "Network error — could not reach the server." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setUsername("");
    setPassword("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>Test Swing SSO Authentication</Dialog.Title>
          <div className="mt-4 space-y-4">
            {!result ? (
              <>
                <div className="space-y-1">
                  <label htmlFor="test-employee-no" className="block text-13 font-medium text-primary">
                    Employee No (8 digits)
                  </label>
                  <Input
                    id="test-employee-no"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="12345678"
                    maxLength={8}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="test-password" className="block text-13 font-medium text-primary">
                    Password
                  </label>
                  <Input
                    id="test-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-13 font-medium ${
                    result.success ? "bg-success-subtle text-success-primary" : "bg-danger-subtle text-danger-primary"
                  }`}
                >
                  {result.success ? "Authentication Successful" : "Authentication Failed"}
                </div>
                <div className="rounded-md border border-subtle bg-layer-1 p-3 space-y-2 text-13">
                  {result.success ? (
                    <>
                      <Row label="Result Code" value={result.result_code} />
                      <Row label="Auth Result" value={result.auth_result} />
                      <Row label="Employee No" value={result.employee_no} />
                      <Row label="Response Time" value={`${result.response_time_ms}ms`} />
                      <Row label="Plane User Found" value={result.plane_user_found ? "Yes" : "No"} />
                      <Row label="Plane Email" value={result.plane_user_email} />
                    </>
                  ) : (
                    <>
                      <Row label="Error" value={result.error_message} />
                      {result.error_code && <Row label="Error Code" value={String(result.error_code)} />}
                      {result.response_time_ms !== undefined && (
                        <Row label="Response Time" value={`${result.response_time_ms}ms`} />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result ? (
              <Button
                variant="primary"
                onClick={() => void handleTest()}
                loading={isLoading}
                disabled={!username || !password}
              >
                Test
              </Button>
            ) : !result.success ? (
              <Button variant="primary" onClick={() => setResult(null)}>
                Try Again
              </Button>
            ) : null}
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-secondary">{label}</span>
      <span className="text-primary font-medium">{value || "—"}</span>
    </div>
  );
}
