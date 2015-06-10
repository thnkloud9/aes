'use strict';

/**
* AngularJS service for keeping track of which slideshows are attached to the
* current article being edited and which of those are used in article content.
*
* @class slideshows
*/
angular.module('authoringEnvironmentApp').service('slideshows', [
    '$log',
    'article',
    'Slideshow',
    function ($log, articleService, Slideshow) {
        var article = articleService.articleInstance,
            self = this;

        self.article = article;

        // list of slideshows attached to the article
        self.attached = Slideshow.getAllByArticle(
            article.articleId, article.language);

        // list of slideshow IDs in article body
        self.inArticleBody = {};

        /**
        * Adds a particular slideshow to the list of slideshows included in
        * article body.
        *
        * @method addToIncluded
        * @param slideshowId {Number} ID of the slideshow
        */
        self.addToIncluded = function (slideshowId) {
            self.inArticleBody[slideshowId] = true;
        };

        /**
        * Removes a particular slideshow from the list of slideshows 
        * included in article body.
        *
        * @method removeFromIncluded
        * @param slideshowId {Number} ID of the slideshow
        */
        self.removeFromIncluded = function (slideshowId) {
            delete self.inArticleBody[slideshowId];
        };


        /**
        * Creates and returns a comparison function. This functions accepts an
        * object with the "id" attribute as a parameter and returns true if
        * object.id is equal to the value of the "id" parameter passed to
        * the method. If not, the created comparison function returns false.
        *
        * @method matchMaker
        * @param id {Number} Value to which the object.id will be compared in
        *   the comparison function (can also be a numeric string).
        *   NOTE: before comparison the parameter is converted to integer
        *   using the built-in parseInt() function.
        *
        * @return {Function} Generated comparison function.
        */
        self.matchMaker = function (id) {
            return function (needle) {
                return parseInt(needle.id) === parseInt(id);
            };
        };

        /**
        * Attaches a single slideshow to the article. If the slideshow 
        * is already attached, it does not do anything. On successful server 
        * response it also updates the list of attached slideshows.
        *
        * @method addToArticle
        * @param slideshow {Object} Slideshow instance to attach
        * @param article {Object} article to which the slideshow should
        *   be attached.
        * @return {Object} promise object that is resolved when the slideshow
        *   has been successfully attached to the article
        */
        self.addToArticle = function (slideshow, article) {
            var match = self.matchMaker(slideshow.id),
                promise;

            if (_.find(self.attached, match)) {
                $log.warn('Slideshow', slideshow.id, 'is already attached.');
                return;
            }

            promise = slideshow.addToArticle(
                article.articleId, article.language);

            promise.then(function () {
                self.attached.push(slideshow);
            });
            return promise;
        };


        /**
        * Detaches a single image from the article. If the slideshow is not
        * attached to the article, it does not do anything.
        *
        * @method removeFromArticle
        * @param slideshow {Object} Slideshow instance to detach
        * @param article {Object} article from which the slideshow should
        *   be detached.
        * @return {Object} promise object that is resolved when the slideshow
        *   has been successfully detached from the article
        */
        self.removeFromArticle = function (slideshow, article) {
            var match = self.matchMaker(slideshow.id),
                promise;

            if (!_.find(self.attached, match)) {
                $log.warn('Slideshow', slideshow.id, 'is already detached.');
                return;
            }
            // XXX: perhaps add an extra check if slideshow is in article body?

            promise = slideshow.removeFromArticle(
                article.articleId, article.language);

            promise.then(function () {
                _.remove(self.attached, match);
            });

            return promise;
        };
    }
]);
