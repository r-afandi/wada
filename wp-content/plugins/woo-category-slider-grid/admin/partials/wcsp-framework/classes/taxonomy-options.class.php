<?php

/**
 * Framework taxonomy-options.class file.
 *
 * @link       https://shapedplugin.com/
 * @since      1.0.0
 * @package    Woo_Category_Slider
 * @subpackage Woo_Category_Slider/framework
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

if ( ! defined( 'ABSPATH' ) ) {
	die; } // Cannot access directly.

if ( ! class_exists( 'SP_WCS_Taxonomy_Options' ) ) {
	/**
	 *
	 * Taxonomy Options Class
	 *
	 * @since 1.0.0
	 * @version 1.0.0
	 */
	class SP_WCS_Taxonomy_Options extends SP_WCS_Abstract {

		/**
		 * Unique
		 *
		 * @var string
		 */
		public $unique = '';
		/**
		 * Taxonomy
		 *
		 * @var string
		 */
		public $taxonomy = '';
		/**
		 * Abstract
		 *
		 * @var string
		 */
		public $abstract = 'taxonomy';
		/**
		 * Sections
		 *
		 * @var array
		 */
		public $sections = array();
		/**
		 * Taxonomies
		 *
		 * @var array
		 */
		public $taxonomies = array();
		/**
		 * Default Arguments.
		 *
		 * @var array
		 */
		public $args = array(
			'taxonomy'  => '',
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

			$this->unique     = $key;
			$this->args       = apply_filters( "spf_{$this->unique}_args", wp_parse_args( $params['args'], $this->args ), $this );
			$this->sections   = apply_filters( "spf_{$this->unique}_sections", $params['sections'], $this );
			$this->taxonomies = ( is_array( $this->args['taxonomy'] ) ) ? $this->args['taxonomy'] : array_filter( (array) $this->args['taxonomy'] );
			$this->taxonomy   = spf_get_var( 'taxonomy' );

			if ( ! empty( $this->taxonomies ) && in_array( $this->taxonomy, $this->taxonomies ) ) {
				add_action( 'admin_init', array( &$this, 'add_taxonomy_options' ) );
			}

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
		 * Add taxonomy add/edit fields.
		 *
		 * @return void
		 */
		public function add_taxonomy_options() {

			add_action( $this->taxonomy . '_add_form_fields', array( &$this, 'render_taxonomy_form_fields' ) );
			add_action( $this->taxonomy . '_edit_form', array( &$this, 'render_taxonomy_form_fields' ) );

			add_action( 'created_' . $this->taxonomy, array( &$this, 'save_taxonomy' ) );
			add_action( 'edited_' . $this->taxonomy, array( &$this, 'save_taxonomy' ) );

		}

		/**
		 * Get default value.
		 *
		 * @param array $field field name.
		 * @return array
		 */
		public function get_default( $field ) {

			$default = ( isset( $this->args['defaults'][ $field['id'] ] ) ) ? $this->args['defaults'][ $field['id'] ] : '';
			$default = ( isset( $field['default'] ) ) ? $field['default'] : $default;

			return $default;

		}

		/**
		 * Get default value.
		 *
		 * @param int   $term_id term id.
		 * @param array $field option field.
		 * @return statement
		 */
		public function get_meta_value( $term_id, $field ) {

			$value = '';

			if ( ! empty( $term_id ) && ! empty( $field['id'] ) ) {

				if ( 'serialize' !== $this->args['data_type'] ) {
					$meta  = get_term_meta( $term_id, $field['id'] );
					$value = ( isset( $meta[0] ) ) ? $meta[0] : null;
				} else {
					$meta  = get_term_meta( $term_id, $this->unique, true );
					$value = ( isset( $meta[ $field['id'] ] ) ) ? $meta[ $field['id'] ] : null;
				}

				$default = $this->get_default( $field );
				$value   = ( isset( $value ) ) ? $value : $default;

			}

			return $value;

		}

		/**
		 * Render taxonomy add/edit form fields.
		 *
		 * @param object $term add term.
		 * @return void
		 */
		public function render_taxonomy_form_fields( $term ) {

			$is_term   = ( is_object( $term ) && isset( $term->taxonomy ) ) ? true : false;
			$term_id   = ( $is_term ) ? $term->term_id : 0;
			$taxonomy  = ( $is_term ) ? $term->taxonomy : $term;
			$classname = ( $is_term ) ? 'edit' : 'add';
			$errors    = ( ! empty( $term_id ) ) ? get_term_meta( $term_id, '_spf_errors', true ) : array();
			$errors    = ( ! empty( $errors ) ) ? $errors : array();

			// clear errors.
			if ( ! empty( $errors ) ) {
				delete_term_meta( $term_id, '_spf_errors' );
			}

			echo '<div class="spf spf-taxonomy spf-taxonomy-' . esc_attr( $classname ) . '-fields spf-show-all spf-onload">';

			wp_nonce_field( 'spf_taxonomy_nonce', 'spf_taxonomy_nonce' );

			foreach ( $this->sections as $section ) {

				if ( $taxonomy === $this->taxonomy ) {

					$section_icon  = ( ! empty( $section['icon'] ) ) ? '<i class="spf-icon ' . $section['icon'] . '"></i>' : '';
					$section_title = ( ! empty( $section['title'] ) ) ? $section['title'] : '';

					echo ( $section_title || $section_icon ) ? '<div class="spf-section-title"><h3>' . wp_kses_post( $section_icon . $section_title ) . '</h3></div>' : '';

					if ( ! empty( $section['fields'] ) ) {
						foreach ( $section['fields'] as $field ) {

							if ( ! empty( $field['id'] ) && ! empty( $errors[ $field['id'] ] ) ) {
								$field['_error'] = $errors[ $field['id'] ];
							}

							SP_WCS::field( $field, $this->get_meta_value( $term_id, $field ), $this->unique, 'taxonomy' );

						}
					}
				}
			}

			echo '</div>';

		}

		/**
		 * Save taxonomy form fields.
		 *
		 * @param int $term_id term id.
		 * @return void
		 */
		public function save_taxonomy( $term_id ) {

			if ( wp_verify_nonce( spf_get_var( 'spf_taxonomy_nonce' ), 'spf_taxonomy_nonce' ) ) {

				$errors   = array();
				$taxonomy = spf_get_var( 'taxonomy' );

				foreach ( $this->sections as $section ) {

					if ( $taxonomy === $this->taxonomy ) {

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
											$request[ $field['id'] ] = $this->get_meta_value( $term_id, $field );

										}
									}

									// auto sanitize.
									if ( ! isset( $request[ $field['id'] ] ) || is_null( $request[ $field['id'] ] ) ) {
										$request[ $field['id'] ] = '';
									}
								}
							}
						}

						$request = apply_filters( "spf_{$this->unique}_save", $request, $term_id, $this );

						do_action( "spf_{$this->unique}_save_before", $request, $term_id, $this );

						if ( empty( $request ) ) {

							if ( 'serialize' !== $this->args['data_type'] ) {
								foreach ( $request as $key => $value ) {
									delete_term_meta( $term_id, $key );
								}
							} else {
								delete_term_meta( $term_id, $this->unique );
							}
						} else {

							if ( 'serialize' !== $this->args['data_type'] ) {
								foreach ( $request as $key => $value ) {
									update_term_meta( $term_id, $key, $value );
								}
							} else {
								update_term_meta( $term_id, $this->unique, $request );
							}

							if ( ! empty( $errors ) ) {
								update_term_meta( $term_id, '_spf_errors', $errors );
							}
						}

						do_action( "spf_{$this->unique}_saved", $request, $term_id, $this );

						do_action( "spf_{$this->unique}_save_after", $request, $term_id, $this );

					}
				}
			}

		}

	}
}
