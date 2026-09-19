<?php
/**
 * Reading request custom post type.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Private reading requests.
 */
class Atlas_Relics_Core_Reading_Requests {

	const POST_TYPE = 'ar_reading_request';

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_filter( 'manage_' . self::POST_TYPE . '_posts_columns', array( __CLASS__, 'columns' ) );
		add_action( 'manage_' . self::POST_TYPE . '_posts_custom_column', array( __CLASS__, 'column_content' ), 10, 2 );
		add_action( 'add_meta_boxes', array( __CLASS__, 'meta_boxes' ) );
		add_action( 'save_post_' . self::POST_TYPE, array( __CLASS__, 'save_meta' ) );
	}

	/**
	 * Register CPT.
	 */
	public static function register_post_type() {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'              => array(
					'name'               => __( 'Reading requests', 'atlas-relics-core' ),
					'singular_name'      => __( 'Reading request', 'atlas-relics-core' ),
					'add_new_item'       => __( 'Add reading request', 'atlas-relics-core' ),
					'edit_item'          => __( 'Edit reading request', 'atlas-relics-core' ),
					'search_items'       => __( 'Search reading requests', 'atlas-relics-core' ),
					'not_found'          => __( 'No reading requests found.', 'atlas-relics-core' ),
					'not_found_in_trash' => __( 'No reading requests in trash.', 'atlas-relics-core' ),
				),
				'public'              => false,
				'show_ui'             => true,
				'show_in_menu'        => 'atlas-relics',
				'show_in_rest'        => false,
				'capability_type'     => 'post',
				'map_meta_cap'        => true,
				'supports'            => array( 'title', 'editor' ),
				'has_archive'         => false,
				'rewrite'             => false,
				'exclude_from_search' => true,
			)
		);
	}

	/**
	 * Admin columns.
	 *
	 * @param array $columns Columns.
	 * @return array
	 */
	public static function columns( $columns ) {
		$new = array();
		foreach ( $columns as $key => $label ) {
			$new[ $key ] = $label;
			if ( 'title' === $key ) {
				$new['ar_email']  = __( 'Email', 'atlas-relics-core' );
				$new['ar_format'] = __( 'Format', 'atlas-relics-core' );
				$new['ar_status'] = __( 'Status', 'atlas-relics-core' );
			}
		}
		return $new;
	}

	/**
	 * Column output.
	 *
	 * @param string $column  Column key.
	 * @param int    $post_id Post ID.
	 */
	public static function column_content( $column, $post_id ) {
		if ( 'ar_email' === $column ) {
			echo esc_html( (string) get_post_meta( $post_id, '_ar_email', true ) );
		}
		if ( 'ar_format' === $column ) {
			echo esc_html( (string) get_post_meta( $post_id, '_ar_format', true ) );
		}
		if ( 'ar_status' === $column ) {
			echo esc_html( (string) get_post_meta( $post_id, '_ar_status', true ) );
		}
	}

	/**
	 * Meta box.
	 */
	public static function meta_boxes() {
		add_meta_box(
			'ar-reading-request-details',
			__( 'Request details', 'atlas-relics-core' ),
			array( __CLASS__, 'render_meta_box' ),
			self::POST_TYPE,
			'side'
		);
	}

	/**
	 * Meta box HTML.
	 *
	 * @param WP_Post $post Post.
	 */
	public static function render_meta_box( $post ) {
		wp_nonce_field( 'ar_reading_request_meta', 'ar_reading_request_meta_nonce' );

		$email   = (string) get_post_meta( $post->ID, '_ar_email', true );
		$phone   = (string) get_post_meta( $post->ID, '_ar_phone', true );
		$format  = (string) get_post_meta( $post->ID, '_ar_format', true );
		$order   = (string) get_post_meta( $post->ID, '_ar_order', true );
		$status  = (string) get_post_meta( $post->ID, '_ar_status', true );
		$windows = (string) get_post_meta( $post->ID, '_ar_windows', true );

		if ( ! $status ) {
			$status = 'new';
		}
		?>
		<p>
			<label for="ar_email"><?php esc_html_e( 'Email', 'atlas-relics-core' ); ?></label>
			<input type="email" class="widefat" id="ar_email" name="ar_email" value="<?php echo esc_attr( $email ); ?>" />
		</p>
		<p>
			<label for="ar_phone"><?php esc_html_e( 'Phone (optional)', 'atlas-relics-core' ); ?></label>
			<input type="text" class="widefat" id="ar_phone" name="ar_phone" value="<?php echo esc_attr( $phone ); ?>" />
		</p>
		<p>
			<label for="ar_format"><?php esc_html_e( 'Format', 'atlas-relics-core' ); ?></label>
			<select class="widefat" id="ar_format" name="ar_format">
				<?php foreach ( self::formats() as $value => $label ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $format, $value ); ?>><?php echo esc_html( $label ); ?></option>
				<?php endforeach; ?>
			</select>
		</p>
		<p>
			<label for="ar_windows"><?php esc_html_e( 'Preferred windows', 'atlas-relics-core' ); ?></label>
			<input type="text" class="widefat" id="ar_windows" name="ar_windows" value="<?php echo esc_attr( $windows ); ?>" />
		</p>
		<p>
			<label for="ar_order"><?php esc_html_e( 'Order number', 'atlas-relics-core' ); ?></label>
			<input type="text" class="widefat" id="ar_order" name="ar_order" value="<?php echo esc_attr( $order ); ?>" />
		</p>
		<p>
			<label for="ar_status"><?php esc_html_e( 'Status', 'atlas-relics-core' ); ?></label>
			<select class="widefat" id="ar_status" name="ar_status">
				<?php foreach ( self::statuses() as $value => $label ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $status, $value ); ?>><?php echo esc_html( $label ); ?></option>
				<?php endforeach; ?>
			</select>
		</p>
		<?php
	}

	/**
	 * Save meta.
	 *
	 * @param int $post_id Post ID.
	 */
	public static function save_meta( $post_id ) {
		if ( ! isset( $_POST['ar_reading_request_meta_nonce'] ) ) {
			return;
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['ar_reading_request_meta_nonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'ar_reading_request_meta' ) ) {
			return;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$email = isset( $_POST['ar_email'] ) ? sanitize_email( wp_unslash( $_POST['ar_email'] ) ) : '';
		update_post_meta( $post_id, '_ar_email', $email );

		$phone = isset( $_POST['ar_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['ar_phone'] ) ) : '';
		update_post_meta( $post_id, '_ar_phone', $phone );

		$format = isset( $_POST['ar_format'] ) ? sanitize_key( wp_unslash( $_POST['ar_format'] ) ) : 'video';
		if ( ! array_key_exists( $format, self::formats() ) ) {
			$format = 'video';
		}
		update_post_meta( $post_id, '_ar_format', $format );

		$windows = isset( $_POST['ar_windows'] ) ? sanitize_text_field( wp_unslash( $_POST['ar_windows'] ) ) : '';
		update_post_meta( $post_id, '_ar_windows', $windows );

		$order = isset( $_POST['ar_order'] ) ? sanitize_text_field( wp_unslash( $_POST['ar_order'] ) ) : '';
		update_post_meta( $post_id, '_ar_order', $order );

		$status = isset( $_POST['ar_status'] ) ? sanitize_key( wp_unslash( $_POST['ar_status'] ) ) : 'new';
		if ( ! array_key_exists( $status, self::statuses() ) ) {
			$status = 'new';
		}
		update_post_meta( $post_id, '_ar_status', $status );
	}

	/**
	 * Formats.
	 *
	 * @return array<string, string>
	 */
	public static function formats() {
		return array(
			'video'   => __( 'Video conversation', 'atlas-relics-core' ),
			'writing' => __( 'Written exchange', 'atlas-relics-core' ),
			'either'  => __( 'Either is fine', 'atlas-relics-core' ),
		);
	}

	/**
	 * Statuses.
	 *
	 * @return array<string, string>
	 */
	public static function statuses() {
		return array(
			'new'       => __( 'New', 'atlas-relics-core' ),
			'reviewed'  => __( 'Reviewed', 'atlas-relics-core' ),
			'scheduled' => __( 'Scheduled', 'atlas-relics-core' ),
			'declined'  => __( 'Declined', 'atlas-relics-core' ),
		);
	}
}
