<?php
/**
 * Dynamic blocks for forms.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Blocks.
 */
class Atlas_Relics_Core_Blocks {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_filter( 'block_categories_all', array( __CLASS__, 'category' ) );
	}

	/**
	 * Block category.
	 *
	 * @param array $categories Categories.
	 * @return array
	 */
	public static function category( $categories ) {
		array_unshift(
			$categories,
			array(
				'slug'  => 'atlas-relics',
				'title' => __( 'Atlas Relics', 'atlas-relics-core' ),
			)
		);
		return $categories;
	}

	/**
	 * Register blocks from metadata.
	 */
	public static function register() {
		register_block_type( ATLAS_RELICS_CORE_PATH . 'blocks/reading-request-form' );
		register_block_type( ATLAS_RELICS_CORE_PATH . 'blocks/inquiry-form' );
	}
}
