'use strict';

// TODO: comment ... service for keeping  track of article snippets
// attached to the article
angular.module('authoringEnvironmentApp').service('snippets', [
    '$http',
    '$log',
    '$rootScope',
    'pageTracker',
    'article',
    'Snippet',
    function ($http, $log, $rootScope, pageTracker, article, Snippet) {
        /* more info about the page tracker in its tests */
        var self = this;

        article.promise.then(function (article) {
            self.article = article;
            self.attached = Snippet.getAllByArticle(
                article.number, article.language);
        });

        self.attached = [];  // list of snippets attached to the article
        self.inArticleBody = {};  // list of snippet IDs in article body


        // TODO: this.attach could be used for attaching... we already have
        // Snippet.attach(), now we need to add an API for notifying this
        // service that some snippet has been added / removed from article body
        // TODO: how to do that? check images service!
        // we have addToIncluded and removeFromIncluded... this must be called
        // from somewhere... in dropped snippet directive


        /**
        * Adds a particular snippet to the list of snippets included in
        * article body.
        *
        * @method addToIncluded
        * @param snippetId {Number} ID of the snippet
        */
        this.addToIncluded = function (snippetId) {
            this.inArticleBody[snippetId] = true;
            console.log('snippets in artcile body:', self.inArticleBody);
        };

        /**
        * Removes a particular snippet from the list of snippets included in
        * article body.
        *
        * @method removeFromIncluded
        * @param snippetId {Number} ID of the snippet
        */
        this.removeFromIncluded = function (snippetId) {
            delete this.inArticleBody[snippetId];
            console.log('snippets in artcile body:', self.inArticleBody);
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
        this.matchMaker = function (id) {
            return function (needle) {
                return parseInt(needle.id) === parseInt(id);
            };
        };



        /**
        * Attaches a single image to the article (using HTTP LINK). If the
        * image is already attached, it does not do anything.
        * If loadFromServer flag is set, it also retrieves detailed image info
        * after successfully attaching it to the article.
        *
        * @method attach
        * @param id {Number} ID of an image to attach
        * @param [loadFromServer=false] {Boolean} whether or not to retrieve
        *     image info from the server after attaching (useful if the image
        *     is uploaded from a computer)
        */
        this.attach = function (id, loadFromServer) {
            var link,
                match = this.matchMaker(id),
                url;

            if (_.find(this.attached, match)) {
                $log.debug('image already attached, ignoring attach request');
                return;
            }

            url = Routing.generate('newscoop_gimme_articles_linkarticle', {'number':service.article.number, 'language':service.article.language}, true);

            link = '<' + Routing.generate('newscoop_gimme_images_getimage', {'number':id}, true) + '>';

            /* this could cause some trouble depending on the
             * setting of the server (OPTIONS request), thus debug
             * log may be useful to reproduce the original
             * request */
            $log.debug('sending link request');
            $log.debug(url);
            $log.debug(link);

            $http({
                url: url,
                method: 'LINK',
                headers: { Link: link }
            }).success(function () {
                if (loadFromServer) {
                    // uploaded images need to be retrieved from server
                    // to get all image metadata
                    $http.get(
                        Routing.generate('newscoop_gimme_images_getimage', {'number':id}, true)
                    )
                    .success(function (data) {
                        service.attached.push(data);
                    });
                } else {
                    var image = _.find(service.displayed, match);
                    service.attached.push(image);
                }
            });
        };

        /**
        * Detaches a single image from the article (using HTTP UNLINK). If the
        * image is not attached to the article, it does not do anything.
        *
        * @method detach
        * @param id {Number} ID of an image to detach
        */
        this.detach = function (id) {
            var match = this.matchMaker(id);
            console.log('detaching..');
            if (_.find(this.attached, match)) {
                var url = Routing.generate('newscoop_gimme_articles_unlinkarticle', {'number':service.article.number, 'language':service.article.language}, true);
                var link = '<' + Routing.generate('newscoop_gimme_images_getimage', {'number':id}, true) + '>';
                /* this could cause some troubles depending on the
                 * setting of the server (OPTIONS request), thus debug
                 * log may be useful to reproduce the original
                 * request */
                $log.debug('sending an unlink request');
                $log.debug(url);
                $log.debug(link);
                $http({
                    url: url,
                    method: 'UNLINK',
                    headers: { Link: link }
                }).success(function () {
                    _.remove(service.attached, match);
                });
            } else {
                $log.debug('image already detached, ignoring attach request');
            }
        };



        /**
        * Searches for an image with the given ID in the list of images
        * attached to the article. If found, it returns the image.
        *
        * @method findAttached
        * @param id {Number} ID of the image
        * @return {Object|undefined} image object (undefined if image is not
        *     found)
        */
        this.findAttached = function (id) {
            return _.find(this.attached, this.matchMaker(id));
        };

        /**
        * Searches for an image with the given ID in the list of images
        * currently in the basket. If found, it returns the image.
        *
        * @method findCollected
        * @param id {Number} ID of the image
        * @return {Object|undefined} image object (undefined if image is not
        *     found)
        */
        this.findCollected = function (id) {
            return _.find(this.collected, this.matchMaker(id));
        };

        /**
        * Retrieves an image from the list of images attached to the article.
        * If the image is not found, it an error is raised.
        *
        * @method byId
        * @param id {Number} ID of the image
        * @return {Object} image object
        */
        this.byId = function (id) {
            var i = this.findAttached(id);
            if (i) {
                return i;
            } else {
                throw new Error('asking details about an image which is not attached to the article is not supported');
            }
        };

        /**
        * Checks if image is currently attached to the article or not.
        *
        * @method isAttached
        * @param id {Number} ID of the image
        * @return {String} true if image is attached to the article,
        *     false otherwise
        */
        this.isAttached = function (id) {
            return typeof this.findAttached(id) !== 'undefined';
        };

    }
]);
