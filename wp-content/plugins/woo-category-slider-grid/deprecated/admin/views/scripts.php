<?php

/**
 * The scripts Class.
 *
 * @link       https://shapedplugin.com/
 * @since      1.1.0
 *
 * @package    Woo_Category_Slider
 * @subpackage Woo_Category_Slider/includes
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}  // if direct access

/**
 * Scripts and styles
 */
class WPL_WCS_Admin_Scripts {

	/**
	 * Instance
	 *
	 * @var null
	 * @since 1.0
	 */
	protected static $_instance = null;

	/**
	 * Initialize
	 *
	 * @return WPL_WCS_Admin_Scripts
	 * @since 1.0
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}

		return self::$_instance;
	}

	/**
	 * Initialize the class
	 */
	public function __construct() {

		add_action( 'admin_enqueue_scripts', array( $this, 'admin_scripts' ) );
	}

	/**
	 * Enqueue admin scripts and styles
	 */
	public function admin_scripts() {
		wp_enqueue_style( 'wpl-wcs-admin', WPL_WCS_URL . 'admin/assets/css/admin.css', array(), WPL_WCS_VERSION );
	}

}

new WPL_WCS_Admin_Scripts();
