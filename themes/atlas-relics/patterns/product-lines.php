<?php
/**
 * Title: Product lines
 * Slug: atlas-relics/product-lines
 * Categories: atlas-relics
 * Viewport Width: 1400
 */
$uri = get_template_directory_uri();
?>
<!-- wp:group {"tagName":"section","align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<section class="wp-block-group alignwide">
	<!-- wp:group {"align":"wide","layout":{"type":"constrained","justifyContent":"left","contentSize":"40rem"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:paragraph {"className":"ar-kicker","style":{"color":{"text":"var:preset|color|gold-dark"}}} -->
		<p class="ar-kicker has-text-color">Three named lines</p>
		<!-- /wp:paragraph -->
		<!-- wp:heading -->
		<h2 class="wp-block-heading">Conscious Mirror, The Caves, and Pattern Map.</h2>
		<!-- /wp:heading -->
		<!-- wp:paragraph -->
		<p>Courses, readings, books, and digital tools sit beside them. All of it belongs to Atlas Relics.</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|40"},"margin":{"top":"var:preset|spacing|50"}}}} -->
	<div class="wp-block-columns alignwide">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"ar-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
			<div class="wp-block-group ar-card">
				<!-- wp:image {"sizeSlug":"full","linkDestination":"none"} -->
				<figure class="wp-block-image size-full"><img src="<?php echo esc_url( $uri . '/assets/images/conscious-mirror.svg' ); ?>" alt="Nested frames suggesting a looking glass."/></figure>
				<!-- /wp:image -->
				<!-- wp:heading {"level":3} -->
				<h3 class="wp-block-heading"><a href="/conscious-mirror/">Conscious Mirror</a></h3>
				<!-- /wp:heading -->
				<!-- wp:paragraph -->
				<p>A practice of noticing how inner life appears in outer circumstance. Journals, decks, and quiet exercises for watching the mind without turning it into a problem to be solved.</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"ar-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
			<div class="wp-block-group ar-card">
				<!-- wp:image {"sizeSlug":"full","linkDestination":"none"} -->
				<figure class="wp-block-image size-full"><img src="<?php echo esc_url( $uri . '/assets/images/the-caves.svg' ); ?>" alt="Nested arches suggesting inner chambers."/></figure>
				<!-- /wp:image -->
				<!-- wp:heading {"level":3} -->
				<h3 class="wp-block-heading"><a href="/the-caves/">The Caves</a></h3>
				<!-- /wp:heading -->
				<!-- wp:paragraph -->
				<p>Guided descent into older rooms of the psyche. Audio, writing, and study sequences for sitting with what is usually hurried past, at a human pace.</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"ar-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
			<div class="wp-block-group ar-card">
				<!-- wp:image {"sizeSlug":"full","linkDestination":"none"} -->
				<figure class="wp-block-image size-full"><img src="<?php echo esc_url( $uri . '/assets/images/pattern-map.svg' ); ?>" alt="A spare grid with a few connected points."/></figure>
				<!-- /wp:image -->
				<!-- wp:heading {"level":3} -->
				<h3 class="wp-block-heading"><a href="/pattern-map/">Pattern Map</a></h3>
				<!-- /wp:heading -->
				<!-- wp:paragraph -->
				<p>A way of drawing repeating shapes in thought, relationship, and choice. Workbooks and sessions that help you see a pattern. They do not name you with a diagnosis.</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</section>
<!-- /wp:group -->
