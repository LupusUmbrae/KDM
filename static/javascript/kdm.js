(function() {
    'use strict';
    
    angular
    .module('kdm', [
    'kdm.config', 
    ]);
    
    angular
    .module('kdm.config', []);
    
    angular
    .module('kdm')
    .run(run);
    
    run.$inject = ['$rootScope', '$parse'];
    
    function jsonify(scope) {
        return JSON.stringify(scope.tabs);
    }
    
    function load(scope, json) {
        var parsed = JSON.parse(json);
        scope.tabs = parsed;
        scope.$apply();
    }
    
    function run($rootScope, $parse) {
        $rootScope.jsonify = function() {
            return jsonify($rootScope);
        }
        
        $rootScope.load = function(json) {
            load($rootScope, json);
        }
        
        $rootScope.addChar = function(json) {
            addNewChar($rootScope);
        }
        
        $rootScope.addSettlement = function(json) {
            addNewSettlement($rootScope);
        }
        
        $rootScope.deletetab = function(tabid) {
            deleteTab($rootScope, tabid);
        }
        
        $rootScope.tabs = [];
        
        var local = localStorage.getItem('kdm');
        if (local == null ) {
            addNewSettlement($rootScope);
            addNewChar($rootScope);
        } else {
            load($rootScope, local);
        }
        
        $rootScope.timeline = {};
        $rootScope.timeline.options = [];
        $rootScope.timeline.options.push("Story");
        $rootScope.timeline.options.push("Nemesis");
        
        $(function() {
            $("#load-dialog").dialog({
                autoOpen: false,
                resizable: true,
                height: 400,
                modal: true,
                buttons: {
                    "Load": function() {
                        $(this).dialog("close");
                        angular.element(document.body).scope().load($('textarea#loadjson').val());
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                }
            });
            
            $("#loadjson").click(function() {
                $("#load-dialog").dialog("open");
            });
            
            $("#save-dialog").dialog({
                autoOpen: false,
                resizable: true,
                height: 400,
                modal: true,
            });
            
            $("#savejson").click(function() {
                $('textarea#savejson').val(angular.element(document.body).scope().jsonify());
                $("#save-dialog").dialog("open");
            });
            
            $("#timeline-dialog").dialog({
                autoOpen: false,
                resizable: true,
                height: 160,
                modal: true,
                position: {
                    my: "center top",
                    at: "center top",
                    of: window
                },
                buttons: {
                    "Add Event": function() {
                        $(this).dialog("close");
                        
                        var openSettlement = $("div.active");
                        var settlementId = openSettlement.attr("id");
                        
                        var setYear = Number($(this).find("#year").val());
                        var setType = $(this).find("select").val();
                        var setEvent = $(this).find("#event").val();
                        var tab;
                        $rootScope.tabs.forEach(function(curTab) {
                            if (curTab.id === settlementId) {
                                tab = curTab;
                            }
                        });
                        
                        if (tab.type === "settlement" && Number.isInteger(setYear)) {
                            tab.timeline[setYear - 1].events.push({
                                type: setType.toLowerCase(),
                                eventName: setEvent
                            });
                            $rootScope.$apply();
                        }
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                }
            });
            
            $(function() {
                $("#clear-dialog").dialog({
                    autoOpen: false,
                    resizable: false,
                    height: 140,
                    modal: true,
                    buttons: {
                        "Clear": function() {
                            localStorage.clear();
                            $(this).dialog("close");
                            $rootScope.tabs = [];
                            addNewSettlement($rootScope);
                            addNewChar($rootScope);
                            $rootScope.$apply();
                        },
                        Cancel: function() {
                            $(this).dialog("close");
                        }
                    }
                });
            });
            
            $('#clearAll').click(function() {
                $("#clear-dialog").dialog("open");
            });
        });
        
        
        $rootScope.$watch('tabs', function(newVal, oldVal) {
            if (newVal !== undefined && oldVal !== undefined && newVal !== oldVal) 
            {
                localStorage.setItem('kdm', jsonify($rootScope));
            }
        }, true);
    }
    
    function addNewChar(scope) {
        var id = "tab-" + scope.tabs.length;
        addToTabs(scope, createEmptyCharSheet(id));
    }
    
    function addNewSettlement(scope) {
        var id = "tab-" + scope.tabs.length;
        addToTabs(scope, createEmptySettlement(id));
    }
    
    function addTimelineEvent(settlement, year, type, name) {
        settlement.timeline[year - 1].events.push({
            year: year,
            type: type,
            name: name
        });
    }
    
    function addToTabs(scope, kdm) {
        var tabs = scope.tabs;
        tabs.push(kdm);
        var lastIndex = tabs.length - 1;
        
        if (kdm.type === "char") {
            scope.$watch('tabs[' + lastIndex + '].courage.levels', watchCheckboxArray, true);
            scope.$watch('tabs[' + lastIndex + '].understanding.levels', watchCheckboxArray, true);
            scope.$watch('tabs[' + lastIndex + '].age', watchCheckboxArray, true);
            scope.$watch('tabs[' + lastIndex + '].weapon.levels', watchCheckboxArray, true);
        } else if (kdm.type === "settlement") {
            scope.$watch('tabs[' + lastIndex + '].population.lost', watchCheckboxArray, true);
            scope.$watch('tabs[' + lastIndex + '].deathCount', watchCheckboxArray, true);
            scope.$watch('tabs[' + lastIndex + '].timeline', watchCheckboxArray, true);
        }
        
        $('.nav-tabs li a').click(function(e) {
            e.preventDefault();
        });
    }
    
    function watchCheckboxArray(newVal, oldVal) {
        if (newVal !== undefined && oldVal !== undefined && newVal !== oldVal) 
        {
            // find the changed index
            var index = -1;
            for (var i = 0; i < newVal.length; i++) 
            {
                if (oldVal[i].value !== newVal[i].value) {
                    index = i;
                    break;
                }
            }
            
            if (index === -1) {
                return;
            }
            
            var value = newVal[index].value;
            if (value) {
                for (var i = 0; i < index; i++) {
                    newVal[i].value = true;
                }
            } else {
                for (var i = newVal.length - 1; i > index; i--) {
                    newVal[i].value = false;
                }
            }
        }
    }
    
    function deleteTab($rootScope, tabid) {
        var tabs = $rootScope.tabs;
        var index = -1;
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].id === tabid) {
                index = i;
                break;
            }
        }
        if (index !== -1) {
            tabs.splice(index, 1);
        }
    }
    
    function createEmptyCharSheet(id) {
        
        var kdm = loadFromFile("static/json/character.json");
        kdm.id = id;
        return kdm;
    }
    
    function createEmptySettlement(id) {
        var kdm = loadFromFile("static/json/settlement.json");
        kdm.id = id;
        return kdm;
    }
    
    function loadFromFile(my_url) {
        var json = (function() {
            var json = null ;
            $.ajax({
                'async': false,
                'global': false,
                'url': my_url,
                'dataType': "json",
                'success': function(data) {
                    json = data;
                }
            });
            return json;
        })();
        return json;
    }
})();
