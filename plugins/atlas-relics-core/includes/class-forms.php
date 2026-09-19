<?php
/**
 * Public forms with nonces, sanitization, and rate limits.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Forms.
 */
class Atlas_Relics_Core_Forms {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'admin_post_nopriv_atlas_relics_reading_request', array( __CLASS__, 'handle_reading_request' ) );
		add_action( 'admin_post_atlas_relics_reading_request', array( __CLASS__, 'handle_reading_request' ) );
		add_action( 'admin_post_nopriv_atlas_relics_inquiry', array( __CLASS__, 'handle_inquiry' ) );
		add_action( 'admin_post_atlas_relics_inquiry', array( __CLASS__, 'handle_inquiry' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue' ) );
	}

	/**
	 * Front-end script for progressive enhancement only.
	 */
	public static function enqueue() {
		wp_register_script(
			'atlas-relics-core-forms',
			ATLAS_RELICS_CORE_URL . 'assets/forms.js',
			array(),
			ATLAS_RELICS_CORE_VERSION,
			true
		);
	}

	/**
	 * Reading request handler.
	 */
	public static function handle_reading_request() {
		$redirect = wp_get_referer() ? wp_get_referer() : home_url( '/readings/' );

		if ( ! isset( $_POST['atlas_relics_reading_nonce'] ) ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'invalid', $redirect ) );
			exit;
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['atlas_relics_reading_nonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'atlas_relics_reading_request' ) ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'invalid', $redirect ) );
			exit;
		}

		if ( ! empty( $_POST['ar_website'] ) ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'received', $redirect ) );
			exit;
		}

		if ( ! self::rate_limit( 'reading' ) ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'rate', $redirect ) );
			exit;
		}

		$name    = isset( $_POST['ar_name'] ) ? sanitize_text_field( wp_unslash( $_POST['ar_name'] ) ) : '';
		$email   = isset( $_POST['ar_email'] ) ? sanitize_email( wp_unslash( $_POST['ar_email'] ) ) : '';
		$phone   = isset( $_POST['ar_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['ar_phone'] ) ) : '';
		$format  = isset( $_POST['ar_format'] ) ? sanitize_key( wp_unslash( $_POST['ar_format'] ) ) : 'video';
		$windows = isset( $_POST['ar_windows'] ) ? sanitize_text_field( wp_unslash( $_POST['ar_windows'] ) ) : '';
		$order   = isset( $_POST['ar_order'] ) ? sanitize_text_field( wp_unslash( $_POST['ar_order'] ) ) : '';
		$topic   = isset( $_POST['ar_topic'] ) ? sanitize_textarea_field( wp_unslash( $_POST['ar_topic'] ) ) : '';
		$consent = ! empty( $_POST['ar_consent'] );

		if ( ! $name || ! is_email( $email ) || ! $topic || ! $consent ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'missing', $redirect ) );
			exit;
		}

		if ( ! array_key_exists( $format, Atlas_Relics_Core_Reading_Requests::formats() ) ) {
			$format = 'video';
		}

		$post_id = wp_insert_post(
			array(
				'post_type'    => Atlas_Relics_Core_Reading_Requests::POST_TYPE,
				'post_status'  => 'private',
				'post_title'   => $name,
				'post_content' => $topic,
				'post_author'  => 0,
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'error', $redirect ) );
			exit;
		}

		update_post_meta( $post_id, '_ar_email', $email );
		update_post_meta( $post_id, '_ar_phone', $phone );
		update_post_meta( $post_id, '_ar_format', $format );
		update_post_meta( $post_id, '_ar_windows', $windows );
		update_post_meta( $post_id, '_ar_order', $order );
		update_post_meta( $post_id, '_ar_status', 'new' );
		update_post_meta( $post_id, '_ar_ip', self::request_ip() );

		Atlas_Relics_Core_Emails::reading_request( $post_id );

		wp_safe_redirect( add_query_arg( 'ar_form', 'received', $redirect ) );
		exit;
	}

	/**
	 * Inquiry handler.
	 */
	public static function handle_inquiry() {
		$redirect = wp_get_referer() ? wp_get_referer() : home_url( '/contact/' );

		if ( ! isset( $_POST['atlas_relics_inquiry_nonce'] ) ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'invalid', $redirect ) );
			exit;
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['atlas_relics_inquiry_nonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'atlas_relics_inquiry' ) ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'invalid', $redirect ) );
			exit;
		}

		if ( ! empty( $_POST['ar_website'] ) ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'received', $redirect ) );
			exit;
		}

		if ( ! self::rate_limit( 'inquiry' ) ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'rate', $redirect ) );
			exit;
		}

		$name    = isset( $_POST['ar_name'] ) ? sanitize_text_field( wp_unslash( $_POST['ar_name'] ) ) : '';
		$email   = isset( $_POST['ar_email'] ) ? sanitize_email( wp_unslash( $_POST['ar_email'] ) ) : '';
		$subject = isset( $_POST['ar_subject'] ) ? sanitize_text_field( wp_unslash( $_POST['ar_subject'] ) ) : '';
		$message = isset( $_POST['ar_message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['ar_message'] ) ) : '';
		$consent = ! empty( $_POST['ar_consent'] );

		if ( ! $name || ! is_email( $email ) || ! $message || ! $consent ) {
			wp_safe_redirect( add_query_arg( 'ar_form', 'missing', $redirect ) );
			exit;
		}

		Atlas_Relics_Core_Emails::inquiry( $name, $email, $subject, $message );

		wp_safe_redirect( add_query_arg( 'ar_form', 'received', $redirect ) );
		exit;
	}

	/**
	 * Simple IP rate limit.
	 *
	 * @param string $bucket Bucket name.
	 * @return bool
	 */
	private static function rate_limit( $bucket ) {
		$key   = 'ar_form_' . $bucket . '_' . md5( self::request_ip() );
		$count = (int) get_transient( $key );
		if ( $count >= 5 ) {
			return false;
		}
		set_transient( $key, $count + 1, HOUR_IN_SECONDS );
		return true;
	}

	/**
	 * Best-effort IP for rate limiting. Not stored as a public field.
	 *
	 * @return string
	 */
	private static function request_ip() {
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		return $ip ? $ip : '0.0.0.0';
	}

	/**
	 * Shared status banner.
	 *
	 * @return string
	 */
	public static function status_html() {
		if ( empty( $_GET['ar_form'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return '';
		}

		$code = sanitize_key( wp_unslash( $_GET['ar_form'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$map  = array(
			'received' => array(
				'class' => 'is-success',
				'text'  => __( 'Received. We will reply by email.', 'atlas-relics-core' ),
			),
			'missing'  => array(
				'class' => 'is-error',
				'text'  => __( 'Please complete the required fields, including consent.', 'atlas-relics-core' ),
			),
			'invalid'  => array(
				'class' => 'is-error',
				'text'  => __( 'The form could not be verified. Refresh the page and try again.', 'atlas-relics-core' ),
			),
			'rate'     => array(
				'class' => 'is-error',
				'text'  => __( 'Please wait before sending another message.', 'atlas-relics-core' ),
			),
			'error'    => array(
				'class' => 'is-error',
				'text'  => __( 'The request could not be saved. Write to the inquiry address instead.', 'atlas-relics-core' ),
			),
		);

		if ( ! isset( $map[ $code ] ) ) {
			return '';
		}

		return sprintf(
			'<div class="ar-notice %1$s" role="status">%2$s</div>',
			esc_attr( $map[ $code ]['class'] ),
			esc_html( $map[ $code ]['text'] )
		);
	}
}
