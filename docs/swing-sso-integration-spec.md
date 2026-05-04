# Swing SSO Integration Specification

> **Version:** 1.0 | **Updated:** 2026-04-02
> **Audience:** Development teams integrating Swing SSO with Node.js or Java backends

---

## 1. Overview

Swing SSO is the Single Sign-On authentication system used by Shinhan Group. It provides two authentication flows:

| Flow               | Protocol        | Use Case                                                                       |
| ------------------ | --------------- | ------------------------------------------------------------------------------ |
| **Password-based** | JSON over HTTPS | User enters Staff ID + Password on your login form                             |
| **Token-based**    | XML over HTTPS  | User is already authenticated in Swing portal, redirect to your app with token |

---

## 2. Prerequisites

You need the following credentials from the Swing admin team:

| Parameter      | Description                      | Example                                |
| -------------- | -------------------------------- | -------------------------------------- |
| `clientId`     | System-issued authentication key | `5E160XXXXQ41D7Y`                      |
| `clientSecret` | System secret key                | `4722d002-xxxx-xxxx-xxxx-3616ad7e140e` |
| `companyCode`  | Company code in Shinhan Group    | `VN`                                   |
| Base URL       | API gateway domain               | `https://apigw.shinhan.com:8443`       |

---

## 3. Flow 1: Password-Based Authentication (JSON)

### 3.1 API Endpoint

```
POST https://{base_url}/cau/v1/idpw-authorize
Content-Type: application/json
```

### 3.2 Request Format

```json
{
  "common": {
    "companyCode": "VN",
    "clientId": "<your_client_id>",
    "clientSecret": "<your_client_secret>",
    "employeeNo": "10000001"
  },
  "data": {
    "loginPassword": "<sha256_hex_of_password>"
  }
}
```

| Field           | Location | Type   | Required | Description                                            |
| --------------- | -------- | ------ | -------- | ------------------------------------------------------ |
| `clientId`      | common   | String | Yes      | System authentication key                              |
| `clientSecret`  | common   | String | Yes      | System secret key                                      |
| `companyCode`   | common   | String | Yes      | Company code (e.g. `"VN"`)                             |
| `employeeNo`    | common   | String | Yes      | Employee staff ID (8 digits)                           |
| `loginPassword` | data     | String | Yes      | SHA-256 hex hash (lowercase) of the plaintext password |

### 3.3 Password Hashing

**CRITICAL:** Password MUST be hashed with SHA-256 before sending. Send the lowercase hex string.

```
plaintext: "password123"
sha256:    "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
```

### 3.4 Success Response

HTTP status is always `200`. Check `common.resultCode` and `data.authResult` in the body.

**Success criteria:** `common.resultCode == "200"` AND `data.authResult == "SUCCESS"`

```json
{
  "data": {
    "companyCode": "VN",
    "companyName": "ShinhanBank Vietnam",
    "companyId": "C300000001",
    "departmentId": "D500000001",
    "departmentNo": "SH001",
    "departmentName": "IT Development",
    "departmentLocation": "C300000001/D650000001/D500000001",
    "userId": "user001",
    "employeeId": "M400000001",
    "employeeNo": "10000001",
    "employeeName": "Nguyen Van A",
    "employeePositionName": "Senior Developer",
    "employeeClass": "Regular",
    "companyEmail": "user001@swork.shinhan.com",
    "email": "nguyenvana@example.com",
    "cellPhone": "0901-111-111",
    "authResult": "SUCCESS",
    "authResultMessage": "",
    "authEventId": "01GNBKQXXXX34C0E66STZH051X"
  },
  "common": {
    "resultCode": "200",
    "responseDatetime": "2026-04-02T14:37:03.535+09:00",
    "transactionId": "812ac0XXX493f464"
  }
}
```

### 3.5 Response Fields

| Field                       | Type   | Description                                                                   |
| --------------------------- | ------ | ----------------------------------------------------------------------------- |
| `data.authResult`           | String | `SUCCESS`, `LOGIN_FAILED`, `DENIED_PWD_CNT`, `PWD_EXPIRATION`, `DENIED_LOGIN` |
| `data.authResultMessage`    | String | Human-readable message (empty on success)                                     |
| `data.employeeNo`           | String | Staff ID                                                                      |
| `data.employeeName`         | String | Employee full name                                                            |
| `data.companyEmail`         | String | S-Work internal email                                                         |
| `data.departmentName`       | String | Department name                                                               |
| `data.employeePositionName` | String | Job title                                                                     |
| `data.employeeClass`        | String | Employee classification                                                       |
| `common.resultCode`         | String | HTTP-like result code                                                         |
| `common.responseDatetime`   | String | ISO-8601 timestamp                                                            |
| `common.transactionId`      | String | Transaction tracking ID                                                       |

### 3.6 Error Responses

HTTP status is still `200`. Error is indicated in the response body.

| `resultCode` | `authResult`     | Description                                |
| ------------ | ---------------- | ------------------------------------------ |
| `200`        | `LOGIN_FAILED`   | Wrong password                             |
| `200`        | `DENIED_PWD_CNT` | Too many wrong password attempts (locked)  |
| `200`        | `PWD_EXPIRATION` | Password expired, must change              |
| `200`        | `DENIED_LOGIN`   | Login denied (account disabled/restricted) |
| `ECCO007`    | —                | Unknown company code                       |
| `ECAU002`    | —                | Employee number not found                  |
| `401`        | —                | Invalid clientId/clientSecret              |

### 3.7 Implementation: Node.js

```javascript
const crypto = require("crypto");

/**
 * Authenticate user via Swing SSO (Password flow).
 * @param {string} employeeNo - 8-digit staff ID
 * @param {string} password - plaintext password
 * @returns {Promise<object>} - { success, data, error }
 */
async function authenticateSwingSSO(employeeNo, password) {
  const SWING_URL = process.env.SWING_SSO_URL; // e.g. https://apigw.shinhan.com:8443/cau/v1/idpw-authorize
  const CLIENT_ID = process.env.SWING_SSO_CLIENT_ID;
  const CLIENT_SECRET = process.env.SWING_SSO_CLIENT_SECRET;
  const COMPANY_CODE = process.env.SWING_SSO_COMPANY_CODE || "VN";

  // SHA-256 hash the password
  const passwordHash = crypto.createHash("sha256").update(password, "utf8").digest("hex");

  const requestBody = {
    common: {
      companyCode: COMPANY_CODE,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      employeeNo: employeeNo,
    },
    data: {
      loginPassword: passwordHash,
    },
  };

  try {
    const response = await fetch(SWING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const result = await response.json();

    const resultCode = result?.common?.resultCode;
    const authResult = result?.data?.authResult;

    if (resultCode === "200" && authResult === "SUCCESS") {
      return {
        success: true,
        data: result.data,
        error: null,
      };
    }

    return {
      success: false,
      data: null,
      error: {
        resultCode,
        authResult,
        message: result?.data?.authResultMessage || "Authentication failed",
      },
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: {
        resultCode: "CONNECTION_ERROR",
        authResult: null,
        message: err.message,
      },
    };
  }
}

// Usage example
// const result = await authenticateSwingSSO('10000001', 'password123');
// if (result.success) { /* create session, redirect */ }
```

### 3.8 Implementation: Java

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

public class SwingSSOClient {

    private final String swingUrl;
    private final String clientId;
    private final String clientSecret;
    private final String companyCode;
    private final HttpClient httpClient;
    private final Gson gson = new Gson();

    public SwingSSOClient(String swingUrl, String clientId, String clientSecret, String companyCode) {
        this.swingUrl = swingUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.companyCode = companyCode;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * SHA-256 hex hash (lowercase).
     */
    public static String sha256Hex(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) {
            sb.append(String.format("%02x", b & 0xff));
        }
        return sb.toString();
    }

    /**
     * Authenticate user via Swing SSO Password flow.
     *
     * @param employeeNo 8-digit staff ID
     * @param password   plaintext password
     * @return SwingAuthResult with success flag and response data
     */
    public SwingAuthResult authenticate(String employeeNo, String password) throws Exception {
        String passwordHash = sha256Hex(password);

        // Build request JSON
        JsonObject common = new JsonObject();
        common.addProperty("companyCode", companyCode);
        common.addProperty("clientId", clientId);
        common.addProperty("clientSecret", clientSecret);
        common.addProperty("employeeNo", employeeNo);

        JsonObject data = new JsonObject();
        data.addProperty("loginPassword", passwordHash);

        JsonObject requestBody = new JsonObject();
        requestBody.add("common", common);
        requestBody.add("data", data);

        // Send request
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(swingUrl))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        // Parse response
        JsonObject result = gson.fromJson(response.body(), JsonObject.class);
        String resultCode = result.getAsJsonObject("common").get("resultCode").getAsString();
        String authResult = result.getAsJsonObject("data").get("authResult").getAsString();

        boolean success = "200".equals(resultCode) && "SUCCESS".equals(authResult);
        return new SwingAuthResult(success, resultCode, authResult, result);
    }

    /**
     * Result wrapper.
     */
    public static class SwingAuthResult {
        public final boolean success;
        public final String resultCode;
        public final String authResult;
        public final JsonObject rawResponse;

        public SwingAuthResult(boolean success, String resultCode, String authResult, JsonObject rawResponse) {
            this.success = success;
            this.resultCode = resultCode;
            this.authResult = authResult;
            this.rawResponse = rawResponse;
        }
    }
}

// Usage:
// SwingSSOClient client = new SwingSSOClient(url, clientId, clientSecret, "VN");
// SwingAuthResult result = client.authenticate("10000001", "password123");
// if (result.success) { /* create session */ }
```

---

## 4. Flow 2: Token-Based SSO (XML)

This flow is for **portal redirect**: user is already authenticated in Swing portal, clicks a link to your app, and is auto-logged in via a one-time token.

### 4.1 Flow Diagram

```
Swing Portal                  Your Backend                    Your Frontend
    |                              |                              |
    | User clicks "Open App"       |                              |
    |----------------------------->|                              |
    | GET /your-callback           |                              |
    | ?token=xxx&employee_no=yyy   |                              |
    |                              |                              |
    |                              |-- POST validate token ------>| Swing Auth API
    |                              |   (XML request)              |
    |                              |<-- XML response (userId) ----|
    |                              |                              |
    |                              |-- Lookup user locally        |
    |                              |-- Create session             |
    |                              |-- Redirect ----------------->|
    |                              |   to dashboard               |
```

### 4.2 Token Validation API

```
POST https://{swing_auth_url}
Content-Type: text/xml
Accept-Charset: UTF-8
```

### 4.3 Request (XML)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<DATA>
  <USERTOKEN>{token_from_swing_portal}</USERTOKEN>
  <SERVICENAME>{your_service_name}</SERVICENAME>
</DATA>
```

| Field         | Description                                  |
| ------------- | -------------------------------------------- |
| `USERTOKEN`   | Token received from Swing portal redirect    |
| `SERVICENAME` | Your registered service name in Swing system |

### 4.4 Response (XML)

**Success:** The `RETURNVALUE` element contains the userId.

```xml
<DATA>
  <RETURNVALUE>user001</RETURNVALUE>
</DATA>
```

**Error:** The `RETURNVALUE` contains an error code string.

| Error Code                        | Description                  |
| --------------------------------- | ---------------------------- |
| `ACCOUNT_IS_NULL`                 | Account not found            |
| `USERTOKEN_IS_NULL`               | Token was empty              |
| `USER_TOKEN_NO_MATCH`             | Token invalid or expired     |
| `CONNECT_SERVER_IS_ACCESS_DENIED` | Server access denied         |
| `AUTHENTICATE_EXCEPTION`          | General authentication error |

### 4.5 Implementation: Node.js

```javascript
const { XMLParser, XMLBuilder } = require("fast-xml-parser");

/**
 * Validate Swing SSO token (portal redirect flow).
 * @param {string} userToken - Token from Swing portal redirect
 * @param {string} serviceName - Your registered service name
 * @returns {Promise<object>} - { success, userId, error }
 */
async function validateSwingToken(userToken, serviceName) {
  const SWING_TOKEN_URL = process.env.SWING_SSO_TOKEN_URL; // Token validation endpoint

  const ERROR_CODES = [
    "ACCOUNT_IS_NULL",
    "USERTOKEN_IS_NULL",
    "USER_TOKEN_NO_MATCH",
    "CONNECT_SERVER_IS_ACCESS_DENIED",
    "AUTHENTICATE_EXCEPTION",
  ];

  // Build XML request
  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>\n<DATA><USERTOKEN>${userToken}</USERTOKEN><SERVICENAME>${serviceName}</SERVICENAME></DATA>`;

  try {
    const response = await fetch(SWING_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "Accept-Charset": "UTF-8",
      },
      body: xmlBody,
      signal: AbortSignal.timeout(10000),
    });

    const responseText = await response.text();

    // Parse XML response
    const parser = new XMLParser();
    const parsed = parser.parse(responseText);
    const returnValue = parsed?.DATA?.RETURNVALUE;

    if (!returnValue) {
      return { success: false, userId: null, error: "Empty response from Swing" };
    }

    // Check if returnValue is an error code
    if (ERROR_CODES.includes(returnValue)) {
      return { success: false, userId: null, error: returnValue };
    }

    // returnValue is the userId
    return { success: true, userId: returnValue, error: null };
  } catch (err) {
    return { success: false, userId: null, error: err.message };
  }
}

// Usage:
// const result = await validateSwingToken(tokenFromQuery, 'MY_SERVICE');
// if (result.success) { /* lookup user by result.userId, create session */ }
```

### 4.6 Implementation: Java

```java
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class SwingSSOTokenValidator {

    private static final List<String> ERROR_CODES = List.of(
        "ACCOUNT_IS_NULL",
        "USERTOKEN_IS_NULL",
        "USER_TOKEN_NO_MATCH",
        "CONNECT_SERVER_IS_ACCESS_DENIED",
        "AUTHENTICATE_EXCEPTION"
    );

    private final String tokenValidationUrl;
    private final String serviceName;
    private final HttpClient httpClient;

    public SwingSSOTokenValidator(String tokenValidationUrl, String serviceName) {
        this.tokenValidationUrl = tokenValidationUrl;
        this.serviceName = serviceName;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Validate a Swing SSO token from portal redirect.
     *
     * @param userToken Token from the redirect query parameter
     * @return TokenValidationResult with userId on success
     */
    public TokenValidationResult validateToken(String userToken) throws Exception {
        // Build XML request
        String xmlBody = String.format(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><DATA><USERTOKEN>%s</USERTOKEN><SERVICENAME>%s</SERVICENAME></DATA>",
            userToken, serviceName
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(tokenValidationUrl))
                .header("Content-Type", "text/xml")
                .header("Accept-Charset", "UTF-8")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(xmlBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        // Parse XML response
        String returnValue = parseReturnValue(response.body());

        if (returnValue == null || returnValue.isEmpty()) {
            return new TokenValidationResult(false, null, "Empty RETURNVALUE");
        }

        if (ERROR_CODES.contains(returnValue)) {
            return new TokenValidationResult(false, null, returnValue);
        }

        // returnValue = userId
        return new TokenValidationResult(true, returnValue, null);
    }

    private String parseReturnValue(String xmlString) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(xmlString.getBytes(StandardCharsets.UTF_8)));

        NodeList nodes = doc.getElementsByTagName("RETURNVALUE");
        if (nodes.getLength() > 0) {
            Node node = nodes.item(0);
            return node.getTextContent();
        }
        return null;
    }

    public static class TokenValidationResult {
        public final boolean success;
        public final String userId;
        public final String error;

        public TokenValidationResult(boolean success, String userId, String error) {
            this.success = success;
            this.userId = userId;
            this.error = error;
        }
    }
}

// Usage:
// SwingSSOTokenValidator validator = new SwingSSOTokenValidator(tokenUrl, "MY_SERVICE");
// TokenValidationResult result = validator.validateToken(tokenFromQuery);
// if (result.success) { /* lookup user by result.userId, create session */ }
```

---

## 5. Security Requirements

| Requirement               | Details                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| **HTTPS only**            | All API calls must use HTTPS. Never send credentials over HTTP.                        |
| **SHA-256 password**      | Always hash password before sending. Never send plaintext.                             |
| **Never log secrets**     | Do not log `clientSecret`, `password`, or `loginPassword` in production.               |
| **Timeout**               | Set HTTP timeout to 10 seconds max.                                                    |
| **Rate limiting**         | Implement rate limiting on your login endpoint (recommended: 5 attempts / 5 min / IP). |
| **Token one-time use**    | Token-based flow: tokens should be treated as one-time use. Do not cache or reuse.     |
| **User pre-provisioning** | Swing SSO only verifies credentials. Users must exist in your system before login.     |

---

## 6. User Mapping Convention

After successful Swing SSO authentication, map the `employeeNo` to your local user using a **company-specific prefix**:

```
Email pattern: {prefix}{employeeNo}@swing.shinhan.com
```

### 6.1 Company Prefix Table

| Company                    | Prefix | Company Code | Email Example                  |
| -------------------------- | ------ | ------------ | ------------------------------ |
| Shinhan Bank Vietnam       | `sh`   | `VN`         | `sh10000001@swing.shinhan.com` |
| Shinhan Securities Vietnam | `gs`   | _(TBD)_      | `gs10000001@swing.shinhan.com` |
| Shinhan Life Vietnam       | `nl`   | _(TBD)_      | `nl10000001@swing.shinhan.com` |

> **Note:** The prefix list may expand as more subsidiaries onboard. Store the mapping in a configurable table/dictionary, not hardcoded if-else.

### 6.2 UX Requirement: Company Selector

On the login form, when a user enters a Staff ID (8 digits), the system should let the user **select which subsidiary they belong to**. This is needed because the same `employeeNo` can exist across different subsidiaries.

**Recommended UI approach:**

```
┌─────────────────────────────────────┐
│  Staff ID:  [10000001        ]      │
│  Company:   [▼ Shinhan Bank VN    ] │
│             ┌───────────────────┐   │
│             │ Shinhan Bank VN   │   │
│             │ Shinhan Securities│   │
│             │ Shinhan Life VN   │   │
│             └───────────────────┘   │
│  Password:  [••••••••         👁]   │
│                                     │
│           [ Login ]                 │
└─────────────────────────────────────┘
```

**Implementation considerations:**

1. **Fetch company list from config** — Do not hardcode. Retrieve from backend config or environment so new subsidiaries can be added without code changes.
2. **Default company** — Pre-select the most common subsidiary (e.g. Shinhan Bank VN) or remember the user's last selection via localStorage.
3. **Company → prefix mapping** — After user selects a company and authenticates successfully, use the corresponding prefix to build the local email for user lookup:
   ```
   localEmail = `${companyPrefix}${employeeNo}@swing.shinhan.com`
   ```
4. **Company → companyCode mapping** — Each subsidiary may use a different `companyCode` in the Swing API request. Map the selected company to its `companyCode` value.

### 6.3 Data Model Suggestion

```typescript
// Node.js / TypeScript
interface SubsidiaryConfig {
  name: string; // Display name: "Shinhan Bank Vietnam"
  prefix: string; // Email prefix: "sh"
  companyCode: string; // Swing API companyCode: "VN"
}

const SUBSIDIARIES: SubsidiaryConfig[] = [
  { name: "Shinhan Bank Vietnam", prefix: "sh", companyCode: "VN" },
  { name: "Shinhan Securities Vietnam", prefix: "gs", companyCode: "GS" },
  { name: "Shinhan Life Vietnam", prefix: "nl", companyCode: "NL" },
];
```

```java
// Java
public record SubsidiaryConfig(String name, String prefix, String companyCode) {}

List<SubsidiaryConfig> subsidiaries = List.of(
    new SubsidiaryConfig("Shinhan Bank Vietnam",       "sh", "VN"),
    new SubsidiaryConfig("Shinhan Securities Vietnam", "gs", "GS"),
    new SubsidiaryConfig("Shinhan Life Vietnam",       "nl", "NL")
);
```

### 6.4 Impact on Authentication Flow

The selected company affects **two things** in the password-based flow:

1. **Request** — `common.companyCode` must match the selected subsidiary
2. **User lookup** — After Swing returns `SUCCESS`, build local email with the correct prefix

```
User selects "Shinhan Securities Vietnam" + enters employeeNo "10000001"
  → API request: common.companyCode = "GS"
  → User lookup: gs10000001@swing.shinhan.com
```

Users MUST be pre-created in your system with the correct prefixed email format.

---

## 7. Environment Variables

```env
# Password-based flow
SWING_SSO_URL=https://apigw.shinhan.com:8443/cau/v1/idpw-authorize
SWING_SSO_CLIENT_ID=<your_client_id>
SWING_SSO_CLIENT_SECRET=<your_client_secret>
SWING_SSO_COMPANY_CODE=VN

# Token-based flow (separate endpoint)
SWING_SSO_TOKEN_URL=<token_validation_endpoint>
SWING_SSO_SERVICE_NAME=<your_registered_service_name>
```

---

## 8. Testing

### Mock Server

A mock Swing SSO server is available for local development at:
`scripts/mock_swing_sso_api/mock_swing_sso_server.py`

```bash
pip install flask
python mock_swing_sso_server.py
# Runs on http://localhost:9001
```

**Mock credentials:**

| Parameter      | Value             |
| -------------- | ----------------- |
| `clientId`     | `TEST_CLIENT_ID`  |
| `clientSecret` | `test-secret-123` |
| `companyCode`  | `sh`              |

**Test users:**

| Employee No | Password      | Name           | Department         |
| ----------- | ------------- | -------------- | ------------------ |
| `10000001`  | `password123` | Nguyen Van A   | IT Development     |
| `10000002`  | `password123` | Tran Thi B     | QA Team            |
| `10000003`  | `password123` | Le Van C       | Project Management |
| `10000004`  | `admin@2024`  | Pham Admin     | IT Development     |
| `10000005`  | `admin@2024`  | Hoang Security | Security Team      |

### cURL Test

```bash
# Password-based flow
curl -X POST http://localhost:9001/cau/v1/idpw-authorize \
  -H "Content-Type: application/json" \
  -d '{
    "common": {
      "companyCode": "sh",
      "clientId": "TEST_CLIENT_ID",
      "clientSecret": "test-secret-123",
      "employeeNo": "10000001"
    },
    "data": {
      "loginPassword": "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
    }
  }'
```

> Note: `ef92b778...` is `sha256("password123")`

---

## 9. Quick Reference: authResult Values

| Value            | Action                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| `SUCCESS`        | Authentication passed. Create session.                                         |
| `LOGIN_FAILED`   | Wrong password. Show error, increment attempt counter.                         |
| `DENIED_PWD_CNT` | Account locked due to too many failed attempts. Show "account locked" message. |
| `PWD_EXPIRATION` | Password expired. Prompt user to change password on Swing portal.              |
| `DENIED_LOGIN`   | Login denied/disabled. Show "account restricted" message.                      |
