# Accessibility

The theme aims for WCAG 2.2 AA fundamentals.

## Implemented

- Skip link to main content
- Landmark regions on templates (`header`, `main`, `footer`, `nav`)
- Visible focus rings on links, buttons, and form controls
- Color pairs checked for contrast on navy, charcoal, ivory, and ink
- Form fields with labels, required state, and error text tied by `aria-describedby`
- `prefers-reduced-motion` disables decorative transitions
- Responsive type and spacing from `theme.json` fluid sizes
- Buttons and nav targets that meet a 24px minimum
- Language attribute on the HTML document (WordPress)
- Alt text required in editorial guidance; sample SVGs include titles

## Color notes

Antique gold is an accent for borders and large labels. It is not used as small body text on navy. Body text on ivory is ink. Body text on navy is ivory.

## Keyboard

Header navigation, catalog filters, forms, cart, and checkout must be usable without a pointer. WooCommerce Blocks handle most commerce interactions; theme CSS must not `outline: none` without a replacement.

## Testing

After deploy, check:

1. Keyboard-only pass on Home, Shop, Product, Cart, Checkout, Readings form
2. Screen reader pass on a product and the reading request form
3. 320px and 1280px layouts
4. Contrast with a checker on hero, cards, and footer
5. Reduced-motion setting
