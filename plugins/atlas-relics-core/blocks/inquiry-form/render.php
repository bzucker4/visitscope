<?php
/**
 * Inquiry form markup.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

wp_enqueue_script( 'atlas-relics-core-forms' );

$privacy = Atlas_Relics_Core_Settings::get( 'privacy_note' );
$status  = Atlas_Relics_Core_Forms::status_html();
?>
<div class="ar-form-shell">
	<?php echo $status; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper ?>
	<form class="ar-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<input type="hidden" name="action" value="atlas_relics_inquiry" />
		<?php wp_nonce_field( 'atlas_relics_inquiry', 'atlas_relics_inquiry_nonce' ); ?>
		<p class="ar-honeypot" hidden>
			<label for="ar_website_inquiry"><?php esc_html_e( 'Leave blank', 'atlas-relics-core' ); ?></label>
			<input type="text" name="ar_website" id="ar_website_inquiry" tabindex="-1" autocomplete="off" />
		</p>
		<label for="ar_name_inquiry">
			<?php esc_html_e( 'Name', 'atlas-relics-core' ); ?>
			<input type="text" id="ar_name_inquiry" name="ar_name" required autocomplete="name" />
		</label>
		<label for="ar_email_inquiry">
			<?php esc_html_e( 'Email', 'atlas-relics-core' ); ?>
			<input type="email" id="ar_email_inquiry" name="ar_email" required autocomplete="email" />
		</label>
		<label for="ar_subject">
			<?php esc_html_e( 'Subject', 'atlas-relics-core' ); ?>
			<input type="text" id="ar_subject" name="ar_subject" />
		</label>
		<label for="ar_message">
			<?php esc_html_e( 'Message', 'atlas-relics-core' ); ?>
			<textarea id="ar_message" name="ar_message" required rows="6"></textarea>
		</label>
		<label for="ar_consent_inquiry" class="ar-consent">
			<input type="checkbox" id="ar_consent_inquiry" name="ar_consent" value="1" required />
			<span><?php echo esc_html( $privacy ); ?></span>
		</label>
		<p>
			<button type="submit" class="wp-element-button"><?php esc_html_e( 'Send message', 'atlas-relics-core' ); ?></button>
		</p>
	</form>
</div>
