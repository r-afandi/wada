<?php

/**
 * Framework options.class file.
 *
 * @link       https://shapedplugin.com/
 * @since      1.0.0
 * @package    Woo_Category_Slider
 * @subpackage Woo_Category_Slider/framework
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

if ( ! defined( 'ABSPATH' ) ) {
	die; } // Cannot access directly.

if ( ! class_exists( 'SP_WCS_Profile_Options' ) ) {
	/**
	 *
	 * Profile Options Class
	 *
	 * @since 1.0.0
	 * @version 1.0.0
	 */
	class SP_WCS_Profile_Options extends SP_WCS_Abstract {

		/**
		 * Unique
		 *
		 * @var string
		 */
		public $unique = '';
		/**
		 * Abstract
		 *
		 * @var string
		 */
		public $abstract = 'profile';
		/**
		 * Sections
		 *
		 * @var array
		 */
		public $sections = array();
		/**
		 * Default Arguments.
		 *
		 * @var array
		 */
		public $args = array(
			'data_type' => 'serialize',
			'defaults'  => array(),
		);

		/**
		 * Run framework construct.
		 *
		 * @param  mixed $key key.
		 * @param  mixed $params params.
		 * @return void
		 */
		public function __construct( $key, $params ) {

			$this->unique   = $key;
			$this->args     = apply_filters( "spf_{$this->unique}_args", wp_parse_args( $params['args'], $this->args ), $this );
			$this->sections = apply_filters( "spf_{$this->unique}_sections", $params['sections'], $this );

			add_action( 'admin_init', array( &$this, 'add_profile_options' ) );

		}

		/**
		 * Instance
		 *
		 * @param  mixed $key key.
		 * @param  mixed $params params.
		 * @return statement
		 */
		public static function instance( $key, $params ) {
			return new self( $key, $params );
		}

		/**
		 * Add profile add/edit fields
		 *
		 * @return void
		 */
		public function add_profile_options() {

			add_action( 'show_user_profile', array( &$this, 'render_profile_form_fields' ) );
			add_action( 'edit_user_profile', array( &$this, 'render_profile_form_fields' ) );

			add_action( 'personal_options_update', array( &$this, 'save_profile' ) );
			add_action( 'edit_user_profile_update', array( &$this, 'save_profile' ) );

		}

		/**
		 * Get default value
		 *
		 * @param  mixed $field field.
		 * @return mixed
		 */
		public function get_default( $field ) {

			$default = ( isset( $this->args['defaults'][ $field['id'] ] ) ) ? $this->args['defaults'][ $field['id'] ] : '';
			$default = ( isset( $field['default'] ) ) ? $field['default'] : $default;

			return $default;

		}

		/**
		 * Get meta value.
		 *
		 * @param string $user_id User id.
		 * @param array  $field The field.
		 * @return statement
		 */
		public function get_meta_value( $user_id, $field ) {

			$value = '';

			if ( ! empty( $user_id ) && ! empty( $field['id'] ) ) {

				if ( 'serialize' !== $this->args['data_type'] ) {
					$meta  = get_user_meta( $user_id, $field['id'] );
					$value = ( isset( $meta[0] ) ) ? $meta[0] : null;
				} else {
					$meta  = get_user_meta( $user_id, $this->unique, true );
					$value = ( isset( $meta[ $field['id'] ] ) ) ? $meta[ $field['id'] ] : null;
				}

				$default = $this->get_default( $field );
				$value   = ( isset( $value ) ) ? $value : $default;

			}

			return $value;

		}

		/**
		 * Render profile add/edit form fields.
		 *
		 * @param object $profileuser user profile.
		 * @return void
		 */
		public function render_profile_form_fields( $profileuser ) {

			$is_profile = ( is_object( $profileuser ) && isset( $profileuser->ID ) ) ? true : false;
			$profile_id = ( $is_profile ) ? $profileuser->ID : 0;
			$errors     = ( ! empty( $profile_id ) ) ? get_user_meta( $profile_id, '_spf_errors', true ) : array();
			$errors     = ( ! empty( $errors ) ) ? $errors : array();

			// clear errors.
			if ( ! empty( $errors ) ) {
				delete_user_meta( $profile_id, '_spf_errors' );
			}

			echo '<div class="spf spf-profile spf-onload">';

			wp_nonce_field( 'spf_profile_nonce', 'spf_profile_nonce' );

			foreach ( $this->sections as $section ) {

				$section_icon  = ( ! empty( $section['icon'] ) ) ? '<i class="spf-icon ' . $section['icon'] . '"></i>' : '';
				$section_title = ( ! empty( $section['title'] ) ) ? $section['title'] : '';

				echo ( $section_title || $section_icon ) ? '<h2>' . wp_kses_post( $section_icon . $section_title ) . '</h2>' : '';

				if ( ! empty( $section['fields'] ) ) {
					foreach ( $section['fields'] as $field ) {

						if ( ! empty( $field['id'] ) && ! empty( $errors[ $field['id'] ] ) ) {
							$field['_error'] = $errors[ $field['id'] ];
						}

						SP_WCS::field( $field, $this->get_meta_value( $profile_id, $field ), $this->unique, 'profile' );

					}
				}
			}

			echo '</div>';

		}

		/**
		 * Save profile form fields.
		 *
		 * @param  string $user_id User id.
		 * @return void
		 */
		public function save_profile( $user_id ) {

			if ( wp_verify_nonce( spf_get_var( 'spf_profile_nonce' ), 'spf_profile_nonce' ) ) {

				$errors = array();

				foreach ( $this->sections as $section ) {

					$request = spf_get_var( $this->unique, array() );

					// ignore _nonce.
					if ( isset( $request['_nonce'] ) ) {
						unset( $request['_nonce'] );
					}

					// sanitize and validate.
					if ( ! empty( $section['fields'] ) ) {

						foreach ( $section['fields'] as $field ) {

							if ( ! empty( $field['id'] ) ) {

								// sanitize.
								if ( ! empty( $field['sanitize'] ) ) {

									$sanitize                = $field['sanitize'];
									$value_sanitize          = spf_get_vars( $this->unique, $field['id'] );
									$request[ $field['id'] ] = call_user_func( $sanitize, $value_sanitize );

								}

								// validate.
								if ( ! empty( $field['validate'] ) ) {

									$validate       = $field['validate'];
									$value_validate = spf_get_vars( $this->unique, $field['id'] );
									$has_validated  = call_user_func( $validate, $value_validate );

									if ( ! empty( $has_validated ) ) {

										$errors[ $field['id'] ]  = $has_validated;
										$request[ $field['id'] ] = $this->get_meta_value( $user_id, $field );

									}
								}

								// auto sanitize.
								if ( ! isset( $request[ $field['id'] ] ) || is_null( $request[ $field['id'] ] ) ) {
									$request[ $field['id'] ] = '';
								}
							}
						}
					}

					$request = apply_filters( "spf_{$this->unique}_save", $request, $user_id, $this );

					do_action( "spf_{$this->unique}_save_before", $request, $user_id, $this );

					if ( empty( $request ) ) {

						if ( 'serialize' !== $this->args['data_type'] ) {
							foreach ( $request as $key => $value ) {
								delete_user_meta( $user_id, $key );
							}
						} else {
							delete_user_meta( $user_id, $this->unique );
						}
					} else {

						if ( 'serialize' !== $this->args['data_type'] ) {
							foreach ( $request as $key => $value ) {
								update_user_meta( $user_id, $key, $value );
							}
						} else {
							update_user_meta( $user_id, $this->unique, $request );
						}

						if ( ! empty( $errors ) ) {
							update_user_meta( $user_id, '_spf_errors', $errors );
						}
					}

					do_action( "spf_{$this->unique}_saved", $request, $user_id, $this );

					do_action( "spf_{$this->unique}_save_after", $request, $user_id, $this );

				}
			}

		}

	}
}
