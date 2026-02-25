# SePay VietQR Generation

Dynamic QR code generation service compatible with VietQR standard (NAPAS).

## API Endpoint

```
https://qr.sepay.vn/img?acc={ACCOUNT}&bank={BANK}&amount={AMOUNT}&des={DESCRIPTION}
```

## Parameters

**Required:**
- `acc` - Bank account number
- `bank` - Bank code or short name

**Optional:**
- `amount` - Transfer amount (omit for flexible amount)
- `des` - Transfer description/content (URL encoded)
- `template` - QR image template (empty/compact/qronly)
- `download` - Set to "true" to download image

## Examples

### Complete QR (Fixed Amount)
```
https://qr.sepay.vn/img?
  acc=0010000000355&
  bank=Vietcombank&
  amount=100000&
  des=ung%20ho%20quy%20bao%20tro%20tre%20em
```

### Flexible QR (Customer Enters Amount)
```
https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank
```

### QR Only Template
```
https://qr.sepay.vn/img?
  acc=0010000000355&
  bank=Vietcombank&
  amount=100000&
  template=qronly
```

## Integration

### HTML
```html
<img src="https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank&amount=100000"
     alt="Payment QR Code" />
```

### JavaScript (Dynamic)
```javascript
function generatePaymentQR(account, bank, amount, description) {
  const params = new URLSearchParams({
    acc: account,
    bank: bank,
    amount: amount,
    des: description
  });
  return `https://qr.sepay.vn/img?${params}`;
}

// Usage
const qrUrl = generatePaymentQR(
  '0010000000355',
  'Vietcombank',
  100000,
  'Order #12345'
);

document.getElementById('qr-code').src = qrUrl;
```

### PHP (Dynamic)
```php
<?php
function generatePaymentQR($account, $bank, $amount, $description) {
    return 'https://qr.sepay.vn/img?' . http_build_query([
        'acc' => $account,
        'bank' => $bank,
        'amount' => $amount,
        'des' => $description
    ]);
}

// Usage
$qrUrl = generatePaymentQR(
    '0010000000355',
    'Vietcombank',
    100000,
    'Order #' . $orderId
);

echo "<img src='{$qrUrl}' alt='Payment QR' />";
?>
```

### Node.js (Express)
```javascript
app.get('/payment/:orderId/qr', async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  const qrUrl = new URL('https://qr.sepay.vn/img');
  qrUrl.searchParams.set('acc', process.env.SEPAY_ACCOUNT);
  qrUrl.searchParams.set('bank', process.env.SEPAY_BANK);
  qrUrl.searchParams.set('amount', order.total);
  qrUrl.searchParams.set('des', `Order ${order.id}`);

  res.render('payment', { qrUrl: qrUrl.toString() });
});
```

### React Component
```jsx
function PaymentQR({ account, bank, amount, description }) {
  const qrUrl = useMemo(() => {
    const params = new URLSearchParams({
      acc: account,
      bank: bank,
      amount: amount,
      des: description
    });
    return `https://qr.sepay.vn/img?${params}`;
  }, [account, bank, amount, description]);

  return (
    <div className="payment-qr">
      <img src={qrUrl} alt="Payment QR Code" />
      <p>Scan to pay {amount.toLocaleString('vi-VN')} VND</p>
    </div>
  );
}
```

## Templates

**Default:**
- Full QR with bank logo
- Account information displayed
- Branded with bank colors

**Compact:**
- Smaller version
- Minimal branding
- More space-efficient

**QR Only:**
- Pure QR code
- No decorations
- For custom layouts

## Bank Codes

**Get Bank List:**
```
GET https://qr.sepay.vn/banks.json
```

**Common Banks:**
- Vietcombank (VCB)
- VPBank
- BIDV
- Techcombank (TCB)
- ACB
- MB Bank
- Sacombank
- VietinBank
- And 40+ others

**Cache Bank List:**
```javascript
// Fetch once and cache
const banks = await fetch('https://qr.sepay.vn/banks.json')
  .then(res => res.json());

// Store in memory or Redis
cache.set('sepay_banks', banks, 86400); // 24 hours
```

## Best Practices

1. **Cache Bank List:** Avoid repeated API calls
2. **URL Encode Descriptions:** Use `encodeURIComponent()` or `http_build_query()`
3. **Error Handling:** Provide fallback for QR generation failures
4. **Amount Validation:** Ensure amount is positive integer
5. **Flexible vs Fixed:** Use flexible QR for varying amounts
6. **Template Selection:** Choose based on UI design
7. **Responsive Design:** Scale QR code for mobile devices
8. **Alt Text:** Always provide descriptive alt text
9. **Loading State:** Show placeholder while QR loads
10. **Print Support:** Ensure QR codes are print-friendly

## Integration Patterns

### Checkout Page
```html
<div class="payment-methods">
  <h3>Pay via Bank Transfer</h3>
  <img src="[QR_URL]" alt="Payment QR Code" class="qr-code" />
  <p>Scan this QR code with your banking app</p>
  <div class="payment-details">
    <p><strong>Account:</strong> 0010000000355</p>
    <p><strong>Bank:</strong> Vietcombank</p>
    <p><strong>Amount:</strong> 100,000 VND</p>
    <p><strong>Content:</strong> Order #12345</p>
  </div>
</div>
```

### Email Receipt
```html
<table>
  <tr>
    <td align="center">
      <img src="[QR_URL]" alt="Payment QR Code" width="200" />
      <p>Scan to pay for your order</p>
    </td>
  </tr>
</table>
```

### PDF Invoice
Use QR URL in PDF generation libraries (wkhtmltopdf, Puppeteer, etc.)
