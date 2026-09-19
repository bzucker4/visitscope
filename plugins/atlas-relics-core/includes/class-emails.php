<?php
/**
 * Notification email.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Mail helpers. No credentials stored here.
 */
class Atlas_Relics_Core_Emails {

	/**
	 * Hooks.
	 */
	public static function init() {
		// Reserved for future digest mail. Sending is invoked from form handlers.
	}

	/**
	 * Inbox address.
	 *
	 * @return string
	 */
	private static function to() {
		$email = Atlas_Relics_Core_Settings::get( 'inquiry_email' );
		return is_email( $email ) ? $email : (string) get_option( 'admin_email' );
	}

	/**
	 * Headers.
	 *
	 * @param string $reply Reply-to email.
	 * @return array<int, string>
	 */
	private static function headers( $reply = '' ) {
		$from_name = Atlas_Relics_Core_Settings::get( 'from_name', get_bloginfo( 'name' ) );
		$headers   = array(
			'Content-Type: text/plain; charset=UTF-8',
			'From: ' . wp_specialchars_decode( $from_name, ENT_QUOTES ) . ' <' . self::to() . '>',
		);
		if ( is_email( $reply ) ) {
			$headers[] = 'Reply-To: ' . $reply;
		}
		return $headers;
	}

	/**
	 * Notify staff of a reading request.
	 *
	 * @param int $post_id Request ID.
	 */
	public static function reading_request( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return;
		}

		$email  = (string) get_post_meta( $post_id, '_ar_email', true );
		$format = (string) get_post_meta( $post_id, '_ar_format', true );
		$window = (string) get_post_meta( $post_id, '_ar_windows', true );
		$order  = (string) get_post_meta( $post_id, '_ar_order', true );
		$phone  = (string) get_post_meta( $post_id, '_ar_phone', true );

		$subject = sprintf(
			/* translators: %s: requester name */
			__( 'Reading request from %s', 'atlas-relics-core' ),
			$post->post_title
		);

		$body  = __( 'A reading request arrived.', 'atlas-relics-core' ) . "\n\n";
		$body .= __( 'Name:', 'atlas-relics-core' ) . ' ' . $post->post_title . "\n";
		$body .= __( 'Email:', 'atlas-relics-core' ) . ' ' . $email . "\n";
		$body .= __( 'Phone:', 'atlas-relics-core' ) . ' ' . $phone . "\n";
		$body .= __( 'Format:', 'atlas-relics-core' ) . ' ' . $format . "\n";
		$body .= __( 'Windows:', 'atlas-relics-core' ) . ' ' . $window . "\n";
		$body .= __( 'Order:', 'atlas-relics-core' ) . ' ' . $order . "\n\n";
		$body .= $post->post_content . "\n";

		wp_mail( self::to(), $subject, $body, self::headers( $email ) );
	}

	/**
	 * Inquiry message.
	 *
	 * @param string $name    Name.
	 * @param string $email   Email.
	 * @param string $subject Subject.
	 * @param string $message Message.
	 */
	public static function inquiry( $name, $email, $subject, $message ) {
		$mail_subject = $subject
			? sprintf(
				/* translators: %s: subject line */
				__( 'Inquiry: %s', 'atlas-relics-core' ),
				$subject
			)
			: sprintf(
				/* translators: %s: sender name */
				__( 'Inquiry from %s', 'atlas-relics-core' ),
				$name
			);

		$body  = __( 'Name:', 'atlas-relics-core' ) . ' ' . $name . "\n";
		$body .= __( 'Email:', 'atlas-relics-core' ) . ' ' . $email . "\n\n";
		$body .= $message . "\n";

		wp_mail( self::to(), $mail_subject, $body, self::headers( $email ) );
	}
}
