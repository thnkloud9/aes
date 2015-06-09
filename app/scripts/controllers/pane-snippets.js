'use strict';
angular.module('authoringEnvironmentApp').controller('PaneSnippetsCtrl', [
    '$scope',
    '$q',
    'article',
    'Snippet',
    'SnippetTemplate',
    'snippets',
    'modalFactory',
    'toaster',
    'TranslationService',
    function (
        $scope, $q, articleService, Snippet, SnippetTemplate, snippets,
        modalFactory, toaster, TranslationService
    ) {
        var article = articleService.articleInstance;

        /**
        * Resets all new snippet form fields.
        *
        * @method clearNewSnippetForm
        */
        $scope.clearNewSnippetForm = function () {
            $scope.newSnippet.name = '';
            $scope.newSnippet.template = null;

            // deep reset of all template fields' values
            $scope.snippetTemplates.forEach(function (template) {
                template.fields.forEach(function (field) {
                    delete field.value;
                });
            });
        };

        /**
        * Creates a new snippet and then attaches it to the article.
        *
        * @method addNewSnippetToArticle
        * @param snippetData {Object} object describing the new snippet
        *   @param snippetData.name {String} new snippet's name
        *   @param snippetData.template {Object} object describing snippet
        *     template used for the new snippet
        *     @param snippetData.template.id {Number} ID of the template
        *     @param snippetData.template.fields {Object} Array containing
        *       objects representing the template fields. Each object must
        *       have a "name" property and a "fromValue" property (value of
        *       the field as entered by user).
        */
        $scope.addNewSnippetToArticle = function (snippetData) {
            var fields = {},
                newSnippet;

            $scope.addingNewSnippet = true;

            snippetData.template.fields.forEach(function (field) {
                fields[field.name] = field.value;
            });

            Snippet.create(
                snippetData.name, snippetData.template.id, fields
            )
            .then(function (snippet) {
                newSnippet = snippet;
                return snippets.addToArticle(newSnippet, article).then(
                    function() {
                        toaster.add({
                            type: 'sf-info',
                            message: TranslationService.trans(
                                'aes.msgs.snippets.add.success'
                            )
                        });
                    }, function () {
                        toaster.add({
                            type: 'sf-error',
                            message: TranslationService.trans(
                                'aes.msgs.snippets.add.error'
                            )
                        });
                    }
                );
            }, function () {
                toaster.add({
                    type: 'sf-error',
                    message: TranslationService.trans(
                        'aes.msgs.snippets.add.error'
                    )
                });
                $q.reject
            })
            .then(function () {
                // hide form on successful add and clear its field
                $scope.showAddSnippet = false;
                $scope.clearNewSnippetForm();
            }, $q.reject)
            .finally(function () {
                $scope.addingNewSnippet = false;
            });
        };

        /**
        * Asks user to confirm detaching a snippet from the article and then
        * detaches a snippet, if the action is confirmed.
        *
        * @method confirmRemoveSnippet
        * @param snippet {Object} snippet to detach
        */
        $scope.confirmRemoveSnippet = function (snippet) {
            var modal,
                title,
                text;

            title = TranslationService.trans(
                'aes.msgs.snippets.remove.popupHead'
            );
            text = TranslationService.trans(
                'aes.msgs.snippets.remove.popup'
            );

            modal = modalFactory.confirmLight(title, text);

            modal.result.then(function () {
                // NOTE: detach snippet from article but don't delete it,
                // because it might be attached to some other article, too
                // (in theory at least)
                snippets.removeFromArticle(snippet, article).then(
                    function () {
                        toaster.add({
                            type: 'sf-info',
                            message: TranslationService.trans(
                                'aes.msgs.snippets.remove.success'
                            )
                        });
                    }, function () {
                        toaster.add({
                            type: 'sf-error',
                            message: TranslationService.trans(
                                'aes.msgs.snippets.remove.error'
                            )
                        });
                    }
                );
            });
        };

        /**
        * Determines whether a particular snippet is currently included in
        * article body or not.
        *
        * @method inArticleBody
        * @param snippetId {Number} ID of the snippet to check
        * @return {Boolean}
        */
        $scope.inArticleBody = function (snippetId) {
            return !!snippets.inArticleBody[snippetId];
        };

        $scope.showAddSnippet = false;

        $scope.newSnippet = {
            name: '',
            template: null
        };
        $scope.addingNewSnippet = false;

        $scope.inputFieldTypes = Object.freeze({
            integer: 'number',
            text: 'text',
            url: 'url'
        });

        $scope.snippetTemplates = SnippetTemplate.getAll();
        $scope.snippets = snippets.attached;

        $scope.$watchCollection(snippets.attached, function () {
            $scope.snippets = snippets.attached;
        });
    }
]);
