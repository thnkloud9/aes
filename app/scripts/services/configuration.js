'use strict';

angular.module('authoringEnvironmentApp')
    .factory('configuration', function () {
        return {
            image: {
                width: {
                    small: '30%',
                    medium: '50%',
                    big: '100%'
                },
                float: 'none'
            }
        };
    });
