'use strict';

/**
* AngularJS controller for managing a fixed image field in article body.
*
* @class FixedImagePlaceholderCtrl
*/
angular.module('authoringEnvironmentApp')
.controller('FixedImagePlaceholderCtrl', [
    '$scope',
    'images',
    function ($scope, images) {
        $scope.root = AES_SETTINGS.API.rootURI;
        $scope.style = {};
        // currently unused
        $scope.dropped = false;

        $scope.onDrop = function (data) {
            var parsed = JSON.parse(data);
            if ('image' === parsed.type) {
                $scope.$apply(function () {
                    $scope.image = images.byId(parsed.id);
                    $scope.style.opacity = 1;
                    $scope.dropped = true;
                });
            }
        };
    }
]);
