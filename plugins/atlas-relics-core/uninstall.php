<?php
/**
 * Uninstall Atlas Relics Core.
 *
 * Products and pages created in WordPress remain. This removes plugin
 * options and reading-request posts when the administrator deletes the plugin.
 *
 * @package AtlasRelicsCore
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

if ( ! current_user_can( 'activate_plugins' ) ) {
	return;
}

delete_option( 'atlas_relics_core_settings' );
delete_option( 'atlas_relics_core_demo_installed' );
delete_transient( 'atlas_relics_core_form_rate' );

$requests = get_posts(
	array(
		'post_type'      => 'ar_reading_request',
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	)
);

foreach ( $requests as $request_id ) {
	wp_delete_post( (int) $request_id, true );
}
