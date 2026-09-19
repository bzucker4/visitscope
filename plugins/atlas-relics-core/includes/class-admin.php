<?php
/**
 * Admin screens.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Admin UI.
 */
class Atlas_Relics_Core_Admin {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_post_atlas_relics_install_demo', array( __CLASS__, 'handle_demo' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
	}

	/**
	 * Admin CSS.
	 *
	 * @param string $hook Hook suffix.
	 */
	public static function assets( $hook ) {
		if ( false === strpos( $hook, 'atlas-relics' ) ) {
			return;
		}
		wp_enqueue_style(
			'atlas-relics-core-admin',
			ATLAS_RELICS_CORE_URL . 'assets/admin.css',
			array(),
			ATLAS_RELICS_CORE_VERSION
		);
	}

	/**
	 * Menu.
	 */
	public static function menu() {
		add_menu_page(
			__( 'Atlas Relics', 'atlas-relics-core' ),
			__( 'Atlas Relics', 'atlas-relics-core' ),
			'manage_options',
			'atlas-relics',
			array( __CLASS__, 'render_settings' ),
			'dashicons-book-alt',
			56
		);

		add_submenu_page(
			'atlas-relics',
			__( 'Settings', 'atlas-relics-core' ),
			__( 'Settings', 'atlas-relics-core' ),
			'manage_options',
			'atlas-relics',
			array( __CLASS__, 'render_settings' )
		);

		add_submenu_page(
			'atlas-relics',
			__( 'Setup', 'atlas-relics-core' ),
			__( 'Setup', 'atlas-relics-core' ),
			'manage_options',
			'atlas-relics-setup',
			array( __CLASS__, 'render_setup' )
		);
	}

	/**
	 * Settings page.
	 */
	public static function render_settings() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to edit these settings.', 'atlas-relics-core' ) );
		}

		if ( isset( $_GET['settings-updated'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Settings saved.', 'atlas-relics-core' ) . '</p></div>';
		}

		$settings = wp_parse_args( get_option( Atlas_Relics_Core_Settings::OPTION, array() ), Atlas_Relics_Core_Settings::defaults() );
		?>
		<div class="wrap ar-admin">
			<h1><?php esc_html_e( 'Atlas Relics settings', 'atlas-relics-core' ); ?></h1>
			<p><?php esc_html_e( 'Store payment keys in WooCommerce or your host environment. Do not paste secrets here.', 'atlas-relics-core' ); ?></p>
			<form action="options.php" method="post">
				<?php settings_fields( 'atlas_relics_core' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="inquiry_email"><?php esc_html_e( 'Inquiry inbox', 'atlas-relics-core' ); ?></label></th>
						<td>
							<input type="email" class="regular-text" id="inquiry_email" name="<?php echo esc_attr( Atlas_Relics_Core_Settings::OPTION ); ?>[inquiry_email]" value="<?php echo esc_attr( $settings['inquiry_email'] ); ?>" required />
							<p class="description"><?php esc_html_e( 'Reading requests and contact messages are sent here.', 'atlas-relics-core' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="from_name"><?php esc_html_e( 'From name', 'atlas-relics-core' ); ?></label></th>
						<td>
							<input type="text" class="regular-text" id="from_name" name="<?php echo esc_attr( Atlas_Relics_Core_Settings::OPTION ); ?>[from_name]" value="<?php echo esc_attr( $settings['from_name'] ); ?>" />
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="reading_notice"><?php esc_html_e( 'Reading notice', 'atlas-relics-core' ); ?></label></th>
						<td>
							<textarea class="large-text" rows="4" id="reading_notice" name="<?php echo esc_attr( Atlas_Relics_Core_Settings::OPTION ); ?>[reading_notice]"><?php echo esc_textarea( $settings['reading_notice'] ); ?></textarea>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="privacy_note"><?php esc_html_e( 'Privacy note on forms', 'atlas-relics-core' ); ?></label></th>
						<td>
							<textarea class="large-text" rows="3" id="privacy_note" name="<?php echo esc_attr( Atlas_Relics_Core_Settings::OPTION ); ?>[privacy_note]"><?php echo esc_textarea( $settings['privacy_note'] ); ?></textarea>
						</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Setup / sample catalog.
	 */
	public static function render_setup() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to run setup.', 'atlas-relics-core' ) );
		}

		$installed = (bool) get_option( 'atlas_relics_core_demo_installed' );
		$status    = isset( $_GET['ar_setup'] ) ? sanitize_key( wp_unslash( $_GET['ar_setup'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		?>
		<div class="wrap ar-admin">
			<h1><?php esc_html_e( 'Atlas Relics setup', 'atlas-relics-core' ); ?></h1>
			<?php if ( 'ok' === $status ) : ?>
				<div class="notice notice-success"><p><?php esc_html_e( 'Sample catalog and pages were created or refreshed on this site.', 'atlas-relics-core' ); ?></p></div>
			<?php endif; ?>
			<p><?php esc_html_e( 'Use this on local or staging WordPress only. It creates product lines, starter products, and pages. It does not talk to production and it does not store payment credentials.', 'atlas-relics-core' ); ?></p>
			<?php if ( $installed ) : ?>
				<p><?php esc_html_e( 'Sample content has already been installed. Running it again updates copy on matching slugs.', 'atlas-relics-core' ); ?></p>
			<?php endif; ?>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="atlas_relics_install_demo" />
				<?php wp_nonce_field( 'atlas_relics_install_demo' ); ?>
				<?php submit_button( __( 'Create store pages and sample catalog', 'atlas-relics-core' ), 'primary', 'submit', false ); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Demo installer action.
	 */
	public static function handle_demo() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to run setup.', 'atlas-relics-core' ) );
		}

		check_admin_referer( 'atlas_relics_install_demo' );

		Atlas_Relics_Core_Demo_Content::install();

		wp_safe_redirect( add_query_arg( 'ar_setup', 'ok', admin_url( 'admin.php?page=atlas-relics-setup' ) ) );
		exit;
	}
}
