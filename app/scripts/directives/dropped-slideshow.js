'use strict';

/**
* A directive which turns an HTML placeholder into an object embedded
* in the article body (e.g. a video clip).
*
* @class droppedSlideshow
*/
angular.module('authoringEnvironmentApp').directive('droppedSlideshow', [
    function () {
        return {
            restrict: 'E',
            templateUrl: 'views/dropped-slideshow.html',
            controller: 'DroppedSlideshowCtrl',
            scope: {
                slideshowId: '@'
            },
            link: function postLink(scope, element, attrs, ctrl) {
                var slideshowId = parseInt(scope.slideshowId);

                element.find('.remove').on('click', function () {
                    // the parent is the actual Aloha block
                    element.parent().remove();

                    // notify controller about the removal
                    ctrl.slideshowRemoved(parseInt(scope.slideshowId, 10));
                });

                ctrl.init(slideshowId);
            }
        };
    }
]);
