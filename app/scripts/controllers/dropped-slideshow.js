'use strict';
angular.module('authoringEnvironmentApp').controller('DroppedSlideshowCtrl', [
    '$scope',
    '$rootScope',
    '$q',
    'Slideshow',
    'slideshows',
    function ($scope, $rootScope, $q, Slideshow, slideshows) {

        $scope.slideshows = slideshows;

        /**
        * Initializes the controller - it finds the specified slideshow in the
        * list of slideshows attached to the article and adds it to
        * the slideshows-in-article list.
        *
        * @method init
        * @param articleSlideshowId {Number} ID of the 
        *  (slideshowId, articleId) pair
        *   (the pair denotes that a particluar slideshow is attached to
        *    a particular article)
        */
        this.init = function (slideshowId) {
            Slideshow.getById(slideshowId).then(function (slideshow) {
                $scope.slideshow = slideshow;
                slideshows.addToIncluded(slideshow.id);
            });
        };

        /**
        * Removes an slideshow from the slideshows-in-article list.
        *
        * @method slideshowRemoved
        * @param slideshowId {Number} ID of the slideshow to retrieve
        */
        this.slideshowRemoved = function (slideshowId) {
            slideshows.removeFromIncluded(slideshowId);
            $rootScope.$apply(slideshows.inArticleBody);
        };

        $scope.root = AES_SETTINGS.API.rootURI;
        $scope.slideshows = slideshows;
    }
]);
