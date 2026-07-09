# Email Workers API Reference

Complete API reference for Cloudflare Email Workers runtime.

## ForwardableEmailMessage Interface

The main interface passed to email handlers.

```typescript
interface ForwardableEmailMessage {
  readonly from: string;        // Envelope MAIL FROM (SMTP sender)
  readonly to: string;          // Envelope RCPT TO (SMTP recipient)
  readonly headers: Headers;    // Web-standard Headers object
  readonly raw: ReadableStream; // Raw MIME message (single-use stream)
  readonly rawSize: number;     // Total message size in bytes
  
  setReject(reason: string): void;
  forward(rcptTo: string, headers?: Headers): Promise<void>;
  reply(message: EmailMessage): Promise<void>;
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `from` | string | Envelope sender (SMTP MAIL FROM) - use for security |
| `to` | string | Envelope recipient (SMTP RCPT TO) |
| `headers` | Headers | Message headers (Subject, Message-ID, etc.) |
| `raw` | ReadableStream | Raw MIME message (**single-use**, buffer first) |
| `rawSize` | number | Message size in bytes |

### Methods

#### setReject(reason: string): void

Reject with permanent SMTP 5xx error. Email not delivered, sender may receive bounce.

```typescript
if (blockList.includes(message.from)) {
  message.setReject('Sender blocked');
}
```

#### forward(rcptTo: string, headers?: Headers): Promise<void>

Forward to verified destination. Only `X-*` custom headers allowed.

```typescript
await message.forward('inbox@example.com');

// With custom headers
const h = new Headers();
h.set('X-Processed-By', 'worker');
await message.forward('inbox@example.com', h);
```

#### reply(message: EmailMessage): Promise<void>

Send a reply to the original sender (March 2025 feature).

```typescript
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

const msg = createMimeMessage();
msg.setSender({ name: 'Support', addr: 'support@example.com' });
msg.setRecipient(message.from);
msg.setSubject(`Re: ${message.headers.get('Subject')}`);
msg.setHeader('In-Reply-To', message.headers.get('Message-ID'));
msg.setHeader('References', message.headers.get('References') || '');
msg.addMessage({
  contentType: 'text/plain',
  data: 'Thank you for your message.'
});

await message.reply(new EmailMessage(
  'support@example.com',
  message.from,
  msg.asRaw()
));
```

**Requirements**:
- Incoming email needs valid DMARC
- Reply once per event, recipient = `message.from`
- Sender domain = receiving domain, with DMARC/SPF/DKIM
- Max 100 `References` entries
- Threading: `In-Reply-To` (original Message-ID), `References`, new `Message-ID`

## EmailMessage Constructor

```typescript
import { EmailMessage } from 'cloudflare:email';

new EmailMessage(from: string, to: string, raw: ReadableStream | string)
```

Used for sending emails (replies or via SendEmail binding). Domain must be verified.

## SendEmail Interface

```typescript
interface SendEmail {
  send(message: EmailMessage): Promise<void>;
}

// Usage
await env.EMAIL.send(new EmailMessage(from, to, mimeContent));
```

## SendEmail Binding Types

```jsonc
{
  "send_email": [
    { "name": "EMAIL" },  // Type 1: Any verified address
    { "name": "LOGS", "destination_address": "logs@example.com" },  // Type 2: Single dest
    { "name": "TEAM", "allowed_destination_addresses": ["a@ex.com", "b@ex.com"] },  // Type 3: Dest allowlist
    { "name": "NOREPLY", "allowed_sender_addresses": ["noreply@ex.com"] }  // Type 4: Sender allowlist
  ]
}
```

## postal-mime Parsed Output

postal-mime v2.7.3 parses incoming emails into structured data.

```typescript
interface ParsedEmail {
  headers: Array<{ key: string; value: string }>;
  from: { name: string; address: string } | null;
  to: Array<{ name: string; address: string }> | { name: string; address: string } | null;
  cc: Array<{ name: string; address: string }> | null;
  bcc: Array<{ name: string; address: string }> | null;
  subject: string;
  messageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  date: string | null;
  html: string | null;
  text: string | null;
  attachments: Array<{
    filename: string;
    mimeType: string;
    disposition: string | null;
    related: boolean;
    contentId: string | null;
    content: Uint8Array;
  }>;
}
```

### Usage

```typescript
import PostalMime from 'postal-mime';

const buffer = await new Response(message.raw).arrayBuffer();
const email = await PostalMime.parse(buffer);

console.log(email.subject);
console.log(email.from?.address);
console.log(email.text);
console.log(email.attachments.length);
```

## mimetext API Quick Reference

mimetext v3.0.27 composes outgoing emails.

```typescript
import { createMimeMessage } from 'mimetext';

const msg = createMimeMessage();

// Sender
msg.setSender({ name: 'John Doe', addr: 'john@example.com' });

// Recipients
msg.setRecipient('alice@example.com');
msg.setRecipients(['bob@example.com', 'carol@example.com']);
msg.setCc('manager@example.com');
msg.setBcc(['audit@example.com']);

// Headers
msg.setSubject('Meeting Notes');
msg.setHeader('In-Reply-To', '<previous-message-id>');
msg.setHeader('References', '<msg1> <msg2>');
msg.setHeader('Message-ID', `<${crypto.randomUUID()}@example.com>`);

// Content
msg.addMessage({
  contentType: 'text/plain',
  data: 'Plain text content'
});

msg.addMessage({
  contentType: 'text/html',
  data: '<p>HTML content</p>'
});

// Attachments
msg.addAttachment({
  filename: 'report.pdf',
  contentType: 'application/pdf',
  data: pdfBuffer // Uint8Array or base64 string
});

// Generate raw MIME
const raw = msg.asRaw(); // Returns string
```

## TypeScript Types

```typescript
import { 
  ForwardableEmailMessage,
  EmailMessage 
} from 'cloudflare:email';

interface Env {
  EMAIL: SendEmail;
  EMAIL_ARCHIVE: KVNamespace;
  ALLOWED_SENDERS: KVNamespace;
}

export default {
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Fully typed
  }
};
```
