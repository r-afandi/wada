<?php
/**
 * The Free Loader Class
 *
 * @package Woo-category-slider
 *
 * @since 1.0
 */

/**
 * WPL_WCS_Free_Loader class
 */
class WPL_WCS_Free_Loader {

	/**
	 * Construct function.
	 */
	public function __construct() {
		require_once WPL_WCS_PATH . 'admin/views/scripts.php';
		require_once WPL_WCS_PATH . 'public/views/shortcoderender.php';
		require_once WPL_WCS_PATH . 'public/views/scripts.php';
	}

}

new WPL_WCS_Free_Loader();
