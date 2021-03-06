'use strict';

/**
* AngularJS Service for intercepting API requests and adding authorization
* info to them.
*
* @class authInterceptor
*/
angular.module('authoringEnvironmentApp').factory('authInterceptor', [
    '$injector',
    '$q',
    function ($injector, $q) {
        // NOTE: userAuth service is not injected directly, because it depends
        // on the $http service and the latter's provider uses this
        // authInterceptor service --> circular dependency.
        // We thus inject need to inject userAuth service on the fly (when it
        // is actually needed).

        return {
            request: function (config) {
                var endpoint,
                    token,
                    userAuth = $injector.get('userAuth');

                endpoint = Routing.generate(
                    'newscoop_gimme_articles_getarticles', {}, false);
                endpoint = endpoint.substring(1, endpoint.lastIndexOf('/'));

                if (config.url.indexOf(endpoint + '/') === -1) {
                    // do not modify the headers of anything else but the API
                    return config;
                }

                config.headers = config.headers || {};

                token = userAuth.token();
                if (token && !config.IS_AUTHORIZATION_HEADER) {
                    config.headers.Authorization = 'Bearer ' + token;
                }

                return config;
            },

            // If we receive an error response because authentication token
            // is invalid/expired, we handle it by displaying a login modal.
            //
            // If login succeeds and a new token is obtained, the failed http
            // request is transparently repeated with a correct token. If even
            // this retried request (recognized by a special marker flag in
            // request's http config) fails, the error is not further handled
            // and is passed to through to the other parts of the application.
            //
            // Other types of http errors are not handled here and are simply
            // passed through.
            responseError: function (response) {
                var configToRepeat,
                    failedRequestConfig,
                    retryDeferred,
                    userAuth,
                    $http;

                userAuth = $injector.get('userAuth');

                if (response.config.IS_RETRY) {
                    // Tried to retry the initial failed request but failed
                    // again --> forward the error without another retry (to
                    // avoid a possible infinite loop).
                    return $q.reject(response);
                }

                // NOTE: The API is not perfect yet and does not always return
                // 401 on authentication errors, thus we must also rely on the
                // error message (for now at least).
                if (response.status === 401 ||
                    response.statusText === 'OAuth2 authentication required'
                ) {
                    // Request failed due to invalid oAuth token - try to
                    // obtain a new token and then repeat the failed request.
                    failedRequestConfig = response.config;
                    retryDeferred = $q.defer();
                    $http = $injector.get('$http');
                    configToRepeat = angular.copy(failedRequestConfig);
                    configToRepeat.IS_RETRY = true;

                    userAuth.obtainToken()
                    .then(function (responseBody) {
                        $http(configToRepeat)
                        .then(function (newResponse) {
                            delete newResponse.config.IS_RETRY;
                            retryDeferred.resolve(newResponse);
                        })
                        .catch(function () {
                            retryDeferred.reject(response);
                        });
                    }, function (responseBody) {
                        userAuth.newTokenByLoginModal()
                        .then(function () {
                            // new token successfully obtained,
                            // repeat the request
                            $http(configToRepeat)
                            .then(function (newResponse) {
                                delete newResponse.config.IS_RETRY;
                                retryDeferred.resolve(newResponse);
                            })
                            .catch(function () {
                                retryDeferred.reject(response);
                            });
                        })
                        .catch(function () {
                            // obtaining new token failed, reject the request
                            retryDeferred.reject(response);
                        });
                    });

                    return retryDeferred.promise;
                } else {
                    // some non-authentication error occured, these kind of
                    // errors are not handled by this interceptor --> simply
                    // forward the error
                    return $q.reject(response);
                }
            }
        };
    }
]);
