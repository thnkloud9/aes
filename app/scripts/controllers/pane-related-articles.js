'use strict';

/**
* AngularJS controller for the RelatedArticles pane.
*
* @class PaneRelatedArticlesCtrl
*/
angular.module('authoringEnvironmentApp')
.controller('PaneRelatedArticlesCtrl', [
    '$q',
    'article',
    'modalFactory',
    'Publication',
    'Issue',
    'Section',
    'toaster',
    'TranslationService',
    function (
        $q,
        articleService,
        modalFactory,
        Publication,
        Issue,
        Section,
        toaster,
        TranslationService) {
        var self = this;

        self.article = articleService.articleInstance;
        self.articlesSearchResults = [];
        self.articlesSearchResultsListRetrieved = true;
        self.assignedRelatedArticles = [];
        self.assigningRelatedArticles = false;
        self.previewLoaded = true;

        // load initial filter select options
        self.availablePublications = Publication.getAll();
        self.availableIssues = Issue.getAll();
        self.availableSections = Section.getAll();

        // retrieve all relatedArticles assigned to the article
        self.assignedRelatedArticles = self.article.getRelatedArticles();

        /**
         * Loads options for all filter select fields
         *
         * @method loadAvailableFilters
         */
        self.loadAvailableFilters = function() {
            var filters = self.buildFilters();
            if (!self.issueFilter) {
                self.availableIssues = Issue.getAll(filters);
            }
            self.availableSections = Section.getAll(filters);
        };

        /**
         * Loads an article in the Related Articles preview pane
         *
         * @method previewReleatedArticle
         * @param article {Object} RelatedArtile
         */
        self.previewRelatedArticle = function(previewArticle) {
            self.clearPreview();

            previewArticle.loadFirstImage().then(function(firstImage) {
                // TODO: is this the best way to get full image url?
                var url = AES_SETTINGS.API.rootURI + '/images/';
                previewArticle.firstImage = (firstImage) ?
                    url + firstImage :
                    null;
            });
            previewArticle.loadContentFields().then(function(contentFields) {
                previewArticle.contentFields = contentFields;
                self.previewLoaded = true;
            });

            // use router to set articleUrl
            previewArticle.editorUrl = Routing.generate(
                'newscoop_admin_aes',
                {
                    articleNumber: previewArticle.articleId,
                    language: previewArticle.language
                },
                true
            );
 
            self.relatedArticlePreview = previewArticle;
            self.showArticlePreview = !self.showArticlePreview;
        };

        /**
         * Clears the Related Articles preview pane
         *
         * @method clearPreview 
         */
        self.clearPreview = function() {
            self.previewLoaded = false;
            // clear the current previewArticle
            if (self.relatedArticlePreview) {
                self.relatedArticlePreview.title = null;
                self.relatedArticlePreview.lead = null;
                self.relatedArticlePreview.firstImage = ' ';
                self.relatedArticlePreview.contentFields = null;
            }
            self.showArticlePreview = false;
        };

        /**
        * A handler to be called whenever the 
        * order of related articles changes.
        * It persists the new order on the server.
        * Used as a parameter to the drag-sort directive.
        *
        * @method orderChanged
        * @param item {Object} relatedArticle 
        * @param newIndex int position in list
        */
        self.orderChange = function(item, newIndex) {
            self.article.setOrderOfRelatedArticles(item, newIndex)
            .then(function () {
                toaster.add({
                    type: 'sf-info',
                    message: TranslationService.trans(
                        'aes.msgs.relatedarticles.order.success'
                    )
                });
            }, function () {
                toaster.add({
                    type: 'sf-error',
                    message: TranslationService.trans(
                        'aes.msgs.relatedarticles.order.error'
                    )
                });
            });
        };

        /**
        * Finds a list of relatedArticles that
        * can be assigned to the article based on
        * the search query. RelatedArticles that
        * are already selected or assigned to
        * the article are excluded from search results.
        *
        * @method loadSearchResults
        */
        self.loadSearchResults = function () {
            var ignored = {},
                filters = {},
                filtered,
                query;

            self.articlesSearchResults = [];
            self.articlesSearchResultsListRetrieved = false;

            /**
            * build a list of relatedArticle IDs 
            * to exclude from results (i.e. relatedArticles
            * that are already assigned to the article)
            */
            self.assignedRelatedArticles.forEach(function (assignedArticle) {
                ignored[assignedArticle.articleId] = true;
            });

            query = (self.query) ? self.query.toLowerCase() : '';
            filters = self.buildFilters();
            self.article.searchArticles(query, filters)
                .then(function (searchResults) {
                self.articlesSearchResultsListRetrieved = true;

                filtered = _.filter(searchResults, function (filterArticle) {
                    return (!(filterArticle.articleId in ignored));
                });

                self.articlesSearchResults = filtered;
            });
        };

        /**
        * Sets query and articleSearchResults to empty values 
        *
        * @method clearSearch
        */
        self.clearSearch = function () {
            self.articlesSearchResults = [];
            self.articlesSearchResultsListRetrieved = true;
            self.query = null;
        };

        /**
        * Returns an object continaing article search filters 
        *
        * @method assignSelectedToArticle
        * @return {Onject} containing article search filters
        */
        self.buildFilters = function () {
            var filters = {};

            if (self.publicationFilter) {
                filters.publication = self.publicationFilter.id;
            }
            if (self.issueFilter) {
                filters.issue = self.issueFilter.number;
            }
            if (self.sectionFilter) {
                filters.section = self.sectionFilter.number;
            }
            
            return filters;
        };

        /**
        * Assigns all currently selected relatedArticles
        * to the article and then clears
        * the selected relatedArticles list.
        *
        * @method assignSelectedToArticle
        */
        self.assignToArticle = function (relatedArticle) {
            self.assigningRelatedArticles = true;

            self.article.addRelatedArticle(relatedArticle)
                .then(function (relatedArticles) {
                self.assignedRelatedArticles.push(relatedArticle);
                self.loadSearchResults(self.query);
                toaster.add({
                    type: 'sf-info',
                    message: TranslationService.trans(
                        'aes.msgs.relatedarticles.pin.success'
                    )
                });
            }, function () {
                toaster.add({
                    type: 'sf-error',
                    message: TranslationService.trans(
                        'aes.msgs.relatedarticles.pin.error'
                    )
                });
            }).finally(function () {
                self.assigningRelatedArticles = false;
            });
        };

        /**
        * Asks user to confirm unassigning a 
        * relatedArticle from the article and then
        * unassignes the relatedArticle, if the 
        * action is confirmed.
        *
        * @method confirmUnassignRelatedArticle
        * @param relatedArticle {Object} relatedArticle 
        */
        self.confirmUnassignRelatedArticle = function (relatedArticle) {
            var modal,
                title,
                text;

            title = TranslationService.trans(
                'aes.msgs.relatedarticles.unpin.popupHead'
            );
            text = TranslationService.trans(
                'aes.msgs.relatedarticles.unpin.popup'
            );

            modal = modalFactory.confirmLight(title, text);

            modal.result.then(function () {
                return self.article.removeRelatedArticle(relatedArticle)
                    .then(function () {
                        toaster.add({
                            type: 'sf-info',
                            message: TranslationService.trans(
                                'aes.msgs.relatedarticles.unpin.success'
                            )
                        });
                    }, function () {
                        toaster.add({
                            type: 'sf-error',
                            message: TranslationService.trans(
                                'aes.msgs.relatedarticles.unpin.error'
                            )
                        });
                    });
            }, $q.reject)
            .then(function () {
                _.remove(
                    self.assignedRelatedArticles,
                    {articleId: relatedArticle.articleId}
                );
            });
        };
    }
]);
