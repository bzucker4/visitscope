<?php
/**
 * Staging sample catalog and pages.
 *
 * Idempotent by slug. Safe for local and staging. Never talks to production.
 *
 * @package AtlasRelicsCore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Demo content installer.
 */
class Atlas_Relics_Core_Demo_Content {

	/**
	 * Install or refresh sample content.
	 */
	public static function install() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		Atlas_Relics_Core_Product_Lines::ensure_terms();
		if ( class_exists( 'WC_Install' ) ) {
			WC_Install::create_pages();
		}
		self::create_pages();
		self::create_journal_post();
		self::create_products();
		self::create_menus();
		self::create_block_navigation();
		self::assign_front();
		update_option( 'atlas_relics_core_demo_installed', 1 );
		flush_rewrite_rules();
	}

	/**
	 * Pages.
	 */
	private static function create_pages() {
		$pages = array(
			'home'             => array(
				'title'    => __( 'Home', 'atlas-relics-core' ),
				'pattern'  => 'atlas-relics/home',
				'template' => 'page-no-title',
			),
			'about'            => array(
				'title'    => __( 'About', 'atlas-relics-core' ),
				'pattern'  => 'atlas-relics/about',
				'template' => 'page-no-title',
			),
			'conscious-mirror' => array(
				'title'    => __( 'Conscious Mirror', 'atlas-relics-core' ),
				'pattern'  => 'atlas-relics/conscious-mirror',
				'template' => 'page-no-title',
			),
			'the-caves'        => array(
				'title'    => __( 'The Caves', 'atlas-relics-core' ),
				'pattern'  => 'atlas-relics/the-caves',
				'template' => 'page-no-title',
			),
			'pattern-map'      => array(
				'title'    => __( 'Pattern Map', 'atlas-relics-core' ),
				'pattern'  => 'atlas-relics/pattern-map',
				'template' => 'page-no-title',
			),
			'courses'          => array(
				'title'    => __( 'Courses', 'atlas-relics-core' ),
				'pattern'  => 'atlas-relics/courses',
				'template' => 'page-no-title',
			),
			'readings'         => array(
				'title'    => __( 'Readings', 'atlas-relics-core' ),
				'pattern'  => 'atlas-relics/readings',
				'template' => 'page-no-title',
			),
			'books'            => array(
				'title'    => __( 'Books', 'atlas-relics-core' ),
				'pattern'  => 'atlas-relics/books',
				'template' => 'page-no-title',
			),
			'contact'          => array(
				'title'    => __( 'Contact', 'atlas-relics-core' ),
				'pattern'  => 'atlas-relics/contact',
				'template' => 'page-no-title',
			),
			'shop'             => array(
				'title'    => __( 'Shop', 'atlas-relics-core' ),
				'pattern'  => 'atlas-relics/shop-intro',
				'template' => 'page-no-title',
			),
			'journal'          => array(
				'title'    => __( 'Journal', 'atlas-relics-core' ),
				'content'  => '<!-- wp:pattern {"slug":"atlas-relics/journal-intro"} /-->',
				'template' => 'page-no-title',
			),
			'privacy'          => array(
				'title'   => __( 'Privacy', 'atlas-relics-core' ),
				'content' => self::privacy_content(),
			),
			'terms'            => array(
				'title'   => __( 'Terms', 'atlas-relics-core' ),
				'content' => self::terms_content(),
			),
			'refunds'          => array(
				'title'   => __( 'Refunds', 'atlas-relics-core' ),
				'content' => self::refunds_content(),
			),
		);

		foreach ( $pages as $slug => $page ) {
			$content = isset( $page['pattern'] )
				? sprintf( '<!-- wp:pattern {"slug":"%s"} /-->', $page['pattern'] )
				: $page['content'];

			$id = self::upsert_post(
				'page',
				$slug,
				$page['title'],
				$content
			);

			if ( ! empty( $page['template'] ) ) {
				update_post_meta( $id, '_wp_page_template', $page['template'] );
			}
		}
	}

	/**
	 * Sample journal essay.
	 */
	private static function create_journal_post() {
		self::upsert_post(
			'post',
			'the-mind-is-not-a-single-room',
			__( 'The mind is not a single room', 'atlas-relics-core' ),
			self::journal_content()
		);
	}

	/**
	 * Products.
	 */
	private static function create_products() {
		if ( ! class_exists( 'WC_Product_Simple' ) ) {
			return;
		}

		foreach ( self::product_definitions() as $item ) {
			$existing = get_page_by_path( $item['slug'], OBJECT, 'product' );
			if ( $existing ) {
				$product = wc_get_product( $existing->ID );
			} else {
				$product = new WC_Product_Simple();
			}

			if ( ! $product ) {
				continue;
			}

			$product->set_name( $item['name'] );
			$product->set_slug( $item['slug'] );
			$product->set_status( 'publish' );
			$product->set_catalog_visibility( 'visible' );
			$product->set_short_description( $item['short'] );
			$product->set_description( $item['long'] );
			$product->set_regular_price( $item['price'] );
			$product->set_sku( strtoupper( str_replace( '-', '_', $item['slug'] ) ) );
			$product->set_virtual( ! empty( $item['virtual'] ) );
			$product->set_downloadable( ! empty( $item['downloadable'] ) );
			$product->set_sold_individually( ! empty( $item['session'] ) );

			$cat_ids  = array();
			$line_ids = array();
			foreach ( $item['lines'] as $line ) {
				$cat  = get_term_by( 'slug', $line, 'product_cat' );
				$term = get_term_by( 'slug', $line, Atlas_Relics_Core_Product_Lines::TAXONOMY );
				if ( $cat ) {
					$cat_ids[] = (int) $cat->term_id;
				}
				if ( $term ) {
					$line_ids[] = (int) $term->term_id;
				}
			}
			if ( $cat_ids ) {
				$product->set_category_ids( $cat_ids );
			}

			$product_id = $product->save();
			if ( $line_ids ) {
				wp_set_object_terms( $product_id, $line_ids, Atlas_Relics_Core_Product_Lines::TAXONOMY );
			}

			update_post_meta( $product_id, '_ar_subtitle', $item['subtitle'] );
			update_post_meta( $product_id, '_ar_format', $item['format'] );
			update_post_meta( $product_id, '_ar_duration', $item['duration'] );
			update_post_meta( $product_id, '_ar_intended_use', $item['use'] );

			self::maybe_attach_cover( $product_id, $item['cover'] );
		}
	}

	/**
	 * Product list.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private static function product_definitions() {
		return array(
			array(
				'slug'         => 'conscious-mirror-field-notes',
				'name'         => __( 'Conscious Mirror Field Notes', 'atlas-relics-core' ),
				'subtitle'     => __( 'A journal for watching the day without arguing with it.', 'atlas-relics-core' ),
				'short'        => __( 'A bound notebook with a spare prompt on each spread: what happened, what you were carrying, what returned.', 'atlas-relics-core' ),
				'long'         => __( "<p>Field Notes is a paper journal for people who want a record of correspondence between inner weather and outer events. Each spread asks three questions. None of them score you.</p><p>Print edition. 160 pages. Meant to be written in, not displayed.</p>", 'atlas-relics-core' ),
				'price'        => '28',
				'virtual'      => false,
				'downloadable' => false,
				'lines'        => array( 'conscious-mirror', 'books' ),
				'format'       => 'print',
				'duration'     => __( '160 pages', 'atlas-relics-core' ),
				'use'          => __( 'A private writing practice. Not a clinical diary and not a diagnostic tool.', 'atlas-relics-core' ),
				'cover'        => 'conscious-mirror.svg',
			),
			array(
				'slug'         => 'conscious-mirror-practice-deck',
				'name'         => __( 'Conscious Mirror Practice Deck', 'atlas-relics-core' ),
				'subtitle'     => __( 'Forty-nine cards for a slower look at attention.', 'atlas-relics-core' ),
				'short'        => __( 'A card deck used as a daily or weekly prompt. Draw one, sit with it, write a paragraph.', 'atlas-relics-core' ),
				'long'         => __( '<p>The deck is a set of questions and images printed as simple geometric plates. Use one card when the day feels loud. There is no spread that predicts a future.</p>', 'atlas-relics-core' ),
				'price'        => '36',
				'virtual'      => false,
				'downloadable' => false,
				'lines'        => array( 'conscious-mirror', 'digital-tools' ),
				'format'       => 'print',
				'duration'     => __( '49 cards', 'atlas-relics-core' ),
				'use'          => __( 'A reflective prompt object. Not a divinatory system.', 'atlas-relics-core' ),
				'cover'        => 'conscious-mirror.svg',
			),
			array(
				'slug'         => 'the-caves-guided-descent',
				'name'         => __( 'The Caves: A Guided Descent', 'atlas-relics-core' ),
				'subtitle'     => __( 'Six audio sittings for the rooms you usually hurry past.', 'atlas-relics-core' ),
				'short'        => __( 'Spoken sequences with pauses. Listen with a notebook nearby. Stop if the work belongs in a clinic.', 'atlas-relics-core' ),
				'long'         => __( '<p>Six audio sittings, each about twenty minutes. The language is plain. There is no soundtrack designed to overwhelm you.</p><p>Digital download after purchase. Keep the files. There is no drip schedule.</p>', 'atlas-relics-core' ),
				'price'        => '64',
				'virtual'      => true,
				'downloadable' => true,
				'lines'        => array( 'the-caves', 'courses' ),
				'format'       => 'audio',
				'duration'     => __( 'Six sittings, about twenty minutes each', 'atlas-relics-core' ),
				'use'          => __( 'A contemplative audio sequence. Not exposure therapy and not an emergency resource.', 'atlas-relics-core' ),
				'cover'        => 'the-caves.svg',
			),
			array(
				'slug'         => 'the-caves-reader',
				'name'         => __( 'The Caves Reader', 'atlas-relics-core' ),
				'subtitle'     => __( 'Essays on descent, grief, and the older literature of the inner life.', 'atlas-relics-core' ),
				'short'        => __( 'A short book of essays. Read in order, or open wherever the sentence catches.', 'atlas-relics-core' ),
				'long'         => __( '<p>The Reader gathers essays on going down into material that daylight conversation tends to skip. Psychology and older wisdom texts sit on the same table. Neither is asked to convert the other.</p>', 'atlas-relics-core' ),
				'price'        => '22',
				'virtual'      => false,
				'downloadable' => false,
				'lines'        => array( 'the-caves', 'books' ),
				'format'       => 'print',
				'duration'     => __( 'About 180 pages', 'atlas-relics-core' ),
				'use'          => __( 'Long-form reading. Not a treatment plan.', 'atlas-relics-core' ),
				'cover'        => 'the-caves.svg',
			),
			array(
				'slug'         => 'pattern-map-workbook',
				'name'         => __( 'Pattern Map Workbook', 'atlas-relics-core' ),
				'subtitle'     => __( 'Draw the loop. Then decide what to do with the drawing.', 'atlas-relics-core' ),
				'short'        => __( 'A printable workbook for tracing repeating shapes in thought, relationship, and choice.', 'atlas-relics-core' ),
				'long'         => __( '<p>The workbook is a sequence of maps you fill in by hand. You name a repeating shape, the cost of keeping it, and one experiment that is small enough to try.</p><p>Digital PDF. Print it if you prefer paper. It will not tell you what you are.</p>', 'atlas-relics-core' ),
				'price'        => '18',
				'virtual'      => true,
				'downloadable' => true,
				'lines'        => array( 'pattern-map', 'digital-tools' ),
				'format'       => 'digital',
				'duration'     => __( '48 pages', 'atlas-relics-core' ),
				'use'          => __( 'A reflective mapping practice. Not a diagnostic instrument and not a substitute for licensed care.', 'atlas-relics-core' ),
				'cover'        => 'pattern-map.svg',
			),
			array(
				'slug'         => 'quiet-hour-reading',
				'name'         => __( 'Quiet Hour Reading', 'atlas-relics-core' ),
				'subtitle'     => __( 'Forty-five minutes of looking together.', 'atlas-relics-core' ),
				'short'        => __( 'A session credit. After purchase, send a request so a time can be confirmed.', 'atlas-relics-core' ),
				'long'         => __( '<p>This listing is a credit for a forty-five minute conversation. It is not an automated file. After you buy it, use the readings page to request a window. If the work is a poor fit, the credit is refunded according to the refunds page.</p>', 'atlas-relics-core' ),
				'price'        => '75',
				'virtual'      => true,
				'downloadable' => false,
				'session'      => true,
				'lines'        => array( 'readings' ),
				'format'       => 'session',
				'duration'     => __( '45 minutes', 'atlas-relics-core' ),
				'use'          => __( 'A reflective conversation. Not therapy, medical advice, legal counsel, or fortune-telling.', 'atlas-relics-core' ),
				'cover'        => 'mark.svg',
			),
			array(
				'slug'         => 'long-table-reading',
				'name'         => __( 'Long Table Reading', 'atlas-relics-core' ),
				'subtitle'     => __( 'Seventy-five minutes when the material needs more room.', 'atlas-relics-core' ),
				'short'        => __( 'A longer session credit. Request a time after purchase.', 'atlas-relics-core' ),
				'long'         => __( '<p>Same frame as the Quiet Hour, with more time. Still not a diagnosis. Still not a promise that the pattern will leave you.</p>', 'atlas-relics-core' ),
				'price'        => '110',
				'virtual'      => true,
				'downloadable' => false,
				'session'      => true,
				'lines'        => array( 'readings' ),
				'format'       => 'session',
				'duration'     => __( '75 minutes', 'atlas-relics-core' ),
				'use'          => __( 'A longer reflective conversation. Not a clinical hour.', 'atlas-relics-core' ),
				'cover'        => 'mark.svg',
			),
			array(
				'slug'         => 'four-stances-of-consciousness',
				'name'         => __( 'Four Stances of Consciousness', 'atlas-relics-core' ),
				'subtitle'     => __( 'A book of maps for how awareness can sit in a life.', 'atlas-relics-core' ),
				'short'        => __( 'Long-form reading on four stances of mind, written without a conversion pitch.', 'atlas-relics-core' ),
				'long'         => __( '<p>This book describes four ways awareness can be situated: things happening to you, things done by you, things moving through you, and the rarer sense of being the field itself. It is a map, not a ladder you are required to climb.</p>', 'atlas-relics-core' ),
				'price'        => '24',
				'virtual'      => false,
				'downloadable' => false,
				'lines'        => array( 'books' ),
				'format'       => 'print',
				'duration'     => __( 'About 220 pages', 'atlas-relics-core' ),
				'use'          => __( 'Study and annotation. Not a certificate of awakening.', 'atlas-relics-core' ),
				'cover'        => 'conscious-mirror.svg',
			),
			array(
				'slug'         => 'inner-life-correspondence-course',
				'name'         => __( 'Inner Life Correspondence Course', 'atlas-relics-core' ),
				'subtitle'     => __( 'Eight weeks of reading and written exercises.', 'atlas-relics-core' ),
				'short'        => __( 'A self-paced course. You receive the sequence at purchase and keep the materials.', 'atlas-relics-core' ),
				'long'         => __( '<p>Eight lessons, each with an essay and a writing task. There is no live classroom in this listing. If a cohort is offered later, it will be a separate product.</p>', 'atlas-relics-core' ),
				'price'        => '120',
				'virtual'      => true,
				'downloadable' => true,
				'lines'        => array( 'courses' ),
				'format'       => 'course',
				'duration'     => __( 'Eight lessons', 'atlas-relics-core' ),
				'use'          => __( 'Self-paced study. Not a coaching retainer and not group therapy.', 'atlas-relics-core' ),
				'cover'        => 'pattern-map.svg',
			),
			array(
				'slug'         => 'atlas-relics-essay-collection',
				'name'         => __( 'Atlas Relics Essay Collection', 'atlas-relics-core' ),
				'subtitle'     => __( 'Selected journal pieces in one digital volume.', 'atlas-relics-core' ),
				'short'        => __( 'A downloadable collection of essays on mind, myth, and practice.', 'atlas-relics-core' ),
				'long'         => __( '<p>Essays from the house journal, set for screen or print-at-home. Useful if you want the writing without hunting through the site.</p>', 'atlas-relics-core' ),
				'price'        => '12',
				'virtual'      => true,
				'downloadable' => true,
				'lines'        => array( 'digital-tools', 'books' ),
				'format'       => 'digital',
				'duration'     => __( 'Selected essays', 'atlas-relics-core' ),
				'use'          => __( 'Reading. Not a newsletter subscription.', 'atlas-relics-core' ),
				'cover'        => 'mark.svg',
			),
		);
	}

	/**
	 * Menus.
	 */
	private static function create_menus() {
		$primary_items = array(
			'about'            => __( 'About', 'atlas-relics-core' ),
			'conscious-mirror' => __( 'Conscious Mirror', 'atlas-relics-core' ),
			'the-caves'        => __( 'The Caves', 'atlas-relics-core' ),
			'pattern-map'      => __( 'Pattern Map', 'atlas-relics-core' ),
			'shop'             => __( 'Shop', 'atlas-relics-core' ),
			'readings'         => __( 'Readings', 'atlas-relics-core' ),
			'journal'          => __( 'Journal', 'atlas-relics-core' ),
		);

		self::fill_menu( 'primary', __( 'Primary', 'atlas-relics-core' ), $primary_items, 'primary' );

		$footer_items = array(
			'courses' => __( 'Courses', 'atlas-relics-core' ),
			'books'   => __( 'Books', 'atlas-relics-core' ),
			'shop'    => __( 'Shop', 'atlas-relics-core' ),
			'contact' => __( 'Contact', 'atlas-relics-core' ),
		);
		self::fill_menu( 'footer', __( 'Footer catalog', 'atlas-relics-core' ), $footer_items, 'footer' );
	}

	/**
	 * Create a menu and assign it to a location if the theme registers one.
	 *
	 * @param string               $slug  Menu slug.
	 * @param string               $name  Menu name.
	 * @param array<string,string> $items Slug => label.
	 * @param string               $location Theme location.
	 */
	private static function fill_menu( $slug, $name, $items, $location ) {
		$menu = wp_get_nav_menu_object( $slug );
		if ( ! $menu ) {
			$menu_id = wp_create_nav_menu( $name );
		} else {
			$menu_id = (int) $menu->term_id;
		}

		$existing = wp_get_nav_menu_items( $menu_id );
		if ( $existing ) {
			foreach ( $existing as $item ) {
				wp_delete_post( (int) $item->ID, true );
			}
		}

		$position = 1;
		foreach ( $items as $page_slug => $label ) {
			$page = get_page_by_path( $page_slug );
			if ( ! $page ) {
				continue;
			}
			wp_update_nav_menu_item(
				$menu_id,
				0,
				array(
					'menu-item-title'     => $label,
					'menu-item-object'    => 'page',
					'menu-item-object-id' => $page->ID,
					'menu-item-type'      => 'post_type',
					'menu-item-status'    => 'publish',
					'menu-item-position'  => $position,
				)
			);
			++$position;
		}

		$locations              = get_theme_mod( 'nav_menu_locations' );
		$locations              = is_array( $locations ) ? $locations : array();
		$locations[ $location ] = $menu_id;
		set_theme_mod( 'nav_menu_locations', $locations );
	}

	/**
	 * Block theme navigation post used by the Site Editor header.
	 */
	private static function create_block_navigation() {
		$spec = array(
			'about'            => __( 'About', 'atlas-relics-core' ),
			'conscious-mirror' => __( 'Conscious Mirror', 'atlas-relics-core' ),
			'the-caves'        => __( 'The Caves', 'atlas-relics-core' ),
			'pattern-map'      => __( 'Pattern Map', 'atlas-relics-core' ),
			'shop'             => __( 'Shop', 'atlas-relics-core' ),
			'readings'         => __( 'Readings', 'atlas-relics-core' ),
			'journal'          => __( 'Journal', 'atlas-relics-core' ),
		);

		$inner = '';
		foreach ( $spec as $slug => $label ) {
			$page = get_page_by_path( $slug );
			if ( ! $page ) {
				continue;
			}
			$attrs = wp_json_encode(
				array(
					'label' => $label,
					'type'  => 'page',
					'id'    => (int) $page->ID,
					'url'   => get_permalink( $page ),
					'kind'  => 'post-type',
				)
			);
			$inner .= sprintf( '<!-- wp:navigation-link %s /-->', $attrs );
		}

		$existing = get_posts(
			array(
				'post_type'      => 'wp_navigation',
				'name'           => 'atlas-relics-primary',
				'posts_per_page' => 1,
				'post_status'    => 'any',
			)
		);

		$data = array(
			'post_title'   => __( 'Primary', 'atlas-relics-core' ),
			'post_name'    => 'atlas-relics-primary',
			'post_status'  => 'publish',
			'post_type'    => 'wp_navigation',
			'post_content' => $inner,
		);

		if ( $existing ) {
			$data['ID'] = $existing[0]->ID;
			wp_update_post( wp_slash( $data ) );
		} else {
			wp_insert_post( wp_slash( $data ), true );
		}
	}

	/**
	 * Front page and posts page.
	 */
	private static function assign_front() {
		$home    = get_page_by_path( 'home' );
		$journal = get_page_by_path( 'journal' );
		if ( $home ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', $home->ID );
		}
		if ( $journal ) {
			update_option( 'page_for_posts', $journal->ID );
		}

		$shop = get_page_by_path( 'shop' );
		if ( $shop && function_exists( 'wc_get_page_id' ) ) {
			update_option( 'woocommerce_shop_page_id', $shop->ID );
		}
	}

	/**
	 * Create or update a post by slug.
	 *
	 * @param string $type    Post type.
	 * @param string $slug    Slug.
	 * @param string $title   Title.
	 * @param string $content Content.
	 * @return int
	 */
	private static function upsert_post( $type, $slug, $title, $content ) {
		$existing = get_page_by_path( $slug, OBJECT, $type );
		$data     = array(
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_status'  => 'publish',
			'post_type'    => $type,
			'post_content' => $content,
		);

		if ( $existing ) {
			$data['ID'] = $existing->ID;
			return (int) wp_update_post( wp_slash( $data ) );
		}

		return (int) wp_insert_post( wp_slash( $data ), true );
	}

	/**
	 * Attach a theme SVG as featured image when possible.
	 *
	 * @param int    $product_id Product ID.
	 * @param string $filename   Theme image filename.
	 */
	private static function maybe_attach_cover( $product_id, $filename ) {
		if ( get_post_thumbnail_id( $product_id ) ) {
			return;
		}

		$path = get_template_directory() . '/assets/images/' . $filename;
		if ( ! file_exists( $path ) ) {
			return;
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$tmp = wp_tempnam( $filename );
		if ( ! $tmp ) {
			return;
		}
		copy( $path, $tmp );

		$file_array = array(
			'name'     => $filename,
			'tmp_name' => $tmp,
		);

		add_filter( 'upload_mimes', array( __CLASS__, 'allow_svg_upload' ) );
		$id = media_handle_sideload( $file_array, $product_id );
		remove_filter( 'upload_mimes', array( __CLASS__, 'allow_svg_upload' ) );

		if ( ! is_wp_error( $id ) ) {
			set_post_thumbnail( $product_id, $id );
		} elseif ( file_exists( $tmp ) ) {
			wp_delete_file( $tmp );
		}
	}

	/**
	 * Allow SVG only during demo cover import.
	 *
	 * @param array $mimes Mimes.
	 * @return array
	 */
	public static function allow_svg_upload( $mimes ) {
		$mimes['svg'] = 'image/svg+xml';
		return $mimes;
	}

	/**
	 * Privacy copy.
	 *
	 * @return string
	 */
	private static function privacy_content() {
		return '<!-- wp:paragraph --><p>Atlas Relics collects the information you type into forms and the information WooCommerce needs to complete an order. That usually means name, email, address for shipments, and payment confirmation handled by your chosen gateway.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>We use that information to fulfill orders, deliver downloads, reply to inquiries, and schedule readings. We do not sell it. Hosting, email, and payment processors will see what they must see to do their jobs.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>You can ask for a copy of what we hold, or ask us to delete reading-request records that are no longer needed, by writing to the inquiry inbox. Order records follow WooCommerce and tax rules.</p><!-- /wp:paragraph -->';
	}

	/**
	 * Terms copy.
	 *
	 * @return string
	 */
	private static function terms_content() {
		return '<!-- wp:paragraph --><p>By buying from this catalog you agree that digital goods are licensed for your personal use, that readings are reflective conversations rather than professional clinical or legal services, and that product copy describes objects and practices rather than guaranteed outcomes.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Account access, payment, tax, and shipping are handled by WooCommerce under the settings of this site. If a listing is described as a sample or staging object, do not treat it as a live offer.</p><!-- /wp:paragraph -->';
	}

	/**
	 * Refunds copy.
	 *
	 * @return string
	 */
	private static function refunds_content() {
		return '<!-- wp:paragraph --><p>Print books may be returned unused within fourteen days of delivery. Digital downloads can be refunded if the file cannot be opened, or if you have not downloaded it. Once a download is retrieved, we generally do not refund it, because the object has already been copied.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Unread session credits can be refunded before a time is confirmed. After a session begins, the credit is used.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Write to the inquiry inbox with your order number. Refunds run through the original payment gateway.</p><!-- /wp:paragraph -->';
	}

	/**
	 * Sample journal essay.
	 *
	 * @return string
	 */
	private static function journal_content() {
		$p1 = __( 'Most maps of the mind pretend it is one lighted room. You walk in, you look around, you leave with a conclusion. Anyone who has sat still for more than a few minutes knows that is not the floor plan.', 'atlas-relics-core' );
		$p2 = __( 'There is the room of ordinary waking, with its errands and its reliable furniture. There is sleep, which erases the furniture and somehow returns you to the same name. There is the quieter attention that notices thought without becoming it. Older literature already had words for these chambers. Psychology added others. The useful work is not to crown one language. It is to stop mistaking the hallway for the whole house.', 'atlas-relics-core' );
		$p3 = __( 'Atlas Relics is built on that suspicion. The catalog is a set of objects you can actually hold: a notebook, a sequence of audio, a conversation with a clock on it. None of them finish the inner life. They make it a little harder to lie about the layout.', 'atlas-relics-core' );

		return '<!-- wp:paragraph --><p>' . esc_html( $p1 ) . '</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>' . esc_html( $p2 ) . '</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>' . esc_html( $p3 ) . '</p><!-- /wp:paragraph -->';
	}
}
