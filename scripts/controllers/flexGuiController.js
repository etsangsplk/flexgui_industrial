﻿/*
 * Software License Agreement (Apache License)
 *
 * Copyright (c) 2016, PPM AS
 * Contact: laszlo.nagy@ppmas.no
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
*/

flexGuiCtrl.$inject = ['$scope', '$window', '$location', '$routeParams', '$sce', '$timeout', '$rootScope', '$interval', '$injector', '$cookies',
    'editorService', 'historyService', 'deviceService', 'imageService', 'fidgetService',
    'projectService', 'enumService', 'projectWindowService', 'variableService',
    'clipboardService', 'settingsWindowService', 'colorPickerService', 'helpService', 'popupService',
    'scriptManagerService', 'projectStorageService', 'diagnosticsService', 'backupService'];

function flexGuiCtrl($scope, $window, $location, $routeParams, $sce, $timeout, $rootScope, $interval, $injector, $cookies,
        editorService,
        historyService,
        deviceService,
        imageService,
        fidgetService,
        projectService,
        enumService,
        projectWindowService,
        variableService,
        clipboardService,
        settingsWindowService,
        colorPickerService,
        helpService,
        popupService,
        scriptManagerService,
        projectStorageService,
        diagnosticsService,
        backupService
        ) {

    Array.prototype.move = function (old_index, new_index) {
        if (new_index >= this.length) {
            var k = new_index - this.length;
            while ((k--) + 1) {
                this.push(undefined);
            }
        }
        this.splice(new_index, 0, this.splice(old_index, 1)[0]);
        return this; // for testing purposes
    };

    var trusted = {};

    //makes a URL to trusted, so it is possible to show on UI 
    $rootScope.toTrustedUrl = function (url) {
        return trusted[url] || (trusted[url] = $sce.trustAsResourceUrl(url))
    }

    //the root dir of screen
    $rootScope.screenRoot = $rootScope.screenRoot || 'views/screen.html';

    //window size
    $scope.windowWidth = 0;

    //belt size
    $scope.beltWidth = 120;
    $scope.parseNumber = Number;
    var changing = false;
    //enables pinch zoom funcionality on mobiles
    $scope.pinchZoom = function ($event) {
        if (!$rootScope.isMobile || changing || !settingsWindowService.pinchEnabled) return;

        //use constant scale to prevent jumpings caused by the scaled coordinates
        var scale = 0;
        switch($event.additionalEvent){
            case "pinchin":
                scale = - 0.02;
                break;
            case "pinchout":
                scale = + 0.02;
                break;
        }

        //disable pinchzoom while setting up the new
        changing = true;
        $timeout(function () { settingsWindowService.setViewScale(settingsWindowService.viewScale + scale); changing = false }, 100);
    }

    //cordova device ready event listener
    document.addEventListener("deviceready", function () {
        $rootScope.isMobile = true;
        console.log("Online: " + window.navigator.onLine);
    }, false);

    if (settingsWindowService.isStatVisible) {
        showAngularStats({
            "position": "topright",
            "digestTimeThreshold": 30,
            "logDigest": false,
            "logWatches": false,
            "htmlId": "angularPerformanceStats",
        });

        $("#angularPerformanceStats").css({ right: 20, top: 20 });
    }

    //if offline mode, then setup the demo parts
    if (settingsWindowService.offlineMode) {
        /*device service demo overrides*/
        projectStorageService.setMode('localStorage');
        deviceService.init = function () {
            console.log("Download local project");
            deviceService.connected = true;
            //projectStorageService.download();
        }
    }

    projectStorageService.init();

    $rootScope.project = projectService;
    $rootScope.device = deviceService;
    $scope.nodes = deviceService.nodes;
    $scope.colorPickerHandler = colorPickerService;

    $scope.accessLevelsEnum = enumService.accessLevelsEnum;
    $scope.screenTypesEnum = enumService.screenTypesEnum;

    $rootScope.fidgets = fidgetService;
    $rootScope.settings = settingsWindowService;
    $scope.localization = localization;
    $rootScope.projects = projectWindowService;
    projectWindowService.scope = $scope;

    $rootScope.editHandler = editorService;

    $scope.is_chrome = /chrome/i.test(navigator.userAgent);
    $scope.helpMessages = helpService;
    $scope.popup = popupService;

    $rootScope.images = imageService;


    $rootScope.settings.loadLocalStorage();

    $scope.blockUI = function (msg) {
        $rootScope.blockMessage = msg;
        $scope.$apply();
    };

    $scope.variables = variableService;

    $scope.unBlockUI = function () {
        $rootScope.blockMessage = null;
        $scope.$apply();
    };

    $scope.dragCorner = enumService.dragCorner;
    $scope.isModalVisible = function () {
        var visible = editorService.propertiesWindowVisible ||
            $rootScope.settings.visible ||
            $scope.projects.visible ||
            $rootScope.images.visible ||
            $scope.colorPickerModalVisible ||
            $scope.helpMessages.open != null ||
            $scope.popup.messages.length != 0 ||
            $rootScope.blockMessage != null;

        return visible;

    };

    $scope.historyHandler = historyService;
    $scope.clipboardHandler = clipboardService;

    $rootScope.drive = projectStorageService;
    $rootScope.extraButtonsForSettingsWindow = [];
    $rootScope.editScreen = function (screen) {
        historyService.saveState();
        projectService.setCurrentScreen(screen);
        editorService.editedFidget = screen;
        editorService.propertiesWindowVisible = true;
    }

    if (typeof ($.timeago) != "undefined") {
        jQuery.timeago.settings.strings = localization.currentLocal.timeago.settings.strings;
    }

    $window.scriptManager = scriptManagerService;

    $scope.activeRemoteView;
    $scope.setActiveRemoteView = function (fidget) {
        activeRemoteView = fidget;
    }

    $rootScope.addModal = function (name, src, ngIf) {
        $rootScope.modals[name] = {
            src: src,
            visible: false
        };

        $rootScope.$watch(function () { return eval(ngIf) }, function (nv, ov) { $rootScope.modals[name].visible = nv; }, true);
    }

    $rootScope.modals = {};
    $rootScope.addModal("addScreen", "views/addScreen.html", "projectService.addScreenVisible");
    $rootScope.addModal("propertiesWindow", "views/propertiesWindow.html", "editorService.propertiesWindowVisible");
    $rootScope.addModal("settingsWindow", "views/settingsWindow.html", "settingsWindowService.visible");
    $rootScope.addModal("imageExplorerWindow", "views/imageExplorerWindow.html", "imageService.visible");
    $rootScope.addModal("colorPickerWindow", "views/colorPickerWindow.html", "colorPickerService.colorPickerModalVisible");
    $rootScope.addModal("topicDetailsWindow", "views/topicDetailsWindow.html", "$rootScope.settings.topicDetails.visible");
    $rootScope.addModal("editTestItemWindow", "views/settings/diagnostics/testItemEditor.html", "diagnosticsService.isTestItemEditorOpen");
    $rootScope.addModal("diagnosticsResultWindow", "views/settings/diagnostics/result.html", "diagnosticsService.isResultOpen");

    $scope.$on("$locationChangeSuccess", function (event, newUrl) {
        //records the location to a global variable, because modules need to access it too
        var requestLocation = $location.path().substring(1);
        projectService.setCurrentScreenByName(requestLocation);
    });

    //makes and url friendly string from a custom string
    $scope.slugify = function (text) {
        return text.toString().toLowerCase()
          .replace(/\s+/g, '-')           // Replace spaces with -
          .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
          .replace(/\-\-+/g, '-')         // Replace multiple - with single -
          .replace(/^-+/, '')             // Trim - from start of text
          .replace(/-+$/, '');            // Trim - from end of text
    }

    $scope.onScreenClick = function (screen, $event) {
        $location.path(screen.properties.name);
    }

    //Prevents sanitizing of the HTML parameter. Only use for non-user input!
    $scope.toTrustedHTML = function (html) {
        return $sce.trustAsHtml(html);
    }

    //Makes the website go full screen
    $scope.goFullScreen = function () {
        window.document.documentElement.webkitRequestFullScreen();
    }

    $scope.logoStyles = {
        bottomRight: { position: 'relative', right: 10, bottom: 10 },
        bottomLeft: { position: 'relative', left: 10 + $scope.beltWidth, bottom: 10 },
        topRight: { position: 'relative', right: 10, top: 10 },
        topLeft: { position: 'relative', left: 10 + $scope.beltWidth, top: 10 }
    };

    $scope.copyHtmlById = function (id) {
        return $("#" + id).text();
    }
    deviceService.init($location);
    imageService.init($scope);
    editorService.init($scope.beltWidth);};