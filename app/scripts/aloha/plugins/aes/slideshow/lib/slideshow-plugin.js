define(['aloha', 'aloha/plugin', 'jquery',  'aloha/console', 'block/block', 'block/blockmanager'], 
        function(Aloha, Plugin, jQuery, Console, block, BlockManager) {

            var editable = null;
            var range = null;

            // Define Page Break Block
            var SlideshowBlock = block.AbstractBlock.extend({
                title: 'Slideshow',
                // we will use our own drag and drop directives
                // instead of alohas
                isDraggable: function() {return false;},
                init: function($element, postProcessFn) {
                    // First we have to find the articleSlideshowId
                    // we need the AngularJS injector
                    var $injector = angular.element($('body')).injector();
                    var contents = '';
                    $.each( $element.data(),function(name, value) {
                        if (name !== 'alohaBlockType') {
                            contents += ' data-slideshow-'+name+'="'+value+'"';
                        }
                    });

                    $injector.invoke(function($rootScope, $compile) {
                        // finally place the element and $compile it into AngularJS
                        $element.empty().append($compile('<div dropped-slideshow '+contents+'></div>')($rootScope));

                        // not sure exactly why, but we have to define our
                        // own handler for delete keypress
                        $element.on('keydown', function (e) {
                            if (e.keyCode === 8 || e.keyCode === 46)  {
                                e.preventDefault();
                                e.stopPropagation();
                                var cursorPosition = $(e.target).prop("selectionStart");
                                var currentText = $(e.target).val();
                                var newText = currentText.slice(0, cursorPosition - 1) + currentText.slice(cursorPosition);
                                $(e.target).val(newText);
                                $(e.target).focus();
                                e.target.selectionStart = cursorPosition - 1;
                                e.target.selectionEnd = cursorPosition - 1;
                            }
                        });

                        $element.on('dragstart', function (e) {
                            var data = {
                                type: 'slideshow',
                                id: $element.attr('data-id'),
                                articleSlideshowId: $element.attr('data-articleslideshowid'),
                                width: '100%' 
                            }
                            e.originalEvent.dataTransfer.setData('Text', JSON.stringify(data));
                        });

                        $element.on('dragend', function (e) {
                            var alohaEditable = Aloha.getEditableById(
                                $element.parent('.aloha-editable-active').attr('id')
                            );
                            $element.remove();
                            // emit texteditor-content-changed event here
                            Aloha.trigger('aloha-smart-content-changed', {
                                'editable': alohaEditable,
                                'triggerType': 'paste',
                                'snapshotContent': alohaEditable.getContents()
                            });
                        });
                    });

                    return postProcessFn();
                },
                update: function($element, postProcessFn) {

                    return postProcessFn();
                }
            });

            return Plugin.create('slideshow', {
                makeClean: function(obj) {
                    jQuery(obj).find('.aloha-block-SlideshowBlock').each(function() {
                        var $injector = angular.element($('body')).injector();
                        var $this = jQuery(this);
                        var output = '';
                        if ($this.data('articleslideshowid') !== undefined) {
                            output += '<div class="slideshow aloha-slideshow-block"';
                            var contents = '';
                            $.each( $this.data(),function(name, value) {
                                if (name !== 'width' &&
                                    name !== 'alohaBlockType' &&
                                    name !== 'sortableitem') {
                                    contents += ' data-'+name+'="'+value+'"';
                                }
                            });
                            var sizeInPx = $this.data('sizepixels');
                            // add width for newsccop render
                            if (sizeInPx) {
                                contents += ' data-width="' + sizeInPx.substring(0, sizeInPx.length - 2) + '"';
                            }

                            output += contents + '></div>';
                        }

                        $injector.invoke(function($rootScope, $compile) {
                            $this.replaceWith($compile(output)($rootScope));
                        });
                    });
                },
                   init: function () {
                       // Register this block
                       BlockManager.registerBlockType('SlideshowBlock', SlideshowBlock);

                       // When editor is initialised check if there is any page break in our content.
                       // If there is initiate Page Break Block for each of the elements.
                       Aloha.bind('aloha-editable-created', function(event, editable) {
                           Aloha.jQuery(editable.obj.find('div.slideshow')).alohaBlock({'aloha-block-type': 'SlideshowBlock'});
                       });

                       Aloha.bind('aloha-my-undo', function(event, args) {
                           args.editable.obj.find('div.slideshow').alohaBlock({'aloha-block-type': 'SlideshowBlock'});
                       });
                   }
            });
        }
);
