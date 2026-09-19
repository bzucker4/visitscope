<?php
/**
 * Plugin Name: Atlas Relics Core
 * Plugin URI: https://atlasrelics.com
 * Description: Business functionality for Atlas Relics: product lines, WooCommerce catalog helpers, reading requests, inquiry forms, and staging sample content. Presentation stays in the Atlas Relics theme.
 * Version: 1.0.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Author: Atlas Relics
 * Author URI: https://atlasrelics.com
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: atlas-relics-core
 * Domain Path: /languages
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

define( 'ATLAS_RELICS_CORE_VERSION', '1.0.0' );
define( 'ATLAS_RELICS_CORE_FILE', __FILE__ );
define( 'ATLAS_RELICS_CORE_PATH', plugin_dir_path( __FILE__ ) );
define( 'ATLAS_RELICS_CORE_URL', plugin_dir_url( __FILE__ ) );

require_once ATLAS_RELICS_CORE_PATH . 'includes/class-plugin.php';

register_activation_hook( __FILE__, array( 'Atlas_Relics_Core_Plugin', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Atlas_Relics_Core_Plugin', 'deactivate' ) );

add_action( 'plugins_loaded', array( 'Atlas_Relics_Core_Plugin', 'instance' ) );
