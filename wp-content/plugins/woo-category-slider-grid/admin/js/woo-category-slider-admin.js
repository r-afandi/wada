jQuery(document).ready(function ($) {

    /**
     * Admin Preloader.
     */
    $(".sp_wcsp_shortcode_generator .spf-wrapper").css("visibility", "hidden");
    $(".sp_wcsp_shortcode_generator .spf-wrapper").css("visibility", "visible");
    $(".sp_wcsp_shortcode_generator .spf-wrapper .spf-nav-metabox li").css("opacity", 1);

});
// Gallery Slider plugin notice
jQuery(document).on('click', '.post-type-sp_wcslider .woogs-notice .notice-dismiss', function () {
    jQuery.ajax({
        url: ajaxurl,
        data: {
            action: 'dismiss_woo_gallery_slider_notice'
        }
    })
});