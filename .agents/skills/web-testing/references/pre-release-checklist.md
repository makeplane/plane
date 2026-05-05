# Pre-Release Testing Checklist

## Cross-Browser & Responsive

- [ ] Chrome, Firefox, Safari, Edge latest
- [ ] Mobile: iPhone real device (Safari iOS)
- [ ] Mobile: Android real device (Chrome)
- [ ] Breakpoints: 375px, 768px, 1024px, 1920px
- [ ] Portrait & landscape orientations

## Functional Testing

- [ ] Primary user journeys complete
- [ ] CRUD operations work
- [ ] Login/logout/password reset
- [ ] Form validation enforced
- [ ] Search/filter/sort/pagination

## Interactive Elements

- [ ] Buttons, links respond correctly
- [ ] Modals open/close properly
- [ ] Dropdowns, tooltips work
- [ ] Touch gestures work on mobile
- [ ] Drag & drop (if applicable)

## Keyboard & Accessibility

- [ ] Tab navigation through all elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Visible focus indicators
- [ ] Screen reader announces content

## Performance (Core Web Vitals)

- [ ] LCP < 2.5 seconds
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] Images optimized & lazy loaded

## Visual & Layout

- [ ] No horizontal scroll on mobile
- [ ] Content reflows at breakpoints
- [ ] Sufficient color contrast
- [ ] Animations smooth

## Error Handling

- [ ] Network errors show retry option
- [ ] 401/403/404/500 handled properly
- [ ] Form errors highlight fields

## Security

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CSRF tokens in forms

## Test Quality

- [ ] All tests pass (no flaky tests)
- [ ] Coverage: Unit 70%, Integration 20%, E2E 10%
- [ ] Accessibility audit passed

## Quick Commands

```bash
npm run test                                    # All tests
npx playwright test --project=chromium,firefox  # Cross-browser
npx @axe-core/cli https://staging.example.com   # Accessibility
npx lighthouse https://staging.example.com       # Performance
curl -I https://staging.example.com | grep -i security  # Headers
```
