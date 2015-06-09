'use strict';
angular.module('authoringEnvironmentApp').controller('DroppedSlideshowCtrl', [
    'slideshows',
    '$scope',
    'NcSlideshow',
    '$rootScope',
    '$q',
    function (slideshows, $scope, NcSlideshow, $rootScope, $q) {

        /**
        * Initializes the controller - it finds the specified slideshow in the
        * list of slideshows attached to the article and adds it to
        * the slideshows-in-article list.
        *
        * @method init
        * @param articleSlideshowId {Number} ID of the (slideshowId, articleId) pair
        *   (the pair denotes that a particluar slideshow is attached to
        *    a particular article)
        */
        this.init = function (articleSlideshowId) {
            var deferred = $q.defer();

            slideshows.attachedLoaded.then(function () {
                $scope.slideshow = slideshows.byArticleSlideshowId(articleSlideshowId);
                slideshows.addToIncluded($scope.slideshow.id);
                $scope.newCaption = $scope.slideshow.description;

                deferred.resolve($scope.slideshow);
            });

            return deferred.promise;
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

        /**
        * Activates the editing slideshow caption mode.
        *
        * @method editCaptionMode
        * @param enabled {Boolean} whether to enable the mode or not
        */
        $scope.editCaptionMode = function (enabled) {
            if (enabled) {
                $scope.newCaption = $scope.slideshow.description;
            }
            $scope.editingCaption = enabled;
        };

        /**
        * Updates slideshow's caption on the server and exits the editing
        * caption mode.
        *
        * @method updateCaption
        */
        $scope.updateCaption = function () {
            $scope.editingCaption = false;

            $scope.slideshow.updateDescription($scope.newCaption)
            .catch(function () {
                $scope.newCaption = $scope.slideshow.description;
            });
        };

        /**
        * Updates slideshow's caption via paste event 
        * This is a hack to get around an issue with aloha 
        * and inline blocks where the active editable will steal
        * the slideshow captions paste event
        *
        * @method pasteCaption
        * @param event {Event} the paste event
        */
        $scope.pasteCaption = function (event) {
            $scope.newCaption = event.originalEvent
                .clipboardData.getData('text/plain');
        };

        $scope.editingCaption = false;
        $scope.newCaption = '';  // temp value of slideshow's new description

        $scope.root = AES_SETTINGS.API.rootURI;
        $scope.slideshows = slideshows;
    }
]);
