<?php
/**
 * Title: Pattern Map landing
 * Slug: atlas-relics/pattern-map
 * Categories: atlas-relics
 * Block Types: core/post-content
 */
$uri = get_template_directory_uri();
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"backgroundColor":"navy","textColor":"ivory","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-ivory-color has-navy-background-color has-text-color has-background">
	<!-- wp:paragraph {"className":"ar-kicker"} -->
	<p class="ar-kicker">Product line</p>
	<!-- /wp:paragraph -->
	<!-- wp:heading {"level":1} -->
	<h1 class="wp-block-heading">Pattern Map</h1>
	<!-- /wp:heading -->
	<!-- wp:paragraph {"fontSize":"large"} -->
	<p class="has-large-font-size">A life repeats. The useful question is not “what is wrong with me,” but “what shape keeps returning, and what does it cost?”</p>
	<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|70"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
	<!-- wp:image {"sizeSlug":"full"} -->
	<figure class="wp-block-image size-full"><img src="<?php echo esc_url( $uri . '/assets/images/pattern-map.svg' ); ?>" alt="Cartographic grid with connected points."/></figure>
	<!-- /wp:image -->
	<!-- wp:paragraph -->
	<p>Pattern Map is a workbook and session line for drawing those shapes. You might notice a relational loop, a way of abandoning a project, or a private rule that once kept you safe and now keeps you small. Naming the pattern is not the same as being named by it.</p>
	<!-- /wp:paragraph -->
	<!-- wp:paragraph -->
	<p>Nothing here is a clinical instrument. If you need assessment or treatment, that belongs with a licensed practitioner. What this line offers is a careful map you can hold in your own hands.</p>
	<!-- /wp:paragraph -->
	<!-- wp:buttons -->
	<div class="wp-block-buttons">
		<!-- wp:button -->
		<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/product-category/pattern-map/">See Pattern Map objects</a></div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
