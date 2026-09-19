# Install

## Production or staging

1. Provision WordPress 6.6+ with PHP 8.1+ and HTTPS.
2. Install and activate WooCommerce from wordpress.org.
3. Upload `atlas-relics` to `wp-content/themes`.
4. Upload `atlas-relics-core` to `wp-content/plugins`.
5. Activate Atlas Relics Core, then activate the Atlas Relics theme.
6. WooCommerce → Settings: currency, payments, shipping, emails, tax.
7. WooCommerce → Status → Tools: create default WooCommerce pages if they are missing.
8. Settings → Permalinks: Post name.
9. Appearance → Editor: confirm header navigation and front page.
10. Atlas Relics → Settings: set the inquiry inbox. Do not put SMTP passwords in the plugin settings. Use an SMTP plugin or host mail with credentials stored outside git.

## Sample catalog

On staging only, open **Atlas Relics → Setup** and run the sample catalog installer. It creates:

- Product line terms
- WooCommerce product categories
- Starter products
- Pages (Home, About, Conscious Mirror, The Caves, Pattern Map, Courses, Readings, Books, Journal, Contact, Privacy, Terms, Refunds)
- Primary navigation

Do not run the installer against a catalog you already sell. It is idempotent by slug, but it will refresh demo product copy.

## Payments

Connect Stripe, PayPal, or another WooCommerce gateway in the WordPress admin. Keys belong in environment configuration or the gateway settings UI, never in theme or plugin files.

## After launch

- Keep WordPress, WooCommerce, the theme, and the plugin updated on staging first.
- Restrict `wp-admin` with strong passwords and 2FA.
- Turn `WP_DEBUG` off in production.
- Set `DISALLOW_FILE_EDIT` to true.
