<?php
/**
 * Plugin settings.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Settings API wrapper.
 */
class Atlas_Relics_Core_Settings {

	const OPTION = 'atlas_relics_core_settings';

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'admin_init', array( __CLASS__, 'register' ) );
	}

	/**
	 * Default option values.
	 *
	 * @return array<string, string>
	 */
	public static function defaults() {
		$admin_email = get_option( 'admin_email' );

		return array(
			'inquiry_email'   => is_email( $admin_email ) ? $admin_email : '',
			'from_name'       => get_bloginfo( 'name' ),
			'reading_notice'  => __( 'Readings are reflective conversations, not therapy, medical care, or fortune-telling. If you are in crisis, contact local emergency services.', 'atlas-relics-core' ),
			'privacy_note'    => __( 'We use your details only to reply and, if you ask, to schedule a session. We do not sell this information.', 'atlas-relics-core' ),
		);
	}

	/**
	 * Register settings.
	 */
	public static function register() {
		register_setting(
			'atlas_relics_core',
			self::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize' ),
				'default'           => self::defaults(),
				'show_in_rest'      => false,
			)
		);
	}

	/**
	 * Sanitize settings.
	 *
	 * @param mixed $input Raw input.
	 * @return array<string, string>
	 */
	public static function sanitize( $input ) {
		$defaults = self::defaults();
		$input    = is_array( $input ) ? $input : array();
		$out      = $defaults;

		if ( ! empty( $input['inquiry_email'] ) && is_email( $input['inquiry_email'] ) ) {
			$out['inquiry_email'] = sanitize_email( $input['inquiry_email'] );
		}

		if ( isset( $input['from_name'] ) ) {
			$out['from_name'] = sanitize_text_field( $input['from_name'] );
		}

		if ( isset( $input['reading_notice'] ) ) {
			$out['reading_notice'] = sanitize_textarea_field( $input['reading_notice'] );
		}

		if ( isset( $input['privacy_note'] ) ) {
			$out['privacy_note'] = sanitize_textarea_field( $input['privacy_note'] );
		}

		return $out;
	}

	/**
	 * Get a setting.
	 *
	 * @param string $key     Key.
	 * @param string $fallback Fallback.
	 * @return string
	 */
	public static function get( $key, $fallback = '' ) {
		$settings = wp_parse_args( get_option( self::OPTION, array() ), self::defaults() );
		if ( isset( $settings[ $key ] ) && '' !== $settings[ $key ] ) {
			return (string) $settings[ $key ];
		}
		return $fallback;
	}
}
