<?php
/**
 * Atlas Relics theme bootstrap.
 *
 * Presentation only. Store logic lives in atlas-relics-core.
 *
 * @package AtlasRelics
 */

defined( 'ABSPATH' ) || exit;

define( 'ATLAS_RELICS_VERSION', '1.0.0' );
define( 'ATLAS_RELICS_DIR', get_template_directory() );
define( 'ATLAS_RELICS_URI', get_template_directory_uri() );

/**
 * Theme supports that are not expressed fully in theme.json.
 */
function atlas_relics_setup() {
	load_theme_textdomain( 'atlas-relics', ATLAS_RELICS_DIR . '/languages' );

	add_theme_support( 'wp-block-styles' );
	add_editor_style( 'assets/css/editor.css' );

	add_theme_support( 'woocommerce' );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	register_block_pattern_category(
		'atlas-relics',
		array(
			'label' => __( 'Atlas Relics', 'atlas-relics' ),
		)
	);

	register_block_pattern_category(
		'atlas-relics-shop',
		array(
			'label' => __( 'Atlas Relics Shop', 'atlas-relics' ),
		)
	);
}
add_action( 'after_setup_theme', 'atlas_relics_setup' );

/**
 * Front-end styles and a small accessibility script.
 */
function atlas_relics_enqueue_assets() {
	wp_enqueue_style(
		'atlas-relics-screen',
		ATLAS_RELICS_URI . '/assets/css/screen.css',
		array(),
		ATLAS_RELICS_VERSION
	);

	wp_enqueue_script(
		'atlas-relics-theme',
		ATLAS_RELICS_URI . '/assets/js/theme.js',
		array(),
		ATLAS_RELICS_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'atlas_relics_enqueue_assets' );

/**
 * Editor canvas styles that match the front end.
 */
function atlas_relics_enqueue_block_editor_assets() {
	wp_enqueue_style(
		'atlas-relics-editor',
		ATLAS_RELICS_URI . '/assets/css/editor.css',
		array(),
		ATLAS_RELICS_VERSION
	);
}
add_action( 'enqueue_block_editor_assets', 'atlas_relics_enqueue_block_editor_assets' );

add_filter( 'render_block_core/template-part', 'atlas_relics_maybe_prepend_skip_link', 10, 2 );

/**
 * Prepend the skip link once, on the header template part.
 *
 * @param string $block_content Rendered block.
 * @param array  $block         Parsed block.
 * @return string
 */
function atlas_relics_maybe_prepend_skip_link( $block_content, $block ) {
	static $done = false;

	if ( $done ) {
		return $block_content;
	}

	$slug = isset( $block['attrs']['slug'] ) ? $block['attrs']['slug'] : '';
	if ( 'header' !== $slug ) {
		return $block_content;
	}

	$done  = true;
	$skip  = '<a class="skip-link screen-reader-text" href="#wp--skip-link--target">';
	$skip .= esc_html__( 'Skip to content', 'atlas-relics' );
	$skip .= '</a>';

	return $skip . $block_content;
}

/**
 * Add a main-content target after the header.
 *
 * @param string $block_content Rendered block.
 * @param array  $block         Parsed block.
 * @return string
 */
function atlas_relics_main_anchor( $block_content, $block ) {
	$tag = isset( $block['attrs']['tagName'] ) ? $block['attrs']['tagName'] : '';
	if ( 'main' !== strtolower( $tag ) ) {
		return $block_content;
	}

	if ( false !== strpos( $block_content, 'id="wp--skip-link--target"' ) ) {
		return $block_content;
	}

	return preg_replace(
		'/<main\b/i',
		'<main id="wp--skip-link--target"',
		$block_content,
		1
	);
}
add_filter( 'render_block_core/group', 'atlas_relics_main_anchor', 10, 2 );

/**
 * Body class for product-line landing pages.
 *
 * @param array $classes Body classes.
 * @return array
 */
function atlas_relics_body_class( $classes ) {
	if ( is_page( array( 'conscious-mirror', 'the-caves', 'pattern-map', 'courses', 'readings', 'books' ) ) ) {
		$classes[] = 'atlas-relics-product-line';
	}

	if ( function_exists( 'is_woocommerce' ) && ( is_woocommerce() || is_cart() || is_checkout() || is_account_page() ) ) {
		$classes[] = 'atlas-relics-commerce';
	}

	return $classes;
}
add_filter( 'body_class', 'atlas_relics_body_class' );

/**
 * Notice when the core plugin is missing.
 */
function atlas_relics_admin_plugin_notice() {
	if ( ! is_admin() || ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	if ( defined( 'ATLAS_RELICS_CORE_VERSION' ) ) {
		return;
	}

	echo '<div class="notice notice-warning"><p>';
	echo esc_html__( 'Atlas Relics theme is active. Activate the Atlas Relics Core plugin for catalog, readings, and store features.', 'atlas-relics' );
	echo '</p></div>';
}
add_action( 'admin_notices', 'atlas_relics_admin_plugin_notice' );
