# Atlas Relics

WordPress block theme and WooCommerce plugin for Atlas Relics, a house of tools, reflections, and artifacts for exploring the inner life.

Conscious Mirror, The Caves, Pattern Map, courses, readings, books, and digital tools are product lines under this umbrella. They are not separate brands.

This repository is source for a self-hosted WordPress site. It does not contain a live WordPress install, production credentials, or payment keys.

## Requirements

- WordPress 6.6 or later
- PHP 8.1 or later
- WooCommerce 9.0 or later
- HTTPS in production
- A mail transport configured in WordPress for reading requests and order email

## What lives where

| Path | Role |
| --- | --- |
| `themes/atlas-relics` | Native block theme. Design tokens, templates, patterns, and presentation CSS. |
| `plugins/atlas-relics-core` | Business functionality. Product lines, WooCommerce catalog helpers, reading requests, forms, settings, and sample content. |

Do not put checkout logic, product data, forms, or store settings in the theme. Do not use Elementor or another page builder.

## Install on an existing WordPress site

1. Copy `themes/atlas-relics` into `wp-content/themes/atlas-relics`.
2. Copy `plugins/atlas-relics-core` into `wp-content/plugins/atlas-relics-core`.
3. Activate WooCommerce, then activate Atlas Relics Core, then activate the Atlas Relics theme.
4. Complete the WooCommerce setup wizard (pages, currency, payments, shipping, taxes).
5. In **Atlas Relics → Setup**, run **Create store pages and sample catalog** on a staging site if you want starter content.
6. Connect a payment gateway in WooCommerce. Store API keys in the WordPress environment or a secrets manager, never in this repository.

## Local development

Copy `.env.example` to `.env`, then:

```bash
chmod +x bin/setup-local.sh
./bin/setup-local.sh
```

Or use `@wordpress/env`:

```bash
npm install -g @wordpress/env
npx wp-env start
```

The setup script is for local machines only. It never deploys, never writes to production, and never commits secrets.

## Design

The theme uses `theme.json` tokens:

- Deep navy and charcoal for night surfaces
- Warm ivory for reading surfaces
- Restrained antique gold for edges and labels
- Editorial serif for titles and long text
- Humanist sans for navigation and commerce UI

Style variation **Night Study** inverts the reading surface for low-light reading. There is no galaxy art, portal imagery, crystal collage, or decorative animation.

## Content voice

Write in clear paragraphs. Do not use em dashes. Do not use the word “unlock.” Do not promise transformation or diagnose the reader. Keep a psychology, reflection, and ancient-wisdom point of view.

## Security

Forms use nonces, capability checks, sanitization on input, and escaping on output. `DISALLOW_FILE_EDIT` is recommended in production. Debug logging should stay off on public servers.

## License

GPL-2.0-or-later, matching WordPress.
