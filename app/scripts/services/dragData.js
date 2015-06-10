'use strict';
angular.module('authoringEnvironmentApp').service('Dragdata', [
    '$log',
    function Dragdata($log) {
        this.converters = {
            'test': function ($e) {
                return {};
            },
            'image': function ($e) {
                return {
                    id: $e.attr('data-id'),
                    articleImageId: $e.attr('data-articleimageid'),
                    width: $e.attr('data-width')
                };
            },
            'slideshow': function ($e) {
                return { id: $e.attr('data-id'), };
            },
            'embed': function ($e) {
                return { id: $e.attr('data-id') };
            }
        };
        this.available = function () {
            var r = [];
            angular.forEach(this.converters, function (value, key) {
                r.push(key);
            });
            return r;
        };
        this.checkDraggable = function (element) {
            var type = element.attr('data-draggable-type');
            if (!type) {
                return 'error: a draggable element has not a ' +
                    'data-draggable-type attribute';
            }
            if (!(type in this.converters)) {
                return 'error: draggable type "' + type + '" is not supported';
            }
            return false;    // no errors
        };
        this.getData = function (element) {
            var type = element.attr('data-draggable-type');
            var converter = this.converters[type];
            var data = converter(element);
            data.type = type;
            return JSON.stringify(data);
        };
        this.getDropped = function (text) {
            var data = JSON.parse(text);
            switch (data.type) {
            case 'test':
                return $('<div>').text('test dropped');
            case 'image':
                return Aloha.jQuery('<div>')
                .addClass('aloha-image-block')
                .data({'id': data.id})
                .data({'articleimageid': data.articleImageId})
                .alohaBlock({'aloha-block-type': 'ImageBlock'});
            case 'slideshow':
                return Aloha.jQuery('<div>')
                .addClass('slideshow')
                .addClass('aloha-slideshow-block')
                .data({'id': data.id})
                .append(
                    $('<dropped-slideshow>').attr(
                        {'data-slideshow-id': data.id}
                    )
                )
                .alohaBlock({'aloha-block-type': 'SlideshowBlock'});
            case 'embed':
                return Aloha.jQuery('<div>')
                .addClass('snippet')
                .addClass('aloha-snippet-block')
                .data({'id': data.id})
                .append(
                    $('<dropped-snippet>').attr(
                        {'data-snippet-id': data.id}
                    )
                )
                .alohaBlock({'aloha-block-type': 'SnippetBlock'});
            default:
                $log.debug('getDropped function called on a malformed data ' +
                    'object, no known type into it');
            }
        };
    }
]);
