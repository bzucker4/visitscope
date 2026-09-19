<?php
/**
 * Product line taxonomy and WooCommerce category map.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Product lines.
 */
class Atlas_Relics_Core_Product_Lines {

	const TAXONOMY = 'ar_product_line';

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_taxonomy' ) );
	}

	/**
	 * Canonical lines.
	 *
	 * @return array<string, array<string, string>>
	 */
	public static function definitions() {
		return array(
			'conscious-mirror' => array(
				'name'        => __( 'Conscious Mirror', 'atlas-relics-core' ),
				'description' => __( 'Practices for noticing how inner life appears in outer circumstance.', 'atlas-relics-core' ),
			),
			'the-caves'        => array(
				'name'        => __( 'The Caves', 'atlas-relics-core' ),
				'description' => __( 'Descent work for the older rooms of the psyche.', 'atlas-relics-core' ),
			),
			'pattern-map'      => array(
				'name'        => __( 'Pattern Map', 'atlas-relics-core' ),
				'description' => __( 'Drawing repeating shapes in thought, relationship, and choice.', 'atlas-relics-core' ),
			),
			'courses'          => array(
				'name'        => __( 'Courses', 'atlas-relics-core' ),
				'description' => __( 'Sequenced study with a beginning, a middle, and a place to stop.', 'atlas-relics-core' ),
			),
			'readings'         => array(
				'name'        => __( 'Readings', 'atlas-relics-core' ),
				'description' => __( 'One-to-one reflective conversations with a clear frame.', 'atlas-relics-core' ),
			),
			'books'            => array(
				'name'        => __( 'Books', 'atlas-relics-core' ),
				'description' => __( 'Long-form maps of consciousness, myth, and inner life.', 'atlas-relics-core' ),
			),
			'digital-tools'    => array(
				'name'        => __( 'Digital tools', 'atlas-relics-core' ),
				'description' => __( 'Downloadable field notes, workbooks, and practice aids.', 'atlas-relics-core' ),
			),
		);
	}

	/**
	 * Register taxonomy on products.
	 */
	public static function register_taxonomy() {
		$types = array( 'product' );

		register_taxonomy(
			self::TAXONOMY,
			$types,
			array(
				'labels'            => array(
					'name'          => __( 'Product lines', 'atlas-relics-core' ),
					'singular_name' => __( 'Product line', 'atlas-relics-core' ),
					'search_items'  => __( 'Search product lines', 'atlas-relics-core' ),
					'all_items'     => __( 'All product lines', 'atlas-relics-core' ),
					'edit_item'     => __( 'Edit product line', 'atlas-relics-core' ),
					'update_item'   => __( 'Update product line', 'atlas-relics-core' ),
					'add_new_item'  => __( 'Add product line', 'atlas-relics-core' ),
					'menu_name'     => __( 'Product lines', 'atlas-relics-core' ),
				),
				'public'            => true,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'hierarchical'      => true,
				'rewrite'           => array(
					'slug' => 'line',
				),
			)
		);
	}

	/**
	 * Insert missing terms.
	 */
	public static function ensure_terms() {
		foreach ( self::definitions() as $slug => $item ) {
			if ( ! term_exists( $slug, self::TAXONOMY ) ) {
				wp_insert_term(
					$item['name'],
					self::TAXONOMY,
					array(
						'slug'        => $slug,
						'description' => $item['description'],
					)
				);
			}

			if ( taxonomy_exists( 'product_cat' ) && ! term_exists( $slug, 'product_cat' ) ) {
				wp_insert_term(
					$item['name'],
					'product_cat',
					array(
						'slug'        => $slug,
						'description' => $item['description'],
					)
				);
			}
		}
	}
}
