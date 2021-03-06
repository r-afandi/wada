jQuery( document ).ready( function( $ ) {
	$("#woocommerce-exporter-columns").select2({ });
	$("#woocommerce-exporter-types").select2({ });
} );


/*global ajaxurl, wc_product_export_params */
;(function ( $, window ) {
	/**
	 * productExportForm handles the export process.
	 */
	var productExportForm = function( $form ) {
		this.$form = $form;
		this.xhr   = false;

		// Initial state.
		this.$form.find('.woocommerce-exporter-progress').val( 0 );

		// Methods.
		this.processStep = this.processStep.bind( this );

		// Events.
		$form.on( 'submit', { productExportForm: this }, this.onSubmit );
	};

	/**
	 * Handle export form submission.
	 */
	productExportForm.prototype.onSubmit = function( event ) {
		event.preventDefault();
		event.data.productExportForm.$form.addClass( 'woocommerce-exporter__exporting' );
		event.data.productExportForm.$form.find('.woocommerce-exporter-progress').val( 0 );
		event.data.productExportForm.$form.find('.woocommerce-exporter-button').prop( 'disabled', true );
		event.data.productExportForm.processStep( 1, $( this ).serialize(), '' );
	};

	/**
	 * Process the current export step.
	 */
	productExportForm.prototype.processStep = function( step, data, columns ) {
		var $this = this,
			selected_columns = $( '.woocommerce-exporter-columns' ).val(),
			export_meta      = $( '#woocommerce-exporter-meta:checked' ).length ? 1 : 0,
			export_types     = $( '.woocommerce-exporter-types' ).val();
			
		$('#wcfm_products_export_expander').block({
			message: null,
			overlayCSS: {
				background: '#fff',
				opacity: 0.6
			}
		});

		$.ajax( {
			type: 'POST',
			url: wcfm_params.ajax_url,
			data: {
				form             : data,
				action           : 'woocommerce_do_ajax_product_export',
				step             : step,
				columns          : columns,
				selected_columns : selected_columns,
				export_meta      : export_meta,
				export_types     : export_types,
				security         : wc_product_export_params.export_nonce,
				wcfm_ajax_nonce  : wcfm_params.wcfm_ajax_nonce
			},
			dataType: 'json',
			success: function( response ) {
				if ( response.success ) {
					if ( 'done' === response.data.step ) {
						$this.$form.find('.woocommerce-exporter-progress').val( response.data.percentage );
						window.location = response.data.url;
						setTimeout( function() {
							$this.$form.removeClass( 'woocommerce-exporter__exporting' );
							$this.$form.find('.woocommerce-exporter-button').prop( 'disabled', false );
						}, 2000 );
					} else {
						$this.$form.find('.woocommerce-exporter-progress').val( response.data.percentage );
						$this.processStep( parseInt( response.data.step, 10 ), data, response.data.columns );
					}
				}
				setTimeout( function() {
					$('#wcfm_products_export_expander').unblock();
				}, 5000 );
			}
		} ).fail( function( response ) {
			window.console.log( response );
			$('#wcfm_products_export_expander').unblock();
		} );
	};

	/**
	 * Function to call productExportForm on jquery selector.
	 */
	$.fn.wc_product_export_form = function() {
		new productExportForm( this );
		return this;
	};

	$( '.woocommerce-exporter' ).wc_product_export_form();

})( jQuery, window );
