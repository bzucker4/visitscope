<?php
/**
 * Plugin bootstrap.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

require_once ATLAS_RELICS_CORE_PATH . 'includes/class-product-lines.php';
require_once ATLAS_RELICS_CORE_PATH . 'includes/class-reading-requests.php';
require_once ATLAS_RELICS_CORE_PATH . 'includes/class-settings.php';
require_once ATLAS_RELICS_CORE_PATH . 'includes/class-forms.php';
require_once ATLAS_RELICS_CORE_PATH . 'includes/class-woocommerce.php';
require_once ATLAS_RELICS_CORE_PATH . 'includes/class-blocks.php';
require_once ATLAS_RELICS_CORE_PATH . 'includes/class-emails.php';
require_once ATLAS_RELICS_CORE_PATH . 'includes/class-demo-content.php';
require_once ATLAS_RELICS_CORE_PATH . 'includes/class-admin.php';

/**
 * Main plugin container.
 */
final class Atlas_Relics_Core_Plugin {

	/**
	 * Singleton.
	 *
	 * @var self|null
	 */
	private static $instance = null;

	/**
	 * Return the shared instance.
	 *
	 * @return self
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->init();
		}

		return self::$instance;
	}

	/**
	 * Wire feature classes.
	 */
	private function init() {
		load_plugin_textdomain( 'atlas-relics-core', false, dirname( plugin_basename( ATLAS_RELICS_CORE_FILE ) ) . '/languages' );

		Atlas_Relics_Core_Product_Lines::init();
		Atlas_Relics_Core_Reading_Requests::init();
		Atlas_Relics_Core_Settings::init();
		Atlas_Relics_Core_Forms::init();
		Atlas_Relics_Core_WooCommerce::init();
		Atlas_Relics_Core_Blocks::init();
		Atlas_Relics_Core_Emails::init();
		Atlas_Relics_Core_Admin::init();
	}

	/**
	 * Activation: capabilities and default options.
	 */
	public static function activate() {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		$defaults = Atlas_Relics_Core_Settings::defaults();
		if ( false === get_option( 'atlas_relics_core_settings', false ) ) {
			add_option( 'atlas_relics_core_settings', $defaults, '', false );
		}

		Atlas_Relics_Core_Reading_Requests::register_post_type();
		Atlas_Relics_Core_Product_Lines::register_taxonomy();
		flush_rewrite_rules();
	}

	/**
	 * Deactivation.
	 */
	public static function deactivate() {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		flush_rewrite_rules();
	}
}
