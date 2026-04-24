# Functional Testing Checklist

## Core Features

- [ ] Primary user workflows execute end-to-end
- [ ] CRUD operations work (create, read, update, delete)
- [ ] Error states handled gracefully
- [ ] Validation rules enforced (email, phone, dates)
- [ ] Search/filter functions correctly
- [ ] Sorting works in both directions
- [ ] Pagination displays correct data

## User Workflows

- [ ] Signup flow completes successfully
- [ ] Login flow works with valid credentials
- [ ] Password reset flow sends email and resets
- [ ] Multi-step forms retain data between steps
- [ ] Data persists after page refresh/navigation
- [ ] Logout clears session completely
- [ ] Deep links work correctly

## Business Logic

- [ ] Calculations correct (totals, discounts, taxes)
- [ ] Rules enforced (age verification, region restrictions)
- [ ] Edge cases handled (zero, negative, max values)
- [ ] Date/time operations account for timezones
- [ ] Currency formatting correct
- [ ] Quantity limits enforced

## Form Validation

- [ ] Required fields show error when empty
- [ ] Email format validation works
- [ ] Password strength requirements shown
- [ ] Phone number format accepted
- [ ] Date picker prevents invalid dates
- [ ] File upload validates type/size
- [ ] Form submits only when valid

## Integration Points

- [ ] API calls succeed with correct parameters
- [ ] Database operations persist
- [ ] Third-party integrations work (payment, auth)
- [ ] Error responses handled gracefully
- [ ] Loading states displayed during async ops
- [ ] Timeout handling for slow responses
- [ ] Retry logic works on failures

## Error Handling

- [ ] Network errors show retry option
- [ ] Invalid input shows helpful message
- [ ] 401 errors trigger re-authentication
- [ ] 403 errors show access denied
- [ ] 404 errors show not found page
- [ ] 500 errors logged, user sees friendly message
- [ ] Validation errors highlight specific fields

## State Management

- [ ] URL reflects application state
- [ ] Browser back/forward works correctly
- [ ] Bookmarking preserves state
- [ ] Shared links open correct view
- [ ] State persists through refresh (when appropriate)

## Test Priority Matrix

| Priority | Category | Examples |
|----------|----------|----------|
| P0 (Critical) | Core flows | Signup, login, checkout, payment |
| P1 (High) | Major features | Search, CRUD, navigation |
| P2 (Medium) | Secondary features | Filters, sorting, pagination |
| P3 (Low) | Edge cases | Empty states, max limits |

## Test Data Checklist

- [ ] Happy path data
- [ ] Empty/null values
- [ ] Boundary values (min, max)
- [ ] Invalid data types
- [ ] Unicode/special characters
- [ ] Long strings
- [ ] Whitespace (leading, trailing)
- [ ] Duplicate data scenarios
