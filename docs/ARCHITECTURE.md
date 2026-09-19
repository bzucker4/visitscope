# Architecture

Atlas Relics is a WordPress site with WooCommerce, a native block theme, and one custom plugin.

```
Browser
  → WordPress (block templates + WooCommerce blocks)
      → Theme: atlas-relics (presentation)
      → Plugin: atlas-relics-core (store logic)
      → WooCommerce (catalog, cart, checkout, accounts)
```

## Theme responsibilities

- `theme.json` color, type, spacing, and layout tokens
- HTML block templates and template parts
- Block patterns for pages
- Presentation CSS and small editor styles
- Registering pattern categories and WooCommerce theme support

The theme does not create products, send mail, process forms, or store customer data.

## Plugin responsibilities

- Product line taxonomy on WooCommerce products
- Reading request custom post type and admin workflow
- Public forms (reading request, inquiry) with nonces and rate limits
- WooCommerce product meta (subtitle, format, duration, intended use)
- Block registration for catalog and form blocks
- Optional sample catalog installer for staging
- Settings for inquiry email and reading copy

## WooCommerce

Physical books can ship. Courses, digital tools, and downloadable workbooks are virtual and/or downloadable products. Readings are virtual products that represent a scheduled conversation, not an automated file.

Checkout, taxes, shipping, refunds, and payment gateways stay in WooCommerce. Atlas Relics Core only adds the catalog language and request workflow around those APIs.

## Data created by the plugin

| Object | Type | Notes |
| --- | --- | --- |
| `ar_product_line` | Taxonomy | Conscious Mirror, The Caves, Pattern Map, Courses, Readings, Books, Digital Tools |
| `ar_reading_request` | CPT | Private requests submitted from the Readings page |
| Product meta | `_ar_*` keys | Subtitle, format, duration, intended-use note |
| Options | `atlas_relics_core_settings` | Inquiry email, from-name, reading notice |

Uninstall removes plugin options and the reading-request post type data only when the site administrator has chosen to delete plugin data. Products created in WooCommerce remain unless they are deleted in WooCommerce.

## Environments

Never edit production from this repository. Develop on a local or staging WordPress install, review, then deploy theme and plugin files through the host’s normal release process.
