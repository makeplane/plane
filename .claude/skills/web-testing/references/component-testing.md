# Component Testing

## Philosophy: Test Behavior, Not Implementation

```javascript
// BAD: Tests internals
expect(component.state.isOpen).toBe(true);

// GOOD: Tests user-visible behavior
await userEvent.click(getByRole('button', { name: 'Open' }));
expect(getByRole('dialog')).toBeVisible();
```

## React Testing Library

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('form submission', async () => {
  render(<LoginForm />);
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: /login/i }));
  expect(screen.getByText('Login successful')).toBeInTheDocument();
});
```

## Vue Test Utils

```javascript
import { mount } from '@vue/test-utils';

test('form submission', async () => {
  const wrapper = mount(LoginForm);
  await wrapper.find('input[type="email"]').setValue('test@example.com');
  await wrapper.find('button').trigger('click');
  expect(wrapper.text()).toContain('Login successful');
});
```

## Angular Testing Library

```typescript
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

test('form submission', async () => {
  await render(LoginFormComponent);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /login/i }));
  expect(screen.getByText('Login successful')).toBeInTheDocument();
});
```

## Query Priority (Accessibility-First)

1. `getByRole` - buttons, links, headings
2. `getByLabelText` - form fields
3. `getByPlaceholderText` - inputs
4. `getByText` - non-interactive elements
5. `getByTestId` - last resort

## Async Patterns

```javascript
await screen.findByText('Loaded');
await waitForElementToBeRemoved(() => screen.queryByText('Loading'));
await waitFor(() => expect(screen.getByText('Done')).toBeInTheDocument());
```

## Mocking

```javascript
vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ name: 'John' })
}));

render(
  <UserContext.Provider value={{ user: mockUser }}>
    <Profile />
  </UserContext.Provider>
);
```

## Vitest Browser Mode

```typescript
// vitest.config.ts - more accurate than jsdom
export default defineConfig({
  test: { browser: { enabled: true, name: 'chromium', provider: 'playwright' } },
});
```
