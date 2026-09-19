<?php
/**
 * Reading request form markup.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

wp_enqueue_script( 'atlas-relics-core-forms' );

$notice  = Atlas_Relics_Core_Settings::get( 'reading_notice' );
$privacy = Atlas_Relics_Core_Settings::get( 'privacy_note' );
$status  = Atlas_Relics_Core_Forms::status_html();
?>
<div class="ar-form-shell">
	<?php echo $status; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper ?>
	<p class="ar-field-help"><?php echo esc_html( $notice ); ?></p>
	<form class="ar-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" novalidate>
		<input type="hidden" name="action" value="atlas_relics_reading_request" />
		<?php wp_nonce_field( 'atlas_relics_reading_request', 'atlas_relics_reading_nonce' ); ?>
		<p class="ar-honeypot" hidden>
			<label for="ar_website"><?php esc_html_e( 'Leave blank', 'atlas-relics-core' ); ?></label>
			<input type="text" name="ar_website" id="ar_website" tabindex="-1" autocomplete="off" />
		</p>
		<label for="ar_name">
			<?php esc_html_e( 'Name', 'atlas-relics-core' ); ?>
			<input type="text" id="ar_name" name="ar_name" required autocomplete="name" />
		</label>
		<label for="ar_email">
			<?php esc_html_e( 'Email', 'atlas-relics-core' ); ?>
			<input type="email" id="ar_email" name="ar_email" required autocomplete="email" />
		</label>
		<label for="ar_phone">
			<?php esc_html_e( 'Phone (optional)', 'atlas-relics-core' ); ?>
			<input type="tel" id="ar_phone" name="ar_phone" autocomplete="tel" />
		</label>
		<label for="ar_format">
			<?php esc_html_e( 'Preferred format', 'atlas-relics-core' ); ?>
			<select id="ar_format" name="ar_format">
				<?php foreach ( Atlas_Relics_Core_Reading_Requests::formats() as $value => $label ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>"><?php echo esc_html( $label ); ?></option>
				<?php endforeach; ?>
			</select>
		</label>
		<label for="ar_windows">
			<?php esc_html_e( 'Times that usually work', 'atlas-relics-core' ); ?>
			<input type="text" id="ar_windows" name="ar_windows" />
			<span class="ar-field-help"><?php esc_html_e( 'Example: weekday mornings, Eastern Time.', 'atlas-relics-core' ); ?></span>
		</label>
		<label for="ar_order">
			<?php esc_html_e( 'Order number (optional)', 'atlas-relics-core' ); ?>
			<input type="text" id="ar_order" name="ar_order" />
		</label>
		<label for="ar_topic">
			<?php esc_html_e( 'What do you want to look at?', 'atlas-relics-core' ); ?>
			<textarea id="ar_topic" name="ar_topic" required rows="6"></textarea>
			<span class="ar-field-help"><?php esc_html_e( 'Ordinary language is enough. You do not need a diagnosis or a mythic autobiography.', 'atlas-relics-core' ); ?></span>
		</label>
		<label for="ar_consent" class="ar-consent">
			<input type="checkbox" id="ar_consent" name="ar_consent" value="1" required />
			<span><?php echo esc_html( $privacy ); ?></span>
		</label>
		<p>
			<button type="submit" class="wp-element-button"><?php esc_html_e( 'Send request', 'atlas-relics-core' ); ?></button>
		</p>
	</form>
</div>
