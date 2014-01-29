'use strict';

angular.module('authoringEnvironmentApp')
  .service('Dragdata', ['$log', 'articleType', function Dragdata($log, articleType) {
      // AngularJS will instantiate a singleton by calling "new" on this function
      this.converters = {
          'test': function($e) {
              return {
              };
          },
          'image': function($e) {
              return {
                  src: $e.attr('src'),
                  width: $e.attr('data-width')
              };
          },
          'embed': function($e) {
              return {
                  id: $e.attr('data-id')
              };
          }
      };

      this.available = function() {
          var r = [];
          angular.forEach(this.converters, function(value, key) {
              r.push(key);
          });
          return r;
      };

    this.checkDraggable = function(element) {
        var type = element.attr('data-draggable-type');
        if (!type) {
            return 'error: a draggable element has not a data-draggable-type attribute';
        }
        if (!(type in this.converters)) {
            return 'error: draggable type "' + type + '" is not supported';
        }
        return false; // no errors
    };

    this.getData = function(element) {
        var type = element.attr('data-draggable-type');
        var converter = this.converters[type];
        var data = converter(element);
        data.type = type;
        return JSON.stringify(data);
    };

    this.getDropped = function(text) {
      var data = JSON.parse(text);
      switch (data.type) {
      case 'test':
        return $('<div>').text('test dropped');
        break;
      case 'image':
          return Aloha.jQuery('<div>')
              .append($('<img>').attr({
                  src: data.src,
                  style: 'width: ' + data.width
              }).popover({
                  title: 'Edit image',
                  placement: 'top',
                  trigger: 'hover'
              }))
              .addClass('dropped-image')
              .alohaBlock();
          break;
      case 'embed':
          return Aloha.jQuery('<div>')
              .append($('<dropped-snippet>').attr({
                  'snippet': 'byId(' + data.id + ')',
                  'ng-controller': 'SnippetsCtrl'
              }))
              .addClass('dropped-snippet')
              .alohaBlock();
          break;
      default:
        $log.debug('getDropped function called on a malformed data object, no known type into it');
      }
    };
  }]);
