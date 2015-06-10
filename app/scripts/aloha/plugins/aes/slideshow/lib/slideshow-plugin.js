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
                    // First we have to find the SlideshowId
                    var slideshowId = $element.data('id');
                    // we need the AngularJS injector
                    var $injector = angular.element($('body')).injector();
                    $injector.invoke(function($rootScope, $compile) {
                        // finally place the element and $compile it into AngularJS
                        $element.empty().append($compile(
                            '<dropped-slideshow data-slideshow-id="'+slideshowId+'"></dropped-slideshow>'
                          )($rootScope));

                        $element.on('dragstart', function (e) {
                            var data = {
                                type: 'slideshow',
                                id: $element.attr('data-id')
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
                        var $this = jQuery(this);
                        var output = '';
                        if ($this.data('id') !== undefined) {
                            output += '<div class="slideshow aloha-slideshow-block" data-id="'+ parseInt($this.data('id')) +'"';
                            if ($this.data('slideshowAlign') !== undefined) {
                                output += ' align="'+ $this.data('slideshowAlign') +'"';
                            }
                            output += '></div>';
                        }

                        $this.replaceWith(output);
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
