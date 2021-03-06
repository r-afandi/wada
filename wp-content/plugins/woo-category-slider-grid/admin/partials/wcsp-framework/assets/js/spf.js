/**
 *
 * -----------------------------------------------------------
 *
 * ShapedPlugin
 *
 * -----------------------------------------------------------
 *
 */
; (function ($, window, document, undefined) {
  'use strict';

  //
  // Constants
  //
  var SP_WCS = SP_WCS || {};

  SP_WCS.funcs = {};

  SP_WCS.vars = {
    onloaded: false,
    $body: $('body'),
    $window: $(window),
    $document: $(document),
    is_rtl: $('body').hasClass('rtl'),
    code_themes: [],
  };

  //
  // Helper Functions
  //
  SP_WCS.helper = {

    //
    // Generate UID
    //
    uid: function (prefix) {
      return (prefix || '') + Math.random().toString(36).substr(2, 9);
    },

    // Quote regular expression characters
    //
    preg_quote: function (str) {
      return (str + '').replace(/(\[|\-|\])/g, "\\$1");
    },

    //
    // Reneme input names
    //
    name_nested_replace: function ($selector, field_id) {

      var checks = [];
      var regex = new RegExp('(' + SP_WCS.helper.preg_quote(field_id) + ')\\[(\\d+)\\]', 'g');

      $selector.find(':radio').each(function () {
        if (this.checked || this.orginal_checked) {
          this.orginal_checked = true;
        }
      });

      $selector.each(function (index) {
        $(this).find(':input').each(function () {
          this.name = this.name.replace(regex, field_id + '[' + index + ']');
          if (this.orginal_checked) {
            this.checked = true;
          }
        });
      });

    },

    //
    // Debounce
    //
    debounce: function (callback, threshold, immediate) {
      var timeout;
      return function () {
        var context = this, args = arguments;
        var later = function () {
          timeout = null;
          if (!immediate) {
            callback.apply(context, args);
          }
        };
        var callNow = (immediate && !timeout);
        clearTimeout(timeout);
        timeout = setTimeout(later, threshold);
        if (callNow) {
          callback.apply(context, args);
        }
      };
    },

    //
    // Get a cookie
    //
    get_cookie: function (name) {

      var e, b, cookie = document.cookie, p = name + '=';

      if (!cookie) {
        return;
      }

      b = cookie.indexOf('; ' + p);

      if (b === -1) {
        b = cookie.indexOf(p);

        if (b !== 0) {
          return null;
        }
      } else {
        b += 2;
      }

      e = cookie.indexOf(';', b);

      if (e === -1) {
        e = cookie.length;
      }

      return decodeURIComponent(cookie.substring(b + p.length, e));

    },

    //
    // Set a cookie
    //
    set_cookie: function (name, value, expires, path, domain, secure) {

      var d = new Date();

      if (typeof (expires) === 'object' && expires.toGMTString) {
        expires = expires.toGMTString();
      } else if (parseInt(expires, 10)) {
        d.setTime(d.getTime() + (parseInt(expires, 10) * 1000));
        expires = d.toGMTString();
      } else {
        expires = '';
      }

      document.cookie = name + '=' + encodeURIComponent(value) +
        (expires ? '; expires=' + expires : '') +
        (path ? '; path=' + path : '') +
        (domain ? '; domain=' + domain : '') +
        (secure ? '; secure' : '');

    },

    //
    // Remove a cookie
    //
    remove_cookie: function (name, path, domain, secure) {
      SP_WCS.helper.set_cookie(name, '', -1000, path, domain, secure);
    },

  };

  //
  // Custom clone for textarea and select clone() bug
  //
  $.fn.spf_clone = function () {

    var base = $.fn.clone.apply(this, arguments),
      clone = this.find('select').add(this.filter('select')),
      cloned = base.find('select').add(base.filter('select'));

    for (var i = 0; i < clone.length; ++i) {
      for (var j = 0; j < clone[i].options.length; ++j) {

        if (clone[i].options[j].selected === true) {
          cloned[i].options[j].selected = true;
        }

      }
    }

    this.find(':radio').each(function () {
      this.orginal_checked = this.checked;
    });

    return base;

  };

  //
  // Options Navigation
  //
  $.fn.spf_nav_options = function () {
    return this.each(function () {

      var $nav = $(this),
        $links = $nav.find('a'),
        $hidden = $nav.closest('.spf').find('.spf-section-id'),
        $last_section;

      $(window).on('hashchange', function () {

        var hash = window.location.hash.match(new RegExp('tab=([^&]*)'));
        var slug = hash ? hash[1] : $links.first().attr('href').replace('#tab=', '');
        var $link = $('#spf-tab-link-' + slug);

        if ($link.length > 0) {

          $link.closest('.spf-tab-depth-0').addClass('spf-tab-active').siblings().removeClass('spf-tab-active');
          $links.removeClass('spf-section-active');
          $link.addClass('spf-section-active');

          if ($last_section !== undefined) {
            $last_section.hide();
          }

          var $section = $('#spf-section-' + slug);
          $section.css({ display: 'block' });
          $section.spf_reload_script();

          $hidden.val(slug);

          $last_section = $section;

        }

      }).trigger('hashchange');

    });
  };

  //
  // Metabox Tabs
  //
  $.fn.spf_nav_metabox = function () {
    return this.each(function () {

      var $nav = $(this),
        $links = $nav.find('a'),
        unique_id = $nav.data('unique'),
        post_id = $('#post_ID').val() || 'global',
        $last_section,
        $last_link;

      $links.on('click', function (e) {

        e.preventDefault();

        var $link = $(this),
          section_id = $link.data('section');

        if ($last_link !== undefined) {
          $last_link.removeClass('spf-section-active');
        }

        if ($last_section !== undefined) {
          $last_section.hide();
        }

        $link.addClass('spf-section-active');

        var $section = $('#spf-section-' + section_id);
        $section.css({ display: 'block' });
        $section.spf_reload_script();

        SP_WCS.helper.set_cookie('spf-last-metabox-tab-' + post_id + '-' + unique_id, section_id);

        $last_section = $section;
        $last_link = $link;

      });

      var get_cookie = SP_WCS.helper.get_cookie('spf-last-metabox-tab-' + post_id + '-' + unique_id);

      if (get_cookie) {
        $nav.find('a[data-section="' + get_cookie + '"]').trigger('click');
      } else {
        $links.first('a').trigger('click');
      }

    });
  };

  //
  // Metabox Page Templates Listener
  //
  $.fn.spf_page_templates = function () {
    if (this.length) {

      $(document).on('change', '.editor-page-attributes__template select, #page_template', function () {

        var maybe_value = $(this).val() || 'default';

        $('.spf-page-templates').removeClass('spf-show').addClass('spf-hide');
        $('.spf-page-' + maybe_value.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-')).removeClass('spf-hide').addClass('spf-show');

      });

    }
  };

  //
  // Metabox Post Formats Listener
  //
  $.fn.spf_post_formats = function () {
    if (this.length) {

      $(document).on('change', '.editor-post-format select, #formatdiv input[name="post_format"]', function () {

        var maybe_value = $(this).val() || 'default';

        // Fallback for classic editor version
        maybe_value = (maybe_value === '0') ? 'default' : maybe_value;

        $('.spf-post-formats').removeClass('spf-show').addClass('spf-hide');
        $('.spf-post-format-' + maybe_value).removeClass('spf-hide').addClass('spf-show');

      });

    }
  };

  //
  // Sticky Header
  //
  $.fn.spf_sticky = function () {
    return this.each(function () {

      var $this = $(this),
        $window = $(window),
        $inner = $this.find('.spf-header-inner'),
        padding = parseInt($inner.css('padding-left')) + parseInt($inner.css('padding-right')),
        offset = 32,
        scrollTop = 0,
        lastTop = 0,
        ticking = false,
        stickyUpdate = function () {

          var offsetTop = $this.offset().top,
            stickyTop = Math.max(offset, offsetTop - scrollTop),
            winWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

          if (stickyTop <= offset && winWidth > 782) {
            $inner.css({ width: $this.outerWidth() - padding });
            $this.css({ height: $this.outerHeight() }).addClass('spf-sticky');
          } else {
            $inner.removeAttr('style');
            $this.removeAttr('style').removeClass('spf-sticky');
          }

        },
        requestTick = function () {

          if (!ticking) {
            requestAnimationFrame(function () {
              stickyUpdate();
              ticking = false;
            });
          }

          ticking = true;

        },
        onSticky = function () {

          scrollTop = $window.scrollTop();
          requestTick();

        };

      $window.on('scroll resize', onSticky);

      onSticky();

    });
  };

  //
  // Dependency System
  //
  $.fn.spf_dependency = function () {
    return this.each(function () {

      var $this = $(this),
        ruleset = $.spf_deps.createRuleset(),
        depends = [],
        is_global = false;

      $this.children('[data-controller]').each(function () {

        var $field = $(this),
          controllers = $field.data('controller').split('|'),
          conditions = $field.data('condition').split('|'),
          values = $field.data('value').toString().split('|'),
          rules = ruleset;

        if ($field.data('depend-global')) {
          is_global = true;
        }

        $.each(controllers, function (index, depend_id) {

          var value = values[index] || '',
            condition = conditions[index] || conditions[0];

          rules = rules.createRule('[data-depend-id="' + depend_id + '"]', condition, value);

          rules.include($field);

          depends.push(depend_id);

        });

      });

      if (depends.length) {

        if (is_global) {
          $.spf_deps.enable(SP_WCS.vars.$body, ruleset, depends);
        } else {
          $.spf_deps.enable($this, ruleset, depends);
        }

      }

    });
  };

  //
  // Field: accordion
  //
  $.fn.spf_field_accordion = function () {
    return this.each(function () {

      var $titles = $(this).find('.spf-accordion-title');

      $titles.on('click', function () {

        var $title = $(this),
          $icon = $title.find('.spf-accordion-icon'),
          $content = $title.next();

        if ($icon.hasClass('fa-angle-right')) {
          $icon.removeClass('fa-angle-right').addClass('fa-angle-down');
        } else {
          $icon.removeClass('fa-angle-down').addClass('fa-angle-right');
        }

        if (!$content.data('opened')) {

          $content.spf_reload_script();
          $content.data('opened', true);

        }

        $content.toggleClass('spf-accordion-open');

      });

    });
  };

  //
  // Field: backup
  //
  $.fn.spf_field_backup = function () {
    return this.each(function () {

      if (window.wp.customize === undefined) { return; }

      var base = this,
        $this = $(this),
        $body = $('body'),
        $import = $this.find('.spf-import'),
        $reset = $this.find('.spf-reset');

      base.notification = function (message_text) {

        if (wp.customize.notifications && wp.customize.OverlayNotification) {

          // clear if there is any saved data.
          if (!wp.customize.state('saved').get()) {
            wp.customize.state('changesetStatus').set('trash');
            wp.customize.each(function (setting) { setting._dirty = false; });
            wp.customize.state('saved').set(true);
          }

          // then show a notification overlay
          wp.customize.notifications.add(new wp.customize.OverlayNotification('spf_field_backup_notification', {
            type: 'info',
            message: message_text,
            loading: true
          }));

        }

      };

      $reset.on('click', function (e) {

        e.preventDefault();

        if (SP_WCS.vars.is_confirm) {

          base.notification(window.spf_vars.i18n.reset_notification);

          window.wp.ajax.post('spf-reset', {
            unique: $reset.data('unique'),
            nonce: $reset.data('nonce')
          })
            .done(function (response) {
              window.location.reload(true);
            })
            .fail(function (response) {
              alert(response.error);
              wp.customize.notifications.remove('spf_field_backup_notification');
            });

        }

      });

      $import.on('click', function (e) {

        e.preventDefault();

        if (SP_WCS.vars.is_confirm) {

          base.notification(window.spf_vars.i18n.import_notification);

          window.wp.ajax.post('spf-import', {
            unique: $import.data('unique'),
            nonce: $import.data('nonce'),
            import_data: $this.find('.spf-import-data').val()
          }).done(function (response) {
            window.location.reload(true);
          }).fail(function (response) {
            alert(response.error);
            wp.customize.notifications.remove('spf_field_backup_notification');
          });

        }

      });

    });
  };

  //
  // Field: background
  //
  $.fn.spf_field_background = function () {
    return this.each(function () {
      $(this).find('.spf--media').spf_reload_script();

      //
      //
      // Preview
      var $this = $(this);
      var $preview_block = $this.find('.spf--block-preview');

      if ($preview_block.length) {

        var $preview = $this.find('.spf--preview');

        // Set preview styles on change
        $this.on('change', SP_WCS.helper.debounce(function (event) {

          $preview_block.removeClass('hidden');

          var $this = $(this),
            background_color = $this.find('.spf-fieldset .spf--block:nth-child(1n) label input').val(),
            background_grd_color = $this.find('.spf-fieldset .spf--block:nth-child(2n) label input').val(),
            background_grd_direction = $this.find('.spf-fieldset .spf--gradient select').val(),
            background_image = $this.find('.spf--media input').val(),
            background_position = $this.find('.spf-fieldset .spf--block:nth-child(7n) select').val(),
            background_repeat = $this.find('.spf-fieldset .spf--block:nth-child(8n) select').val(),
            background_attachment = $this.find('.spf-fieldset .spf--block:nth-child(9n) select').val(),
            background_size = $this.find('.spf-fieldset .spf--block:nth-child(10n) select').val();

          var properties = {};

          if (background_color) { properties.backgroundColor = background_color; }
          if (background_grd_direction) { properties.backgroundImage = 'linear-gradient(' + background_grd_direction + ', ' + background_color + ', ' + background_grd_color + ')' }
          if (background_image) {
            if (background_image) { properties.backgroundImage = 'url(' + background_image + ')' }
            if (background_repeat) { properties.backgroundRepeat = background_repeat; }
            if (background_position) { properties.backgroundPosition = background_position; }
            if (background_attachment) { properties.backgroundAttachment = background_attachment; }
            if (background_size) { properties.backgroundSize = background_size; }
          }
          $preview.removeAttr('style');
          $preview.css(properties);

        }, 100));

        if (!$preview_block.hasClass('hidden')) {
          $this.trigger('change');
        }

      }


    });
  };

  //
  // Field: code_editor
  //
  $.fn.spf_field_code_editor = function () {
    return this.each(function () {

      if (typeof CodeMirror !== 'function') { return; }

      var $this = $(this),
        $textarea = $this.find('textarea'),
        $inited = $this.find('.CodeMirror'),
        data_editor = $textarea.data('editor');

      if ($inited.length) {
        $inited.remove();
      }

      var interval = setInterval(function () {
        if ($this.is(':visible')) {

          var code_editor = CodeMirror.fromTextArea($textarea[0], data_editor);

          // load code-mirror theme css.
          if (data_editor.theme !== 'default' && SP_WCS.vars.code_themes.indexOf(data_editor.theme) === -1) {

            var $cssLink = $('<link>');

            $('#spf-codemirror-css').after($cssLink);

            $cssLink.attr({
              rel: 'stylesheet',
              id: 'spf-codemirror-' + data_editor.theme + '-css',
              href: data_editor.cdnURL + '/theme/' + data_editor.theme + '.min.css',
              type: 'text/css',
              media: 'all'
            });

            SP_WCS.vars.code_themes.push(data_editor.theme);

          }

          CodeMirror.modeURL = data_editor.cdnURL + '/mode/%N/%N.min.js';
          CodeMirror.autoLoadMode(code_editor, data_editor.mode);

          code_editor.on('change', function (editor, event) {
            $textarea.val(code_editor.getValue()).trigger('change');
          });

          clearInterval(interval);

        }
      });

    });
  };

  //
  // Field: date
  //
  $.fn.spf_field_date = function () {
    return this.each(function () {

      var $this = $(this),
        $inputs = $this.find('input'),
        settings = $this.find('.spf-date-settings').data('settings'),
        wrapper = '<div class="spf-datepicker-wrapper"></div>',
        $datepicker;

      var defaults = {
        showAnim: '',
        beforeShow: function (input, inst) {
          $(inst.dpDiv).addClass('spf-datepicker-wrapper');
        },
        onClose: function (input, inst) {
          $(inst.dpDiv).removeClass('spf-datepicker-wrapper');
        },
      };

      settings = $.extend({}, settings, defaults);

      if ($inputs.length === 2) {

        settings = $.extend({}, settings, {
          onSelect: function (selectedDate) {

            var $this = $(this),
              $from = $inputs.first(),
              option = ($inputs.first().attr('id') === $(this).attr('id')) ? 'minDate' : 'maxDate',
              date = $.datepicker.parseDate(settings.dateFormat, selectedDate);

            $inputs.not(this).datepicker('option', option, date);

          }
        });

      }

      $inputs.each(function () {

        var $input = $(this);

        if ($input.hasClass('hasDatepicker')) {
          $input.removeAttr('id').removeClass('hasDatepicker');
        }

        $input.datepicker(settings);

      });

    });
  };

  //
  // Field: fieldset
  //
  $.fn.spf_field_fieldset = function () {
    return this.each(function () {
      $(this).find('.spf-fieldset-content').spf_reload_script();
    });
  };

  //
  // Field: gallery
  //
  $.fn.spf_field_gallery = function () {
    return this.each(function () {

      var $this = $(this),
        $edit = $this.find('.spf-edit-gallery'),
        $clear = $this.find('.spf-clear-gallery'),
        $list = $this.find('ul.sp-gallery-images'),
        $input = $this.find('input'),
        $img = $this.find('img'),
        wp_media_frame;

      $this.on('click', '.spf-button, .spf-edit-gallery', function (e) {

        var $el = $(this),
          ids = $input.val(),
          what = ($el.hasClass('spf-edit-gallery')) ? 'edit' : 'add',
          state = (what === 'add' && !ids.length) ? 'gallery' : 'gallery-edit';

        e.preventDefault();

        if (typeof window.wp === 'undefined' || !window.wp.media || !window.wp.media.gallery) { return; }

        // Open media with state
        if (state === 'gallery') {

          wp_media_frame = window.wp.media({
            library: {
              type: 'image'
            },
            frame: 'post',
            state: 'gallery',
            multiple: true
          });

          wp_media_frame.open();

        } else {

          wp_media_frame = window.wp.media.gallery.edit('[gallery ids="' + ids + '"]');

          if (what === 'add') {
            wp_media_frame.setState('gallery-library');
          }

        }

        // Media Update
        wp_media_frame.on('update', function (selection) {

          $list.empty();

          var selectedIds = selection.models.map(function (attachment) {

            var item = attachment.toJSON();
            var thumb = (typeof item.sizes.thumbnail !== 'undefined') ? item.sizes.thumbnail.url : item.url;

            $list.append('<li><img src="' + thumb + '"></li>');

            return item.id;

          });

          $input.val(selectedIds.join(',')).trigger('change');
          $clear.removeClass('hidden');
          $edit.removeClass('hidden');

        });

      });

      $clear.on('click', function (e) {
        e.preventDefault();
        $list.empty();
        $input.val('').trigger('change');
        $clear.addClass('hidden');
        $edit.addClass('hidden');
      });

    });

  };

  //
  // Field: group
  //
  $.fn.spf_field_group = function () {
    return this.each(function () {

      var $this = $(this),
        $fieldset = $this.children('.spf-fieldset'),
        $group = $fieldset.length ? $fieldset : $this,
        $wrapper = $group.children('.spf-cloneable-wrapper'),
        $hidden = $group.children('.spf-cloneable-hidden'),
        $max = $group.children('.spf-cloneable-max'),
        $min = $group.children('.spf-cloneable-min'),
        field_id = $wrapper.data('field-id'),
        unique_id = $wrapper.data('unique-id'),
        is_number = Boolean(Number($wrapper.data('title-number'))),
        max = parseInt($wrapper.data('max')),
        min = parseInt($wrapper.data('min'));

      // clear accordion arrows if multi-instance
      if ($wrapper.hasClass('ui-accordion')) {
        $wrapper.find('.ui-accordion-header-icon').remove();
      }

      var update_title_numbers = function ($selector) {
        $selector.find('.spf-cloneable-title-number').each(function (index) {
          $(this).html(($(this).closest('.spf-cloneable-item').index() + 1) + '.');
        });
      };

      $wrapper.accordion({
        header: '> .spf-cloneable-item > .spf-cloneable-title',
        collapsible: true,
        active: false,
        animate: false,
        heightStyle: 'content',
        icons: {
          'header': 'spf-cloneable-header-icon fa fa-angle-right',
          'activeHeader': 'spf-cloneable-header-icon fa fa-angle-down'
        },
        activate: function (event, ui) {

          var $panel = ui.newPanel;
          var $header = ui.newHeader;

          if ($panel.length && !$panel.data('opened')) {

            var $fields = $panel.children();
            var $first = $fields.first().find(':input').first();
            var $title = $header.find('.spf-cloneable-value');

            $first.on('keyup', function (event) {
              $title.text($first.val());
            });

            $panel.spf_reload_script();
            $panel.data('opened', true);
            $panel.data('retry', false);

          } else if ($panel.data('retry')) {

            $panel.spf_reload_script_retry();
            $panel.data('retry', false);

          }

        }
      });

      $wrapper.sortable({
        axis: 'y',
        handle: '.spf-cloneable-title,.spf-cloneable-sort',
        helper: 'original',
        cursor: 'move',
        placeholder: 'widget-placeholder',
        start: function (event, ui) {

          $wrapper.accordion({ active: false });
          $wrapper.sortable('refreshPositions');
          ui.item.children('.spf-cloneable-content').data('retry', true);

        },
        update: function (event, ui) {

          SP_WCS.helper.name_nested_replace($wrapper.children('.spf-cloneable-item'), field_id);
          $wrapper.spf_customizer_refresh();

          if (is_number) {
            update_title_numbers($wrapper);
          }

        },
      });

      $group.children('.spf-cloneable-add').on('click', function (e) {

        e.preventDefault();

        var count = $wrapper.children('.spf-cloneable-item').length;

        $min.hide();

        if (max && (count + 1) > max) {
          $max.show();
          return;
        }

        var new_field_id = unique_id + field_id + '[' + count + ']';

        var $cloned_item = $hidden.spf_clone(true);

        $cloned_item.removeClass('spf-cloneable-hidden');

        $cloned_item.find(':input').each(function () {
          this.name = new_field_id + this.name.replace((this.name.startsWith('_nonce') ? '_nonce' : unique_id), '');
        });

        $cloned_item.find('.spf-data-wrapper').each(function () {
          $(this).attr('data-unique-id', new_field_id);
        });

        $wrapper.append($cloned_item);
        $wrapper.accordion('refresh');
        $wrapper.accordion({ active: count });
        $wrapper.spf_customizer_refresh();
        $wrapper.spf_customizer_listen({ closest: true });

        if (is_number) {
          update_title_numbers($wrapper);
        }

      });

      var event_clone = function (e) {

        e.preventDefault();

        var count = $wrapper.children('.spf-cloneable-item').length;

        $min.hide();

        if (max && (count + 1) > max) {
          $max.show();
          return;
        }

        var $this = $(this),
          $parent = $this.parent().parent(),
          $cloned_helper = $parent.children('.spf-cloneable-helper').spf_clone(true),
          $cloned_title = $parent.children('.spf-cloneable-title').spf_clone(),
          $cloned_content = $parent.children('.spf-cloneable-content').spf_clone(),
          cloned_regex = new RegExp('(' + SP_WCS.helper.preg_quote(field_id) + ')\\[(\\d+)\\]', 'g');

        $cloned_content.find('.spf-data-wrapper').each(function () {
          var $this = $(this);
          $this.attr('data-unique-id', $this.attr('data-unique-id').replace(cloned_regex, field_id + '[' + ($parent.index() + 1) + ']'));
        });

        var $cloned = $('<div class="spf-cloneable-item" />');

        $cloned.append($cloned_helper);
        $cloned.append($cloned_title);
        $cloned.append($cloned_content);

        $wrapper.children().eq($parent.index()).after($cloned);

        SP_WCS.helper.name_nested_replace($wrapper.children('.spf-cloneable-item'), field_id);

        $wrapper.accordion('refresh');
        $wrapper.spf_customizer_refresh();
        $wrapper.spf_customizer_listen({ closest: true });

        if (is_number) {
          update_title_numbers($wrapper);
        }

      };

      $wrapper.children('.spf-cloneable-item').children('.spf-cloneable-helper').on('click', '.spf-cloneable-clone', event_clone);
      $group.children('.spf-cloneable-hidden').children('.spf-cloneable-helper').on('click', '.spf-cloneable-clone', event_clone);

      var event_remove = function (e) {

        e.preventDefault();

        var count = $wrapper.children('.spf-cloneable-item').length;

        $max.hide();
        $min.hide();

        if (min && (count - 1) < min) {
          $min.show();
          return;
        }

        $(this).closest('.spf-cloneable-item').remove();

        SP_WCS.helper.name_nested_replace($wrapper.children('.spf-cloneable-item'), field_id);

        $wrapper.spf_customizer_refresh();

        if (is_number) {
          update_title_numbers($wrapper);
        }

      };

      $wrapper.children('.spf-cloneable-item').children('.spf-cloneable-helper').on('click', '.spf-cloneable-remove', event_remove);
      $group.children('.spf-cloneable-hidden').children('.spf-cloneable-helper').on('click', '.spf-cloneable-remove', event_remove);

    });
  };

  //
  // Field: icon
  //
  $.fn.spf_field_icon = function () {
    return this.each(function () {

      var $this = $(this);

      $this.on('click', '.spf-icon-add', function (e) {

        e.preventDefault();

        var $button = $(this);
        var $modal = $('#spf-modal-icon');

        $modal.show();

        SP_WCS.vars.$icon_target = $this;

        if (!SP_WCS.vars.icon_modal_loaded) {

          $modal.find('.spf-modal-loading').show();

          window.wp.ajax.post('spf-get-icons', { nonce: $button.data('nonce') }).done(function (response) {

            $modal.find('.spf-modal-loading').hide();

            SP_WCS.vars.icon_modal_loaded = true;

            var $load = $modal.find('.spf-modal-load').html(response.content);

            $load.on('click', 'a', function (e) {

              e.preventDefault();

              var icon = $(this).data('spf-icon');

              SP_WCS.vars.$icon_target.find('i').removeAttr('class').addClass(icon);
              SP_WCS.vars.$icon_target.find('input').val(icon).trigger('change');
              SP_WCS.vars.$icon_target.find('.spf-icon-preview').removeClass('hidden');
              SP_WCS.vars.$icon_target.find('.spf-icon-remove').removeClass('hidden');

              $modal.hide();

            });

            $modal.on('change keyup', '.spf-icon-search', function () {

              var value = $(this).val(),
                $icons = $load.find('a');

              $icons.each(function () {

                var $elem = $(this);

                if ($elem.data('spf-icon').search(new RegExp(value, 'i')) < 0) {
                  $elem.hide();
                } else {
                  $elem.show();
                }

              });

            });

            $modal.on('click', '.spf-modal-close, .spf-modal-overlay', function () {

              $modal.hide();

            });

          });

        }

      });

      $this.on('click', '.spf-icon-remove', function (e) {

        e.preventDefault();

        $this.find('.spf-icon-preview').addClass('hidden');
        $this.find('input').val('').trigger('change');
        $(this).addClass('hidden');

      });

    });
  };

  //
  // Field: media
  //
  $.fn.spf_field_media = function () {
    return this.each(function () {

      var $this = $(this),
        $upload_button = $this.find('.spf--button'),
        $remove_button = $this.find('.spf--remove'),
        $library = $upload_button.data('library') && $upload_button.data('library').split(',') || '',
        wp_media_frame;

      $upload_button.on('click', function (e) {

        e.preventDefault();

        if (typeof window.wp === 'undefined' || !window.wp.media || !window.wp.media.gallery) {
          return;
        }

        if (wp_media_frame) {
          wp_media_frame.open();
          return;
        }

        wp_media_frame = window.wp.media({
          library: {
            type: $library
          }
        });

        wp_media_frame.on('select', function () {

          var thumbnail;
          var attributes = wp_media_frame.state().get('selection').first().attributes;
          var preview_size = $upload_button.data('preview-size') || 'thumbnail';

          $this.find('.spf--url').val(attributes.url);
          $this.find('.spf--id').val(attributes.id);
          $this.find('.spf--width').val(attributes.width);
          $this.find('.spf--height').val(attributes.height);
          $this.find('.spf--alt').val(attributes.alt);
          $this.find('.spf--title').val(attributes.title);
          $this.find('.spf--description').val(attributes.description);

          if (typeof attributes.sizes !== 'undefined' && typeof attributes.sizes.thumbnail !== 'undefined' && preview_size === 'thumbnail') {
            thumbnail = attributes.sizes.thumbnail.url;
          } else if (typeof attributes.sizes !== 'undefined' && typeof attributes.sizes.full !== 'undefined') {
            thumbnail = attributes.sizes.full.url;
          } else {
            thumbnail = attributes.icon;
          }

          $remove_button.removeClass('hidden');
          $this.find('.spf--preview').removeClass('hidden');
          $this.find('.spf--src').attr('src', thumbnail);
          $this.find('.spf--thumbnail').val(thumbnail).trigger('change');

        });

        wp_media_frame.open();

      });

      $remove_button.on('click', function (e) {
        e.preventDefault();
        $remove_button.addClass('hidden');
        $this.find('.spf--preview').addClass('hidden');
        $this.find('input').val('');
        $this.find('.spf--thumbnail').trigger('change');
      });

    });

  };

  //
  // Field: repeater
  //
  $.fn.spf_field_repeater = function () {
    return this.each(function () {

      var $this = $(this),
        $fieldset = $this.children('.spf-fieldset'),
        $repeater = $fieldset.length ? $fieldset : $this,
        $wrapper = $repeater.children('.spf-repeater-wrapper'),
        $hidden = $repeater.children('.spf-repeater-hidden'),
        $max = $repeater.children('.spf-repeater-max'),
        $min = $repeater.children('.spf-repeater-min'),
        field_id = $wrapper.data('field-id'),
        unique_id = $wrapper.data('unique-id'),
        max = parseInt($wrapper.data('max')),
        min = parseInt($wrapper.data('min'));


      $wrapper.children('.spf-repeater-item').children('.spf-repeater-content').spf_reload_script();

      $wrapper.sortable({
        axis: 'y',
        handle: '.spf-repeater-sort',
        helper: 'original',
        cursor: 'move',
        placeholder: 'widget-placeholder',
        update: function (event, ui) {

          SP_WCS.helper.name_nested_replace($wrapper.children('.spf-repeater-item'), field_id);
          $wrapper.spf_customizer_refresh();
          ui.item.spf_reload_script_retry();

        }
      });

      $repeater.children('.spf-repeater-add').on('click', function (e) {

        e.preventDefault();

        var count = $wrapper.children('.spf-repeater-item').length;

        $min.hide();

        if (max && (count + 1) > max) {
          $max.show();
          return;
        }

        var new_field_id = unique_id + field_id + '[' + count + ']';

        var $cloned_item = $hidden.spf_clone(true);

        $cloned_item.removeClass('spf-repeater-hidden');

        $cloned_item.find(':input').each(function () {
          this.name = new_field_id + this.name.replace((this.name.startsWith('_nonce') ? '_nonce' : unique_id), '');
        });

        $cloned_item.find('.spf-data-wrapper').each(function () {
          $(this).attr('data-unique-id', new_field_id);
        });

        $wrapper.append($cloned_item);
        $cloned_item.children('.spf-repeater-content').spf_reload_script();
        $wrapper.spf_customizer_refresh();
        $wrapper.spf_customizer_listen({ closest: true });

      });

      var event_clone = function (e) {

        e.preventDefault();

        var count = $wrapper.children('.spf-repeater-item').length;

        $min.hide();

        if (max && (count + 1) > max) {
          $max.show();
          return;
        }

        var $this = $(this),
          $parent = $this.parent().parent().parent(),
          $cloned_content = $parent.children('.spf-repeater-content').spf_clone(),
          $cloned_helper = $parent.children('.spf-repeater-helper').spf_clone(true),
          cloned_regex = new RegExp('(' + SP_WCS.helper.preg_quote(field_id) + ')\\[(\\d+)\\]', 'g');

        $cloned_content.find('.spf-data-wrapper').each(function () {
          var $this = $(this);
          $this.attr('data-unique-id', $this.attr('data-unique-id').replace(cloned_regex, field_id + '[' + ($parent.index() + 1) + ']'));
        });

        var $cloned = $('<div class="spf-repeater-item" />');

        $cloned.append($cloned_content);
        $cloned.append($cloned_helper);

        $wrapper.children().eq($parent.index()).after($cloned);

        $cloned.children('.spf-repeater-content').spf_reload_script();

        SP_WCS.helper.name_nested_replace($wrapper.children('.spf-repeater-item'), field_id);

        $wrapper.spf_customizer_refresh();
        $wrapper.spf_customizer_listen({ closest: true });

      };

      $wrapper.children('.spf-repeater-item').children('.spf-repeater-helper').on('click', '.spf-repeater-clone', event_clone);
      $repeater.children('.spf-repeater-hidden').children('.spf-repeater-helper').on('click', '.spf-repeater-clone', event_clone);

      var event_remove = function (e) {

        e.preventDefault();

        var count = $wrapper.children('.spf-repeater-item').length;

        $max.hide();
        $min.hide();

        if (min && (count - 1) < min) {
          $min.show();
          return;
        }

        $(this).closest('.spf-repeater-item').remove();

        SP_WCS.helper.name_nested_replace($wrapper.children('.spf-repeater-item'), field_id);

        $wrapper.spf_customizer_refresh();

      };

      $wrapper.children('.spf-repeater-item').children('.spf-repeater-helper').on('click', '.spf-repeater-remove', event_remove);
      $repeater.children('.spf-repeater-hidden').children('.spf-repeater-helper').on('click', '.spf-repeater-remove', event_remove);

    });
  };

  //
  // Field: slider
  //
  $.fn.spf_field_slider = function () {
    return this.each(function () {

      var $this = $(this),
        $input = $this.find('input'),
        $slider = $this.find('.spf-slider-ui'),
        data = $input.data(),
        value = $input.val() || 0;

      if ($slider.hasClass('ui-slider')) {
        $slider.empty();
      }

      $slider.slider({
        range: 'min',
        value: value,
        min: data.min,
        max: data.max,
        step: data.step,
        slide: function (e, o) {
          $input.val(o.value).trigger('change');
        }
      });

      $input.keyup(function () {
        $slider.slider('value', $input.val());
      });

    });
  };

  //
  // Field: sortable
  //
  $.fn.spf_field_sortable = function () {
    return this.each(function () {

      var $sortable = $(this).find('.spf--sortable');

      $sortable.sortable({
        axis: 'y',
        helper: 'original',
        cursor: 'move',
        placeholder: 'widget-placeholder',
        update: function (event, ui) {
          $sortable.spf_customizer_refresh();
        }
      });

      $sortable.find('.spf--sortable-content').spf_reload_script();

    });
  };

  //
  // Field: sorter
  //
  $.fn.spf_field_sorter = function () {
    return this.each(function () {

      var $this = $(this),
        $enabled = $this.find('.spf-enabled'),
        $has_disabled = $this.find('.spf-disabled'),
        $disabled = ($has_disabled.length) ? $has_disabled : false;

      $enabled.sortable({
        connectWith: $disabled,
        placeholder: 'ui-sortable-placeholder',
        update: function (event, ui) {

          var $el = ui.item.find('input');

          if (ui.item.parent().hasClass('spf-enabled')) {
            $el.attr('name', $el.attr('name').replace('disabled', 'enabled'));
          } else {
            $el.attr('name', $el.attr('name').replace('enabled', 'disabled'));
          }

          $this.spf_customizer_refresh();

        }
      });

      if ($disabled) {

        $disabled.sortable({
          connectWith: $enabled,
          placeholder: 'ui-sortable-placeholder',
          update: function (event, ui) {
            $this.spf_customizer_refresh();
          }
        });

      }

    });
  };

  //
  // Field: spinner
  //
  $.fn.spf_field_spinner = function () {
    return this.each(function () {

      var $this = $(this),
        $input = $this.find('input'),
        $inited = $this.find('.ui-spinner-button');

      if ($inited.length) {
        $inited.remove();
      }

      $input.spinner({
        max: $input.data('max') || 100,
        min: $input.data('min') || 0,
        step: $input.data('step') || 1,
        spin: function (event, ui) {
          $input.val(ui.value).trigger('change');
        }
      });


    });
  };

  //
  // Field: switcher
  //
  $.fn.spf_field_switcher = function () {
    return this.each(function () {

      var $switcher = $(this).find('.spf--switcher');

      $switcher.on('click', function () {

        var value = 0;
        var $input = $switcher.find('input');

        if ($switcher.hasClass('spf--active')) {
          $switcher.removeClass('spf--active');
        } else {
          value = 1;
          $switcher.addClass('spf--active');
        }

        $input.val(value).trigger('change');

      });

    });
  };

  //
  // Field: tabbed
  //
  $.fn.spf_field_tabbed = function () {
    return this.each(function () {

      var $this = $(this),
        $links = $this.find('.spf-tabbed-nav a'),
        $sections = $this.find('.spf-tabbed-section');

      $sections.eq(0).spf_reload_script();

      $links.on('click', function (e) {

        e.preventDefault();

        var $link = $(this),
          index = $link.index(),
          $section = $sections.eq(index);

        $link.addClass('spf-tabbed-active').siblings().removeClass('spf-tabbed-active');
        $section.spf_reload_script();
        $section.removeClass('hidden').siblings().addClass('hidden');

      });

    });
  };

  //
  // Field: typography
  //
  $.fn.spf_field_typography = function () {
    return this.each(function () {

      var base = this;
      var $this = $(this);
      var loaded_fonts = [];
      var webfonts = '';
      var googlestyles = '';
      var defaultstyles = '';

      //
      //
      // Sanitize google font subset
      base.sanitize_subset = function (subset) {
        subset = subset.replace('-ext', ' Extended');
        subset = subset.charAt(0).toUpperCase() + subset.slice(1);
        return subset;
      };

      //
      //
      // Sanitize google font styles (weight and style)
      base.sanitize_style = function (style) {
        return googlestyles[style] ? googlestyles[style] : style;
      };

      //
      //
      // Load google font
      base.load_google_font = function (font_family, weight, style) {

        if (font_family && typeof WebFont === 'object') {

          weight = weight ? weight.replace('normal', '') : '';
          style = style ? style.replace('normal', '') : '';

          if (weight || style) {
            font_family = font_family + ':' + weight + style;
          }

          if (loaded_fonts.indexOf(font_family) === -1) {
            WebFont.load({ google: { families: [font_family] } });
          }

          loaded_fonts.push(font_family);

        }

      };

      //
      //
      // Append select options
      base.append_select_options = function ($select, options, condition, type, is_multi) {

        $select.find('option').not(':first').remove();

        var opts = '';

        $.each(options, function (key, value) {

          var selected;
          var name = value;

          // is_multi
          if (is_multi) {
            selected = (condition && condition.indexOf(value) !== -1) ? ' selected' : '';
          } else {
            selected = (condition && condition === value) ? ' selected' : '';
          }

          if (type === 'subset') {
            name = base.sanitize_subset(value);
          } else if (type === 'style') {
            name = base.sanitize_style(value);
          }

          opts += '<option value="' + value + '"' + selected + '>' + name + '</option>';

        });

        $select.append(opts).trigger('spf.change').trigger('chosen:updated');

      };

      base.init = function () {

        //
        //
        // Constants
        var selected_styles = [];
        var $typography = $this.find('.spf--typography');
        var $type = $this.find('.spf--type');
        var unit = $typography.data('unit');
        var exclude_fonts = $typography.data('exclude') ? $typography.data('exclude').split(',') : [];

        //
        //
        // Chosen init
        if ($this.find('.spf--chosen').length) {

          var $chosen_selects = $this.find('select');

          $chosen_selects.each(function () {

            var $chosen_select = $(this),
              $chosen_inited = $chosen_select.parent().find('.chosen-container');

            if ($chosen_inited.length) {
              $chosen_inited.remove();
            }

            $chosen_select.chosen({
              allow_single_deselect: true,
              disable_search_threshold: 15,
              width: '100%'
            });

          });

        }

        //
        //
        // Font family select
        var $font_family_select = $this.find('.spf--font-family');
        var first_font_family = $font_family_select.val();

        // Clear default font family select options
        $font_family_select.find('option').not(':first-child').remove();

        var opts = '';

        $.each(webfonts, function (type, group) {

          // Check for exclude fonts
          if (exclude_fonts && exclude_fonts.indexOf(type) !== -1) { return; }

          opts += '<optgroup label="' + group.label + '">';

          $.each(group.fonts, function (key, value) {

            // use key if value is object
            value = (typeof value === 'object') ? key : value;
            var selected = (value === first_font_family) ? ' selected' : '';
            opts += '<option value="' + value + '" data-type="' + type + '"' + selected + '>' + value + '</option>';

          });

          opts += '</optgroup>';

        });

        // Append google font select options
        //$font_family_select.append(opts).trigger('chosen:updated');

        //
        //
        // Font style select
        var $font_style_block = $this.find('.spf--block-font-style');

        if ($font_style_block.length) {

          var $font_style_select = $this.find('.spf--font-style-select');
          var first_style_value = $font_style_select.val() ? $font_style_select.val().replace(/normal/g, '') : '';

          //
          // Font Style on on change listener
          $font_style_select.on('change spf.change', function (event) {

            var style_value = $font_style_select.val();

            // set a default value
            if (!style_value && selected_styles && selected_styles.indexOf('normal') === -1) {
              style_value = selected_styles[0];
            }

            // set font weight, for eg. replacing 800italic to 800
            var font_normal = (style_value && style_value !== 'italic' && style_value === 'normal') ? 'normal' : '';
            var font_weight = (style_value && style_value !== 'italic' && style_value !== 'normal') ? style_value.replace('italic', '') : font_normal;
            var font_style = (style_value && style_value.substr(-6) === 'italic') ? 'italic' : '';

            $this.find('.spf--font-weight').val(font_weight);
            $this.find('.spf--font-style').val(font_style);

          });

          //
          //
          // Extra font style select
          var $extra_font_style_block = $this.find('.spf--block-extra-styles');

          if ($extra_font_style_block.length) {
            var $extra_font_style_select = $this.find('.spf--extra-styles');
            var first_extra_style_value = $extra_font_style_select.val();
          }

        }

        //
        //
        // Subsets select
        var $subset_block = $this.find('.spf--block-subset');
        if ($subset_block.length) {
          var $subset_select = $this.find('.spf--subset');
          var first_subset_select_value = $subset_select.val();
          var subset_multi_select = $subset_select.data('multiple') || false;
        }

        //
        //
        // Backup font family
        var $backup_font_family_block = $this.find('.spf--block-backup-font-family');

        //
        //
        // Font Family on Change Listener
        $font_family_select.on('change spf.change', function (event) {

          // // Hide subsets on change
          // if( $subset_block.length ) {
          //   $subset_block.addClass('hidden');
          // }

          // // Hide extra font style on change
          // if( $extra_font_style_block.length ) {
          //   $extra_font_style_block.addClass('hidden');
          // }

          // Hide backup font family on change
          if ($backup_font_family_block.length) {
            $backup_font_family_block.addClass('hidden');
          }

          var $selected = $font_family_select.find(':selected');
          var value = $selected.val();
          var type = $selected.data('type');

          if (type && value) {

            // Show backup fonts if font type google or custom
            if ((type === 'google' || type === 'custom') && $backup_font_family_block.length) {
              $backup_font_family_block.removeClass('hidden');
            }

            // Appending font style select options
            if ($font_style_block.length) {

              // set styles for multi and normal style selectors
              var styles = defaultstyles;

              // Custom or gogle font styles
              if (type === 'google' && webfonts[type].fonts[value][0]) {
                styles = webfonts[type].fonts[value][0];
              } else if (type === 'custom' && webfonts[type].fonts[value]) {
                styles = webfonts[type].fonts[value];
              }

              selected_styles = styles;

              // Set selected style value for avoid load errors
              var set_auto_style = (styles.indexOf('normal') !== -1) ? 'normal' : styles[0];
              var set_style_value = (first_style_value && styles.indexOf(first_style_value) !== -1) ? first_style_value : set_auto_style;

              // Append style select options
              base.append_select_options($font_style_select, styles, set_style_value, 'style');

              // Clear first value
              first_style_value = false;

              // Show style select after appended
              $font_style_block.removeClass('hidden');

              // Appending extra font style select options
              if (type === 'google' && $extra_font_style_block.length && styles.length > 1) {

                // Append extra-style select options
                base.append_select_options($extra_font_style_select, styles, first_extra_style_value, 'style', true);

                // Clear first value
                first_extra_style_value = false;

                // Show style select after appended
                $extra_font_style_block.removeClass('hidden');

              }

            }

            // Appending google fonts subsets select options
            if (type === 'google' && $subset_block.length && webfonts[type].fonts[value][1]) {

              var subsets = webfonts[type].fonts[value][1];
              var set_auto_subset = (subsets.length < 2 && subsets[0] !== 'latin') ? subsets[0] : '';
              var set_subset_value = (first_subset_select_value && subsets.indexOf(first_subset_select_value) !== -1) ? first_subset_select_value : set_auto_subset;

              // check for multiple subset select
              set_subset_value = (subset_multi_select && first_subset_select_value) ? first_subset_select_value : set_subset_value;

              base.append_select_options($subset_select, subsets, set_subset_value, 'subset', subset_multi_select);

              first_subset_select_value = false;

              $subset_block.removeClass('hidden');

            }

          } else {

            // Clear subsets options if type and value empty
            if ($subset_block.length) {
              $subset_select.find('option').not(':first-child').remove();
              $subset_select.trigger('chosen:updated');
            }

            // Clear font styles options if type and value empty
            if ($font_style_block.length) {
              $font_style_select.find('option').not(':first-child').remove();
              $font_style_select.trigger('chosen:updated');
            }

          }

          // Update font type input value
          $type.val(type);

        }).trigger('spf.change');

        //
        //
        // Preview
        //var $preview_block = $this.find('.spf--block-preview');
        var $preview_block = '';

        if ($preview_block.length) {

          var $preview = $this.find('.spf--preview');

          // Set preview styles on change
          $this.on('change', SP_WCS.helper.debounce(function (event) {

            $preview_block.removeClass('hidden');

            var font_family = $font_family_select.val(),
              font_weight = $this.find('.spf--font-weight').val(),
              font_style = $this.find('.spf--font-style').val(),
              font_size = $this.find('.spf--font-size').val(),
              font_variant = $this.find('.spf--font-variant').val(),
              line_height = $this.find('.spf--line-height').val(),
              text_align = $this.find('.spf--text-align').val(),
              text_transform = $this.find('.spf--text-transform').val(),
              text_decoration = $this.find('.spf--text-decoration').val(),
              text_color = $this.find('.spf--color').val(),
              word_spacing = $this.find('.spf--word-spacing').val(),
              letter_spacing = $this.find('.spf--letter-spacing').val(),
              custom_style = $this.find('.spf--custom-style').val(),
              type = $this.find('.spf--type').val();

            if (type === 'google') {
              base.load_google_font(font_family, font_weight, font_style);
            }

            var properties = {};

            if (font_family) { properties.fontFamily = font_family; }
            if (font_weight) { properties.fontWeight = font_weight; }
            if (font_style) { properties.fontStyle = font_style; }
            if (font_variant) { properties.fontVariant = font_variant; }
            if (font_size) { properties.fontSize = font_size + unit; }
            if (line_height) { properties.lineHeight = line_height + unit; }
            if (letter_spacing) { properties.letterSpacing = letter_spacing + unit; }
            if (word_spacing) { properties.wordSpacing = word_spacing + unit; }
            if (text_align) { properties.textAlign = text_align; }
            if (text_transform) { properties.textTransform = text_transform; }
            if (text_decoration) { properties.textDecoration = text_decoration; }
            if (text_color) { properties.color = text_color; }

            $preview.removeAttr('style');

            // Customs style attribute
            if (custom_style) { $preview.attr('style', custom_style); }

            $preview.css(properties);

          }, 100));

          // Preview black and white backgrounds trigger
          $preview_block.on('click', function () {

            $preview.toggleClass('spf--black-background');

            var $toggle = $preview_block.find('.spf--toggle');

            if ($toggle.hasClass('fa-toggle-off')) {
              $toggle.removeClass('fa-toggle-off').addClass('fa-toggle-on');
            } else {
              $toggle.removeClass('fa-toggle-on').addClass('fa-toggle-off');
            }

          });

          if (!$preview_block.hasClass('hidden')) {
            $this.trigger('change');
          }

        }

      };

      base.init();

    });
  };

  //
  // Field: upload
  //
  $.fn.spf_field_upload = function () {
    return this.each(function () {

      var $this = $(this),
        $input = $this.find('input'),
        $upload_button = $this.find('.spf--button'),
        $remove_button = $this.find('.spf--remove'),
        $library = $upload_button.data('library') && $upload_button.data('library').split(',') || '',
        wp_media_frame;

      $input.on('change', function (e) {
        if ($input.val()) {
          $remove_button.removeClass('hidden');
        } else {
          $remove_button.addClass('hidden');
        }
      });

      $upload_button.on('click', function (e) {

        e.preventDefault();

        if (typeof window.wp === 'undefined' || !window.wp.media || !window.wp.media.gallery) {
          return;
        }

        if (wp_media_frame) {
          wp_media_frame.open();
          return;
        }

        wp_media_frame = window.wp.media({
          library: {
            type: $library
          },
        });

        wp_media_frame.on('select', function () {
          $input.val(wp_media_frame.state().get('selection').first().attributes.url).trigger('change');
        });

        wp_media_frame.open();

      });

      $remove_button.on('click', function (e) {
        e.preventDefault();
        $input.val('').trigger('change');
      });

    });

  };

  //
  // Confirm
  //
  $.fn.spf_confirm = function () {
    return this.each(function () {
      $(this).on('click', function (e) {

        var confirm_text = $(this).data('confirm') || window.spf_vars.i18n.confirm;
        var confirm_answer = confirm(confirm_text);
        SP_WCS.vars.is_confirm = true;

        if (!confirm_answer) {
          e.preventDefault();
          SP_WCS.vars.is_confirm = false;
          return false;
        }

      });
    });
  };

  $.fn.serializeObject = function () {

    var obj = {};

    $.each(this.serializeArray(), function (i, o) {
      var n = o.name,
        v = o.value;

      obj[n] = obj[n] === undefined ? v
        : $.isArray(obj[n]) ? obj[n].concat(v)
          : [obj[n], v];
    });

    return obj;

  };

  //
  // Options Save
  //
  $.fn.spf_save = function () {
    return this.each(function () {

      var $this = $(this),
        $buttons = $('.spf-save'),
        $panel = $('.spf-options'),
        flooding = false,
        timeout;

      $this.on('click', function (e) {

        if (!flooding) {

          var $text = $this.data('save'),
            $value = $this.val();

          $buttons.attr('value', $text);

          if ($this.hasClass('spf-save-ajax')) {

            e.preventDefault();

            $panel.addClass('spf-saving');
            $buttons.prop('disabled', true);

            window.wp.ajax.post('spf_' + $panel.data('unique') + '_ajax_save', {
              data: $('#spf-form').serializeJSONSP_WCS()
            })
              .done(function (response) {

                clearTimeout(timeout);

                var $result_success = $('.spf-form-success');

                $result_success.empty().append(response.notice).slideDown('fast', function () {
                  timeout = setTimeout(function () {
                    $result_success.slideUp('fast');
                  }, 2000);
                });

                // clear errors
                $('.spf-error').remove();

                var $append_errors = $('.spf-form-error');

                $append_errors.empty().hide();

                if (Object.keys(response.errors).length) {

                  var error_icon = '<i class="spf-label-error spf-error">!</i>';

                  $.each(response.errors, function (key, error_message) {

                    var $field = $('[data-depend-id="' + key + '"]'),
                      $link = $('#spf-tab-link-' + ($field.closest('.spf-section').index() + 1)),
                      $tab = $link.closest('.spf-tab-depth-0');

                    $field.closest('.spf-fieldset').append('<p class="spf-text-error spf-error">' + error_message + '</p>');

                    if (!$link.find('.spf-error').length) {
                      $link.append(error_icon);
                    }

                    if (!$tab.find('.spf-arrow .spf-error').length) {
                      $tab.find('.spf-arrow').append(error_icon);
                    }

                    console.log(error_message);

                    $append_errors.append('<div>' + error_icon + ' ' + error_message + '</div>');

                  });

                  $append_errors.show();

                }

                $panel.removeClass('spf-saving');
                $buttons.prop('disabled', false).attr('value', $value);
                flooding = false;

              })
              .fail(function (response) {
                alert(response.error);
              });

          }

        }

        flooding = true;

      });

    });
  };

  //
  // Taxonomy Framework
  //
  $.fn.spf_taxonomy = function () {
    return this.each(function () {

      var $this = $(this),
        $form = $this.parents('form');

      if ($form.attr('id') === 'addtag') {

        var $submit = $form.find('#submit'),
          $cloned = $this.find('.spf-field').spf_clone();

        $submit.on('click', function () {

          if (!$form.find('.form-required').hasClass('form-invalid')) {

            $this.data('inited', false);

            $this.empty();

            $this.html($cloned);

            $cloned = $cloned.spf_clone();

            $this.spf_reload_script();

          }

        });

      }

    });
  };

  //
  // Shortcode Framework
  //
  $.fn.spf_shortcode = function () {

    var base = this;

    base.shortcode_parse = function (serialize, key) {

      var shortcode = '';

      $.each(serialize, function (shortcode_key, shortcode_values) {

        key = (key) ? key : shortcode_key;

        shortcode += '[' + key;

        $.each(shortcode_values, function (shortcode_tag, shortcode_value) {

          if (shortcode_tag === 'content') {

            shortcode += ']';
            shortcode += shortcode_value;
            shortcode += '[/' + key + '';

          } else {

            shortcode += base.shortcode_tags(shortcode_tag, shortcode_value);

          }

        });

        shortcode += ']';

      });

      return shortcode;

    };

    base.shortcode_tags = function (shortcode_tag, shortcode_value) {

      var shortcode = '';

      if (shortcode_value !== '') {

        if (typeof shortcode_value === 'object' && !$.isArray(shortcode_value)) {

          $.each(shortcode_value, function (sub_shortcode_tag, sub_shortcode_value) {

            // sanitize spesific key/value
            switch (sub_shortcode_tag) {

              case 'background-image':
                sub_shortcode_value = (sub_shortcode_value.url) ? sub_shortcode_value.url : '';
                break;

            }

            if (sub_shortcode_value !== '') {
              shortcode += ' ' + sub_shortcode_tag.replace('-', '_') + '="' + sub_shortcode_value.toString() + '"';
            }

          });

        } else {

          shortcode += ' ' + shortcode_tag.replace('-', '_') + '="' + shortcode_value.toString() + '"';

        }

      }

      return shortcode;

    };

    base.insertAtChars = function (_this, currentValue) {

      var obj = (typeof _this[0].name !== 'undefined') ? _this[0] : _this;

      if (obj.value.length && typeof obj.selectionStart !== 'undefined') {
        obj.focus();
        return obj.value.substring(0, obj.selectionStart) + currentValue + obj.value.substring(obj.selectionEnd, obj.value.length);
      } else {
        obj.focus();
        return currentValue;
      }

    };

    base.send_to_editor = function (html, editor_id) {

      var tinymce_editor;

      if (typeof tinymce !== 'undefined') {
        tinymce_editor = tinymce.get(editor_id);
      }

      if (tinymce_editor && !tinymce_editor.isHidden()) {
        tinymce_editor.execCommand('mceInsertContent', false, html);
      } else {
        var $editor = $('#' + editor_id);
        $editor.val(base.insertAtChars($editor, html)).trigger('change');
      }

    };

    return this.each(function () {

      var $modal = $(this),
        $load = $modal.find('.spf-modal-load'),
        $content = $modal.find('.spf-modal-content'),
        $insert = $modal.find('.spf-modal-insert'),
        $loading = $modal.find('.spf-modal-loading'),
        $select = $modal.find('select'),
        modal_id = $modal.data('modal-id'),
        nonce = $modal.data('nonce'),
        editor_id,
        target_id,
        gutenberg_id,
        sc_key,
        sc_name,
        sc_view,
        sc_group,
        $cloned,
        $button;

      $(document).on('click', '.spf-shortcode-button[data-modal-id="' + modal_id + '"]', function (e) {

        e.preventDefault();

        $button = $(this);
        editor_id = $button.data('editor-id') || false;
        target_id = $button.data('target-id') || false;
        gutenberg_id = $button.data('gutenberg-id') || false;

        $modal.show();

        // single usage trigger first shortcode
        if ($modal.hasClass('spf-shortcode-single') && sc_name === undefined) {
          $select.trigger('change');
        }

      });

      $select.on('change', function () {

        var $option = $(this);
        var $selected = $option.find(':selected');

        sc_key = $option.val();
        sc_name = $selected.data('shortcode');
        sc_view = $selected.data('view') || 'normal';
        sc_group = $selected.data('group') || sc_name;

        $load.empty();

        if (sc_key) {

          $loading.show();

          window.wp.ajax.post('spf-get-shortcode-' + modal_id, {
            shortcode_key: sc_key,
            nonce: nonce
          })
            .done(function (response) {

              $loading.hide();

              var $appended = $(response.content).appendTo($load);

              $insert.parent().removeClass('hidden');

              $cloned = $appended.find('.spf--repeat-shortcode').spf_clone();

              $appended.spf_reload_script();
              $appended.find('.spf-fields').spf_reload_script();

            });

        } else {

          $insert.parent().addClass('hidden');

        }

      });

      $insert.on('click', function (e) {

        e.preventDefault();

        var shortcode = '';
        var serialize = $modal.find('.spf-field:not(.hidden)').find(':input').serializeObjectSP_WCS();

        switch (sc_view) {

          case 'contents':
            var contentsObj = (sc_name) ? serialize[sc_name] : serialize;
            $.each(contentsObj, function (sc_key, sc_value) {
              var sc_tag = (sc_name) ? sc_name : sc_key;
              shortcode += '[' + sc_tag + ']' + sc_value + '[/' + sc_tag + ']';
            });
            break;

          case 'group':

            shortcode += '[' + sc_name;
            $.each(serialize[sc_name], function (sc_key, sc_value) {
              shortcode += base.shortcode_tags(sc_key, sc_value);
            });
            shortcode += ']';
            shortcode += base.shortcode_parse(serialize[sc_group], sc_group);
            shortcode += '[/' + sc_name + ']';

            break;

          case 'repeater':
            shortcode += base.shortcode_parse(serialize[sc_group], sc_group);
            break;

          default:
            shortcode += base.shortcode_parse(serialize);
            break;

        }

        if (gutenberg_id) {

          var content = window.spf_gutenberg_props.attributes.hasOwnProperty('shortcode') ? window.spf_gutenberg_props.attributes.shortcode : '';
          window.spf_gutenberg_props.setAttributes({ shortcode: content + shortcode });

        } else if (editor_id) {

          base.send_to_editor(shortcode, editor_id);

        } else {

          var $textarea = (target_id) ? $(target_id) : $button.parent().find('textarea');
          $textarea.val(base.insertAtChars($textarea, shortcode)).trigger('change');

        }

        $modal.hide();

      });

      $modal.on('click', '.spf--repeat-button', function (e) {

        e.preventDefault();

        var $repeatable = $modal.find('.spf--repeatable');
        var $new_clone = $cloned.spf_clone();
        var $remove_btn = $new_clone.find('.spf-repeat-remove');

        var $appended = $new_clone.appendTo($repeatable);

        $new_clone.find('.spf-fields').spf_reload_script();

        SP_WCS.helper.name_nested_replace($modal.find('.spf--repeat-shortcode'), sc_group);

        $remove_btn.on('click', function () {

          $new_clone.remove();

          SP_WCS.helper.name_nested_replace($modal.find('.spf--repeat-shortcode'), sc_group);

        });

      });

      $modal.on('click', '.spf-modal-close, .spf-modal-overlay', function () {
        $modal.hide();
      });

    });
  };

  //
  // Helper Checkbox Checker
  //
  $.fn.spf_checkbox = function () {
    return this.each(function () {

      var $this = $(this),
        $input = $this.find('.spf--input'),
        $checkbox = $this.find('.spf--checkbox');

      $checkbox.on('click', function () {
        $input.val(Number($checkbox.prop('checked'))).trigger('change');
      });

    });
  };

  //
  // Field: wp_editor
  //
  $.fn.spf_field_wp_editor = function () {
    return this.each(function () {

      if (typeof window.wp.editor === 'undefined' || typeof window.tinyMCEPreInit === 'undefined' || typeof window.tinyMCEPreInit.mceInit.spf_wp_editor === 'undefined') {
        return;
      }

      var $this = $(this),
        $editor = $this.find('.spf-wp-editor'),
        $textarea = $this.find('textarea');

      // If there is wp-editor remove it for avoid dupliated wp-editor conflicts.
      var $has_wp_editor = $this.find('.wp-editor-wrap').length || $this.find('.mce-container').length;

      if ($has_wp_editor) {
        $editor.empty();
        $editor.append($textarea);
        $textarea.css('display', '');
      }

      // Generate a unique id
      var uid = SP_WCS.helper.uid('spf-editor-');

      $textarea.attr('id', uid);

      // Get default editor settings
      var default_editor_settings = {
        tinymce: window.tinyMCEPreInit.mceInit.spf_wp_editor,
        quicktags: window.tinyMCEPreInit.qtInit.spf_wp_editor
      };

      // Get default editor settings
      var field_editor_settings = $editor.data('editor-settings');

      // Add on change event handle
      var editor_on_change = function (editor) {
        editor.on('change', SP_WCS.helper.debounce(function () {
          editor.save();
          $textarea.trigger('change');
        }, 250));
      };

      // Extend editor selector and on change event handler
      default_editor_settings.tinymce = $.extend({}, default_editor_settings.tinymce, { selector: '#' + uid, setup: editor_on_change });

      // Override editor tinymce settings
      if (field_editor_settings.tinymce === false) {
        default_editor_settings.tinymce = false;
        $editor.addClass('spf-no-tinymce');
      }

      // Override editor quicktags settings
      if (field_editor_settings.quicktags === false) {
        default_editor_settings.quicktags = false;
        $editor.addClass('spf-no-quicktags');
      }

      // Wait until :visible
      var interval = setInterval(function () {
        if ($this.is(':visible')) {
          window.wp.editor.initialize(uid, default_editor_settings);
          clearInterval(interval);
        }
      });

      // Add Media buttons
      if (field_editor_settings.media_buttons && window.spf_media_buttons) {

        var $editor_buttons = $editor.find('.wp-media-buttons');

        if ($editor_buttons.length) {

          $editor_buttons.find('.spf-shortcode-button').data('editor-id', uid);

        } else {

          var $media_buttons = $(window.spf_media_buttons);

          $media_buttons.find('.spf-shortcode-button').data('editor-id', uid);

          $editor.prepend($media_buttons);

        }

      }

    });

  };

  //
  // Siblings
  //
  $.fn.spf_siblings = function () {
    return this.each(function () {

      var $this = $(this),
        $siblings = $this.find('.spf--sibling'),
        multiple = $this.data('multiple') || false;

      $siblings.on('click', function () {

        var $sibling = $(this);

        if (multiple) {

          if ($sibling.hasClass('spf--active')) {
            $sibling.removeClass('spf--active');
            $sibling.find('input').prop('checked', false).trigger('change');
          } else {
            $sibling.addClass('spf--active');
            $sibling.find('input').prop('checked', true).trigger('change');
          }

        } else {

          $this.find('input').prop('checked', false);
          $sibling.find('input').prop('checked', true).trigger('change');
          $sibling.addClass('spf--active').siblings().removeClass('spf--active');

        }

      });

    });
  };

  //
  // WP Color Picker
  //
  if (typeof Color === 'function') {

    Color.fn.toString = function () {

      if (this._alpha < 1) {
        return this.toCSS('rgba', this._alpha).replace(/\s+/g, '');
      }

      var hex = parseInt(this._color, 10).toString(16);

      if (this.error) { return ''; }

      if (hex.length < 6) {
        for (var i = 6 - hex.length - 1; i >= 0; i--) {
          hex = '0' + hex;
        }
      }

      return '#' + hex;

    };

  }

  SP_WCS.funcs.parse_color = function (color) {

    var value = color.replace(/\s+/g, ''),
      trans = (value.indexOf('rgba') !== -1) ? parseFloat(value.replace(/^.*,(.+)\)/, '$1') * 100) : 100,
      rgba = (trans < 100) ? true : false;

    return { value: value, transparent: trans, rgba: rgba };

  };

  $.fn.spf_color = function () {
    return this.each(function () {

      var $input = $(this),
        picker_color = SP_WCS.funcs.parse_color($input.val()),
        palette_color = window.spf_vars.color_palette.length ? window.spf_vars.color_palette : true,
        $container;

      // Destroy and Reinit
      if ($input.hasClass('wp-color-picker')) {
        $input.closest('.wp-picker-container').after($input).remove();
      }

      $input.wpColorPicker({
        palettes: palette_color,
        change: function (event, ui) {

          var ui_color_value = ui.color.toString();

          $container.removeClass('spf--transparent-active');
          $container.find('.spf--transparent-offset').css('background-color', ui_color_value);
          $input.val(ui_color_value).trigger('change');

        },
        create: function () {

          $container = $input.closest('.wp-picker-container');

          var a8cIris = $input.data('a8cIris'),
            $transparent_wrap = $('<div class="spf--transparent-wrap">' +
              '<div class="spf--transparent-slider"></div>' +
              '<div class="spf--transparent-offset"></div>' +
              '<div class="spf--transparent-text"></div>' +
              '<div class="spf--transparent-button button button-small">transparent</div>' +
              '</div>').appendTo($container.find('.wp-picker-holder')),
            $transparent_slider = $transparent_wrap.find('.spf--transparent-slider'),
            $transparent_text = $transparent_wrap.find('.spf--transparent-text'),
            $transparent_offset = $transparent_wrap.find('.spf--transparent-offset'),
            $transparent_button = $transparent_wrap.find('.spf--transparent-button');

          if ($input.val() === 'transparent') {
            $container.addClass('spf--transparent-active');
          }

          $transparent_button.on('click', function () {
            if ($input.val() !== 'transparent') {
              $input.val('transparent').trigger('change').removeClass('iris-error');
              $container.addClass('spf--transparent-active');
            } else {
              $input.val(a8cIris._color.toString()).trigger('change');
              $container.removeClass('spf--transparent-active');
            }
          });

          $transparent_slider.slider({
            value: picker_color.transparent,
            step: 1,
            min: 0,
            max: 100,
            slide: function (event, ui) {

              var slide_value = parseFloat(ui.value / 100);
              a8cIris._color._alpha = slide_value;
              $input.wpColorPicker('color', a8cIris._color.toString());
              $transparent_text.text((slide_value === 1 || slide_value === 0 ? '' : slide_value));

            },
            create: function () {

              var slide_value = parseFloat(picker_color.transparent / 100),
                text_value = slide_value < 1 ? slide_value : '';

              $transparent_text.text(text_value);
              $transparent_offset.css('background-color', picker_color.value);

              $container.on('click', '.wp-picker-clear', function () {

                a8cIris._color._alpha = 1;
                $transparent_text.text('');
                $transparent_slider.slider('option', 'value', 100);
                $container.removeClass('spf--transparent-active');
                $input.trigger('change');

              });

              $container.on('click', '.wp-picker-default', function () {

                var default_color = SP_WCS.funcs.parse_color($input.data('default-color')),
                  default_value = parseFloat(default_color.transparent / 100),
                  default_text = default_value < 1 ? default_value : '';

                a8cIris._color._alpha = default_value;
                $transparent_text.text(default_text);
                $transparent_slider.slider('option', 'value', default_color.transparent);

              });

              $container.on('click', '.wp-color-result', function () {
                $transparent_wrap.toggle();
              });

              $('body').on('click.wpcolorpicker', function () {
                $transparent_wrap.hide();
              });

            }
          });
        }
      });

    });
  };

  //
  // ChosenJS
  //
  $.fn.spf_chosen = function () {
    return this.each(function () {

      var $this = $(this),
        $inited = $this.parent().find('.chosen-container'),
        is_multi = $this.attr('multiple') || false,
        set_width = is_multi ? '100%' : 'auto',
        set_options = $.extend({
          allow_single_deselect: true,
          disable_search_threshold: 15,
          width: set_width
        }, $this.data());

      if ($inited.length) {
        $inited.remove();
      }

      $this.chosen(set_options);

    });
  };

  //
  // Number (only allow numeric inputs)
  //
  $.fn.spf_number = function () {
    return this.each(function () {

      $(this).on('keypress', function (e) {

        if (e.keyCode !== 0 && e.keyCode !== 8 && e.keyCode !== 45 && e.keyCode !== 46 && (e.keyCode < 48 || e.keyCode > 57)) {
          return false;
        }

      });

    });
  };

  //
  // Help Tooltip
  //
  $.fn.spf_help = function () {
    return this.each(function () {

      var $this = $(this),
        $tooltip,
        offset_left;

      $this.on({
        mouseenter: function () {
          $tooltip = $('<div class="spf-tooltip"></div>').html($this.find('.spf-help-text').html()).appendTo('body');
          offset_left = (SP_WCS.vars.is_rtl) ? ($this.offset().left - $tooltip.outerWidth()) : ($this.offset().left + 24);

          $tooltip.css({
            top: $this.offset().top - (($tooltip.outerHeight() / 2) - 14),
            left: offset_left,
          });
        },
        mouseleave: function () {
          if ($tooltip !== undefined) {
            $tooltip.remove();
          }
        }
      });
    });
  };

  //
  // Customize Refresh
  //
  $.fn.spf_customizer_refresh = function () {
    return this.each(function () {

      var $this = $(this),
        $complex = $this.closest('.spf-customize-complex');

      if ($complex.length) {

        var $input = $complex.find(':input'),
          $unique = $complex.data('unique-id'),
          $option = $complex.data('option-id'),
          obj = $input.serializeObjectSP_WCS(),
          data = (!$.isEmptyObject(obj)) ? obj[$unique][$option] : '',
          control = wp.customize.control($unique + '[' + $option + ']');

        // clear the value to force refresh.
        control.setting._value = null;

        control.setting.set(data);

      } else {

        $this.find(':input').first().trigger('change');

      }

      $(document).trigger('spf-customizer-refresh', $this);

    });
  };

  //
  // Customize Listen Form Elements
  //
  $.fn.spf_customizer_listen = function (options) {

    var settings = $.extend({
      closest: false,
    }, options);

    return this.each(function () {

      if (window.wp.customize === undefined) { return; }

      var $this = (settings.closest) ? $(this).closest('.spf-customize-complex') : $(this),
        $input = $this.find(':input'),
        unique_id = $this.data('unique-id'),
        option_id = $this.data('option-id');

      if (unique_id === undefined) { return; }

      $input.on('change keyup', SP_WCS.helper.debounce(function () {

        var obj = $this.find(':input').serializeObjectSP_WCS();

        if (!$.isEmptyObject(obj) && obj[unique_id]) {

          window.wp.customize.control(unique_id + '[' + option_id + ']').setting.set(obj[unique_id][option_id]);

        }

      }, 250));

    });
  };

  //
  // Customizer Listener for Reload JS
  //
  $(document).on('expanded', '.control-section-spf', function () {

    var $this = $(this);

    if ($this.hasClass('open') && !$this.data('inited')) {
      $this.spf_dependency();
      $this.find('.spf-customize-field').spf_reload_script({ dependency: false });
      $this.find('.spf-customize-complex').spf_customizer_listen();
      $this.data('inited', true);
    }

  });

  //
  // Window on resize
  //
  SP_WCS.vars.$window.on('resize spf.resize', SP_WCS.helper.debounce(function (event) {

    var window_width = navigator.userAgent.indexOf('AppleWebKit/') > -1 ? SP_WCS.vars.$window.width() : window.innerWidth;

    if (window_width <= 782 && !SP_WCS.vars.onloaded) {
      $('.spf-section').spf_reload_script();
      SP_WCS.vars.onloaded = true;
    }

  }, 200)).trigger('spf.resize');

  //
  // Widgets Framework
  //
  $.fn.spf_widgets = function () {
    if (this.length) {

      $(document).on('widget-added widget-updated', function (event, $widget) {
        $widget.find('.spf-fields').spf_reload_script();
      });

      $('.widgets-sortables, .control-section-sidebar').on('sortstop', function (event, ui) {
        ui.item.find('.spf-fields').spf_reload_script_retry();
      });

      $(document).on('click', '.widget-top', function (event) {
        $(this).parent().find('.spf-fields').spf_reload_script();
      });

    }
  };

  //
  // Retry Plugins
  //
  $.fn.spf_reload_script_retry = function () {
    return this.each(function () {

      var $this = $(this);

      if ($this.data('inited')) {
        $this.children('.spf-field-wp_editor').spf_field_wp_editor();
      }

    });
  };

  //
  // Reload Plugins
  //
  $.fn.spf_reload_script = function (options) {

    var settings = $.extend({
      dependency: true,
    }, options);

    return this.each(function () {

      var $this = $(this);

      // Avoid for conflicts
      if (!$this.data('inited')) {

        // Field plugins
        $this.children('.spf-field-accordion').spf_field_accordion();
        $this.children('.spf-field-backup').spf_field_backup();
        $this.children('.spf-field-background_adv').spf_field_background();
        $this.children('.spf-field-background').spf_field_background();
        $this.children('.spf-field-code_editor').spf_field_code_editor();
        $this.children('.spf-field-date').spf_field_date();
        $this.children('.spf-field-fieldset').spf_field_fieldset();
        $this.children('.spf-field-gallery').spf_field_gallery();
        $this.children('.spf-field-group').spf_field_group();
        $this.children('.spf-field-icon').spf_field_icon();
        $this.children('.spf-field-media').spf_field_media();
        $this.children('.spf-field-repeater').spf_field_repeater();
        $this.children('.spf-field-slider').spf_field_slider();
        $this.children('.spf-field-sortable').spf_field_sortable();
        $this.children('.spf-field-sorter').spf_field_sorter();
        $this.children('.spf-field-spinner').spf_field_spinner();
        $this.children('.spf-field-switcher').spf_field_switcher();
        $this.children('.spf-field-tabbed').spf_field_tabbed();
        $this.children('.spf-field-typography').spf_field_typography();
        $this.children('.spf-field-upload').spf_field_upload();
        $this.children('.spf-field-wp_editor').spf_field_wp_editor();

        // Field colors
        $this.children('.spf-field-gradient_color').find('.spf-color').spf_color();
        $this.children('.spf-field-border').find('.spf-color').spf_color();
        $this.children('.spf-field-box_shadow').find('.spf-color').spf_color();
        $this.children('.spf-field-dimensions_advanced').find('.spf-color').spf_color();
        $this.children('.spf-field-background_adv').find('.spf-color').spf_color();
        $this.children('.spf-field-background').find('.spf-color').spf_color();
        $this.children('.spf-field-color').find('.spf-color').spf_color();
        $this.children('.spf-field-color_group').find('.spf-color').spf_color();
        $this.children('.spf-field-link_color').find('.spf-color').spf_color();
        $this.children('.spf-field-typography').find('.spf-color').spf_color();

        // Field allows only number
        $this.children('.spf-field-dimensions').find('.spf-number').spf_number();
        $this.children('.spf-field-slider').find('.spf-number').spf_number();
        $this.children('.spf-field-spacing').find('.spf-number').spf_number();
        $this.children('.spf-field-column').find('.spf-number').spf_number();
        $this.children('.spf-field-dimensions_advanced').find('.spf-number').spf_number();
        $this.children('.spf-field-spinner').find('.spf-number').spf_number();
        $this.children('.spf-field-typography').find('.spf-number').spf_number();

        // Field chosenjs
        $this.children('.spf-field-select').find('.spf-chosen').spf_chosen();
        $this.children('.spf-field-selectf').find('.spf-chosen').spf_chosen();

        // Field Checkbox
        $this.children('.spf-field-checkbox').find('.spf-checkbox').spf_checkbox();

        // Field Siblings
        $this.children('.spf-field-button_set').find('.spf-siblings').spf_siblings();
        $this.children('.spf-field-button_setf').find('.spf-siblings').spf_siblings();
        $this.children('.spf-field-image_select').find('.spf-siblings').spf_siblings();
        $this.children('.spf-field-carousel_type').find('.spf-siblings').spf_siblings();
        $this.children('.spf-field-palette').find('.spf-siblings').spf_siblings();

        // Help Tooptip
        $this.children('.spf-field').find('.spf-help').spf_help();

        if (settings.dependency) {
          $this.spf_dependency();
        }

        $this.data('inited', true);

        $(document).trigger('spf-reload-script', $this);

      }

    });
  };

  //
  // Document ready and run scripts
  //
  $(document).ready(function () {

    $('.spf-save').spf_save();
    $('.spf-confirm').spf_confirm();
    $('.spf-nav-options').spf_nav_options();
    $('.spf-nav-metabox').spf_nav_metabox();
    $('.spf-sticky-header').spf_sticky();
    $('.spf-taxonomy').spf_taxonomy();
    $('.spf-shortcode').spf_shortcode();
    $('.spf-page-templates').spf_page_templates();
    $('.spf-post-formats').spf_post_formats();
    $('.spf-onload').spf_reload_script();
    $('.widget').spf_widgets();

  });
  $("select option:contains((Pro))").attr('disabled', true).css('opacity', '0.8');
  $("label:contains((Pro))").css({ 'pointer-events': 'none' }).css('opacity', '0.8');
  $('#spf-section-sp_wcsp_shortcode_banner_options_1 .wcsp-scode-wrap .wcsp-scode-content .selectable').click(function (e) {
    e.preventDefault();
    wcsp_copyToClipboard($(this));
    wcsp_SelectText($(this));
    $(this).focus().select();
    jQuery(".wcsp-after-copy-text").animate({
      opacity: 1,
      top: 36
    }, 300);
    setTimeout(function () {
      jQuery(".wcsp-after-copy-text").animate({
        opacity: 0,
      }, 200);
      jQuery(".wcsp-after-copy-text").animate({
        top: 0
      }, 0);
    }, 2000);
  });
  // $("._wcsp_output input[type='text']").click(function () {
  //   $(this).select();
  // });
  $('.post-type-sp_wcslider .column-shortcode input').click(function (e) {
    e.preventDefault();
    /* Get the text field */
    var copyText = $(this);
    /* Select the text field */
    copyText.select();
    document.execCommand("copy");
    jQuery(".wcsp-after-copy-text").animate({
      opacity: 1,
      top: 36
    }, 300);
    setTimeout(function () {
      jQuery(".wcsp-after-copy-text").animate({
        opacity: 0,
      }, 200);
      jQuery(".wcsp-after-copy-text").animate({
        top: 0
      }, 0);
    }, 2000);
  });
  function wcsp_copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
  }
  function wcsp_SelectText(element) {
    var r = document.createRange();
    var w = element.get(0);
    r.selectNodeContents(w);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  // Woo-Category-Slider export.
  var $export_type = $('.wcsp_what_export').find('input:checked').val();
  $('.wcsp_what_export').on('change', function () {
    $export_type = $(this).find('input:checked').val();
  });

  $('.wcsp_export .spf--button').click(function (event) {
    event.preventDefault();
    var $shortcode_ids = $('.wcsp_post_ids select').val();
    var $ex_nonce = $('#spf_options_nonce').val();
    var selected_shortcode = $export_type === 'selected_shortcodes' ? $shortcode_ids : 'all_shortcodes';
    if ($export_type === 'all_shortcodes' || $export_type === 'selected_shortcodes') {
      var data = {
        action: 'wcsp_export_shortcodes',
        wcsp_ids: selected_shortcode,
        nonce: $ex_nonce,
      }
    } else {
      $('.spf-form-result.spf-form-success').text('No carousel selected.').show();
      setTimeout(function () {
        $('.spf-form-result.spf-form-success').hide().text('');
      }, 3000);
    }
    $.post(ajaxurl, data, function (resp) {
      if (resp) {
        // Convert JSON Array to string.
        var json = JSON.stringify(resp);
        // Convert JSON string to BLOB.
        json = [json];
        var blob = new Blob(json);
        var link = document.createElement('a');
        var wcsp_time = $.now();
        link.href = window.URL.createObjectURL(blob);
        link.download = "woo-category-slider-pro-export-" + wcsp_time + ".json";
        link.click();
        $('.spf-form-result.spf-form-success').text('Exported successfully!').show();
        setTimeout(function () {
          $('.spf-form-result.spf-form-success').hide().text('');
          $('.wcsp_post_ids select').val('').trigger('chosen:updated');
        }, 3000);
      }
    });
  });

  // Category Slider import.
  $('.wcsp_import button.import').click(function (event) {
    event.preventDefault();
    var wcsp_shortcodes = $('#import').prop('files')[0];
    if ($('#import').val() != '') {
      var $im_nonce = $('#spf_options_nonce').val();
      var reader = new FileReader();
      reader.readAsText(wcsp_shortcodes);
      reader.onload = function (event) {
        var jsonObj = JSON.stringify(event.target.result);
        $.ajax({
          url: ajaxurl,
          type: 'POST',
          data: {
            shortcode: jsonObj,
            action: 'wcsp_import_shortcodes',
            nonce: $im_nonce,
          },
          success: function (resp) {
            $('.spf-form-result.spf-form-success').text('Imported successfully!').show();
            setTimeout(function () {
              $('.spf-form-result.spf-form-success').hide().text('');
              $('#import').val('');
              window.location.replace($('#wcsp_shortcode_link_redirect').attr('href'));
            }, 2000);
          }
        });
      }
    } else {
      $('.spf-form-result.spf-form-success').text('No exported json file chosen.').show();
      setTimeout(function () {
        $('.spf-form-result.spf-form-success').hide().text('');
      }, 3000);
    }
  });

   // Live Preview script.
   var preview_box = $('#sp-wcs-preview-box');
   var preview_display = $('#sp_wcsp_live_preview').hide();
   $(document).on('click', '#sp-wcsp-show-preview:contains(Hide)', function (e) {
     e.preventDefault();
     var _this = $(this);
     _this.html('<i class="fa fa-eye" aria-hidden="true"></i> Show Preview');
     preview_box.html('');
     preview_display.hide();
   });
   $(document).on('click', '#sp-wcsp-show-preview:not(:contains(Hide))', function (e) {
     e.preventDefault();
     var _data = $('form#post').serialize();
     var _this = $(this);
     var data = {
       action: 'sp_wcsp_preview_meta_box',
       data: _data,
       ajax_nonce: $('#spf_metabox_nonce').val()
     };
     $.ajax({
       type: "POST",
       url: ajaxurl,
       data: data,
       error: function (response) {
         console.log(response)
       },
       success: function (response) {
         preview_display.show();
         preview_box.html(response);
          _this.html('<i class="fa fa-eye-slash" aria-hidden="true"></i> Hide Preview');
          $(document).on('keyup change', '.post-type-sp_wcslider', function (e) {
            e.preventDefault();
            _this.html('<i class="fa fa-refresh" aria-hidden="true"></i> Update Preview');
          });
          $("html, body").animate({ scrollTop: preview_display.offset().top - 50 }, "slow");
       }
     })
   });

   $(document).on('keyup change', '.sp_wcslider_page_wcsp_settings #spf-form', function (e)  { 
    e.preventDefault();
    var $button = $(this).find('.spf-save');
    $button.css({"background-color": "#00C263", "pointer-events": "initial"}).val('Save Settings');
  });
 $('.sp_wcslider_page_wcsp_settings .spf-save').click(function(e) {
    e.preventDefault();
    $(this).css({"background-color": "#C5C5C6","pointer-events": "none"}).val('Changes Saved');
})

// Parent and child custom script.
$(document).on('click', function() {
  $('.wcsp-chosen-container-free .wcsp-chosen-drop').slideUp(0);
});

$('.wcsp-chosen-container-free').on('click',function(event) {
  event.stopPropagation();
  $('.wcsp-chosen-container-free .wcsp-chosen-drop').slideDown(0);
});

})(jQuery, window, document);
