<?php
/**
 * The framework customize file.
 *
 * @link       https://shapedplugin.com/
 * @since      1.0.0
 * @package    Woo_Category_Slider
 * @subpackage Woo_Category_Slider/framework
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

if ( ! defined( 'ABSPATH' ) ) {
	die;
} // Cannot access directly.

if ( ! class_exists( 'WP_Customize_Panel_SP_WCS' ) && class_exists( 'WP_Customize_Panel' ) ) {
	/**
	 *
	 * WP Customize custom panel
	 *
	 * @since 1.0.0
	 * @version 1.0.0
	 */
	class WP_Customize_Panel_SP_WCS extends WP_Customize_Panel {
		/**
		 * Type
		 *
		 * @var string
		 */
		public $type = 'spf';
	}
}

if ( ! class_exists( 'WP_Customize_Section_SP_WCS' ) && class_exists( 'WP_Customize_Section' ) ) {
	/**
	 *
	 * WP Customize custom section
	 *
	 * @since 1.0.0
	 * @version 1.0.0
	 */
	class WP_Customize_Section_SP_WCS extends WP_Customize_Section {
		/**
		 * Type
		 *
		 * @var string
		 */
		public $type = 'spf';
	}
}

if ( ! class_exists( 'WP_Customize_Control_SP_WCS' ) && class_exists( 'WP_Customize_Control' ) ) {
	/**
	 *
	 * WP Customize custom control
	 *
	 * @since 1.0.0
	 * @version 1.0.0
	 */
	class WP_Customize_Control_SP_WCS extends WP_Customize_Control {
		/**
		 * Type
		 *
		 * @var string
		 */
		public $type = 'spf';
		/**
		 * Field
		 *
		 * @var string
		 */
		public $field = '';
		/**
		 * Unique
		 *
		 * @var string
		 */
		public $unique = '';

		/**
		 * Render function
		 *
		 * @return void
		 */
		protected function render() {

			$depend = '';
			$hidden = '';

			if ( ! empty( $this->field['dependency'] ) ) {
				$hidden  = ' spf-dependency-control hidden';
				$depend .= ' data-controller="' . $this->field['dependency'][0] . '"';
				$depend .= ' data-condition="' . $this->field['dependency'][1] . '"';
				$depend .= ' data-value="' . $this->field['dependency'][2] . '"';
			}

			$id    = 'customize-control-' . str_replace( array( '[', ']' ), array( '-', '' ), $this->id );
			$class = 'customize-control customize-control-' . $this->type . $hidden;

			echo '<li id="' . esc_attr( $id ) . '" class="' . esc_attr( $class ) . '"' . wp_kses_post( $depend ) . '>';
			$this->render_content();
			echo '</li>';

		}

		/**
		 * Render content function.
		 *
		 * @return void
		 */
		public function render_content() {

			$complex = array(
				'accordion',
				'background',
				'backup',
				'border',
				'button_set',
				'checkbox',
				'color_group',
				'date',
				'dimensions',
				'fieldset',
				'group',
				'image_select',
				'link_color',
				'media',
				'palette',
				'repeater',
				'sortable',
				'sorter',
				'switcher',
				'tabbed',
				'typography',
			);

			$field_id   = ( ! empty( $this->field['id'] ) ) ? $this->field['id'] : '';
			$custom     = ( ! empty( $this->field['customizer'] ) ) ? true : false;
			$is_complex = ( in_array( $this->field['type'], $complex, true ) ) ? true : false;
			$class      = ( $is_complex || $custom ) ? ' spf-customize-complex' : '';
			$atts       = ( $is_complex || $custom ) ? ' data-unique-id="' . $this->unique . '" data-option-id="' . $field_id . '"' : '';

			if ( ! $is_complex && ! $custom ) {
				$this->field['attributes']['data-customize-setting-link'] = $this->settings['default']->id;
			}

			$this->field['name'] = $this->settings['default']->id;

			$this->field['dependency'] = array();

			echo '<div class="spf-customize-field' . esc_attr( $class ) . '"' . wp_kses_post( $atts ) . '>';

			SP_WCS::field( $this->field, $this->value(), $this->unique, 'customize' );

			echo '</div>';

		}

	}
}
