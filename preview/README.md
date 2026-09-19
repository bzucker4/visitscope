# Design preview

`preview/` is a static rendering of Home, Conscious Mirror, and Readings using the theme fonts, colors, and `screen.css`. It exists so design and accessibility can be checked without booting WordPress.

It is not the production site. Cart, checkout, accounts, and sample products require WordPress and WooCommerce.

```bash
python3 -m http.server 8080 --directory .
```

Then open `/preview/home.html`.
