<?php
/**
 * WooCommerce product meta and catalog helpers.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

/**
 * WooCommerce integration.
 */
class Atlas_Relics_Core_WooCommerce {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'plugins_loaded', array( __CLASS__, 'maybe_boot' ), 20 );
	}

	/**
	 * Attach WooCommerce hooks when the shop is present.
	 */
	public static function maybe_boot() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action( 'admin_notices', array( __CLASS__, 'missing_notice' ) );
			return;
		}

		add_filter( 'woocommerce_product_data_tabs', array( __CLASS__, 'product_tab' ) );
		add_action( 'woocommerce_product_data_panels', array( __CLASS__, 'product_panel' ) );
		add_action( 'woocommerce_process_product_meta', array( __CLASS__, 'save_product_meta' ) );
		add_action( 'woocommerce_single_product_summary', array( __CLASS__, 'render_subtitle' ), 6 );
		add_action( 'woocommerce_after_single_product_summary', array( __CLASS__, 'render_intended_use' ), 8 );
		add_filter( 'woocommerce_product_tabs', array( __CLASS__, 'filter_tabs' ) );
	}

	/**
	 * Admin notice when WooCommerce is inactive.
	 */
	public static function missing_notice() {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}
		echo '<div class="notice notice-warning"><p>';
		echo esc_html__( 'Atlas Relics Core expects WooCommerce to be active for the catalog, cart, and checkout.', 'atlas-relics-core' );
		echo '</p></div>';
	}

	/**
	 * Product data tab.
	 *
	 * @param array $tabs Tabs.
	 * @return array
	 */
	public static function product_tab( $tabs ) {
		$tabs['atlas_relics'] = array(
			'label'    => __( 'Atlas Relics', 'atlas-relics-core' ),
			'target'   => 'atlas_relics_product_data',
			'class'    => array(),
			'priority' => 70,
		);
		return $tabs;
	}

	/**
	 * Product data panel.
	 */
	public static function product_panel() {
		global $post;

		if ( ! $post ) {
			return;
		}

		wp_nonce_field( 'atlas_relics_product_meta', 'atlas_relics_product_meta_nonce' );

		echo '<div id="atlas_relics_product_data" class="panel woocommerce_options_panel">';

		woocommerce_wp_text_input(
			array(
				'id'          => '_ar_subtitle',
				'label'       => __( 'Subtitle', 'atlas-relics-core' ),
				'description' => __( 'A short line under the title. Not a slogan.', 'atlas-relics-core' ),
				'desc_tip'    => true,
				'value'       => get_post_meta( $post->ID, '_ar_subtitle', true ),
			)
		);

		woocommerce_wp_select(
			array(
				'id'          => '_ar_format',
				'label'       => __( 'Format', 'atlas-relics-core' ),
				'options'     => self::formats(),
				'value'       => get_post_meta( $post->ID, '_ar_format', true ),
			)
		);

		woocommerce_wp_text_input(
			array(
				'id'          => '_ar_duration',
				'label'       => __( 'Duration or length', 'atlas-relics-core' ),
				'description' => __( 'Example: 45 minutes, 6 weeks, 180 pages.', 'atlas-relics-core' ),
				'desc_tip'    => true,
				'value'       => get_post_meta( $post->ID, '_ar_duration', true ),
			)
		);

		woocommerce_wp_textarea_input(
			array(
				'id'          => '_ar_intended_use',
				'label'       => __( 'Intended use', 'atlas-relics-core' ),
				'description' => __( 'State what this object is for, and what it is not. Do not diagnose the customer.', 'atlas-relics-core' ),
				'value'       => get_post_meta( $post->ID, '_ar_intended_use', true ),
			)
		);

		echo '</div>';
	}

	/**
	 * Save product meta.
	 *
	 * @param int $post_id Product ID.
	 */
	public static function save_product_meta( $post_id ) {
		if ( ! isset( $_POST['atlas_relics_product_meta_nonce'] ) ) {
			return;
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['atlas_relics_product_meta_nonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'atlas_relics_product_meta' ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$subtitle = isset( $_POST['_ar_subtitle'] ) ? sanitize_text_field( wp_unslash( $_POST['_ar_subtitle'] ) ) : '';
		update_post_meta( $post_id, '_ar_subtitle', $subtitle );

		$format = isset( $_POST['_ar_format'] ) ? sanitize_key( wp_unslash( $_POST['_ar_format'] ) ) : '';
		if ( $format && ! array_key_exists( $format, self::formats() ) ) {
			$format = '';
		}
		update_post_meta( $post_id, '_ar_format', $format );

		$duration = isset( $_POST['_ar_duration'] ) ? sanitize_text_field( wp_unslash( $_POST['_ar_duration'] ) ) : '';
		update_post_meta( $post_id, '_ar_duration', $duration );

		$use = isset( $_POST['_ar_intended_use'] ) ? sanitize_textarea_field( wp_unslash( $_POST['_ar_intended_use'] ) ) : '';
		update_post_meta( $post_id, '_ar_intended_use', $use );
	}

	/**
	 * Formats.
	 *
	 * @return array<string, string>
	 */
	public static function formats() {
		return array(
			''            => __( 'Not specified', 'atlas-relics-core' ),
			'print'       => __( 'Print', 'atlas-relics-core' ),
			'digital'     => __( 'Digital download', 'atlas-relics-core' ),
			'audio'       => __( 'Audio', 'atlas-relics-core' ),
			'course'      => __( 'Course', 'atlas-relics-core' ),
			'session'     => __( 'Live session', 'atlas-relics-core' ),
			'print-digital' => __( 'Print and digital', 'atlas-relics-core' ),
		);
	}

	/**
	 * Subtitle under the product title.
	 */
	public static function render_subtitle() {
		if ( ! is_product() ) {
			return;
		}

		$subtitle = get_post_meta( get_the_ID(), '_ar_subtitle', true );
		if ( ! $subtitle ) {
			return;
		}

		echo '<p class="ar-product-subtitle">' . esc_html( $subtitle ) . '</p>';
	}

	/**
	 * Intended-use note.
	 */
	public static function render_intended_use() {
		if ( ! is_product() ) {
			return;
		}

		$use      = get_post_meta( get_the_ID(), '_ar_intended_use', true );
		$duration = get_post_meta( get_the_ID(), '_ar_duration', true );
		$format   = get_post_meta( get_the_ID(), '_ar_format', true );

		if ( ! $use && ! $duration && ! $format ) {
			return;
		}

		echo '<section class="ar-intended-use" aria-labelledby="ar-intended-use-heading">';
		echo '<h2 id="ar-intended-use-heading">' . esc_html__( 'How this is used', 'atlas-relics-core' ) . '</h2>';
		if ( $format && isset( self::formats()[ $format ] ) ) {
			echo '<p><strong>' . esc_html__( 'Format', 'atlas-relics-core' ) . ':</strong> ' . esc_html( self::formats()[ $format ] ) . '</p>';
		}
		if ( $duration ) {
			echo '<p><strong>' . esc_html__( 'Length', 'atlas-relics-core' ) . ':</strong> ' . esc_html( $duration ) . '</p>';
		}
		if ( $use ) {
			echo '<p>' . esc_html( $use ) . '</p>';
		}
		echo '</section>';
	}

	/**
	 * Rename the default description tab.
	 *
	 * @param array $tabs Tabs.
	 * @return array
	 */
	public static function filter_tabs( $tabs ) {
		if ( isset( $tabs['description'] ) ) {
			$tabs['description']['title'] = __( 'About this object', 'atlas-relics-core' );
		}
		return $tabs;
	}
}
