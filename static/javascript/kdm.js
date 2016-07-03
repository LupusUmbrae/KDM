(function() {
    'use strict';
    angular.module('kdm', ['kdm.config', 'kdm.dialogs']);
    angular.module('kdm.config', []);
    angular.module('kdm.directives', []);
    angular.module('kdm').run(run);
    run.$inject = ['$rootScope', '$parse', 'dialogs'];

    function jsonify(scope) {
        return JSON.stringify(scope.tabs);
    }

    function load(scope, json) {
        var parsed = JSON.parse(json);
        scope.tabs = parsed;
        parsed.forEach(function(kdm, index) {
            watchTab(scope, kdm, index);
        })
        findMaxId(scope);
        scope.$apply();
    }

    function run($rootScope, $parse, dialogs) {
        $rootScope.addtimeline = {}
        $rootScope.curTabIndex = 0;
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
        $rootScope.deleteTab = function(tab) {
            $('#confirm-delete-dialog').data('tab', tab).dialog('open')
        }
        $rootScope.removeEvent = function(timeline, year, event) {
            var index = timeline[year.year - 1].events.indexOf(event)
            if (index >= 0) {
                timeline[year.year - 1].events.splice(index, 1);
            }
        }
        $rootScope.inc = function(item, name) {
            var name = typeof name !== 'undefined' ? name : "value";
            if (item[name] === undefined) {
                item[name] = 0
            } else if (typeof item[name] === "string") {
                item[name] = parseInt(item[name], 10)
            }
            item[name] += 1;
        }
        $rootScope.dec = function(item, name) {
            var name = typeof name !== 'undefined' ? name : "value";
            if (item[name] === undefined) {
                item[name] = 0
            } else if (typeof item[name] === "string") {
                item[name] = parseInt(item[name], 10)
            }
            item[name] -= 1;
        }
        $rootScope.tabs = [];

        dialogs.loadDialogs($rootScope)

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
            new Clipboard('.btn');
            $('.dropdown-submenu').click(function(event) {
                // stop bootstrap.js to hide the parents
                event.stopPropagation();
                // hide the open children
                $(this).find(".dropdown-submenu").removeClass('open');
                // add 'open' class to all parents with class 'dropdown-submenu'
                $(this).parents(".dropdown-submenu").addClass('open');
                // this is also open (or was)
                $(this).toggleClass('open');
            });
            
            $('.nav-tabs a').click(function(e) {
                e.preventDefault()
                $(this).tab('show')
            });
        });
        $rootScope.$watch('tabs', function(newVal, oldVal) {
            if (newVal !== undefined && oldVal !== undefined && newVal !== oldVal) {
                localStorage.setItem('kdm', jsonify($rootScope));
            }
        }, true);
    }
    function addNewChar(scope) {
        var id = "tab-" + scope.curTabIndex;
        scope.curTabIndex += 1;
        addToTabs(scope, createEmptyCharSheet(id));
    }
    function addNewSettlement(scope) {
        var id = "tab-" + scope.curTabIndex;
        scope.curTabIndex += 1;
        addToTabs(scope, createEmptySettlement(id));
    }
    function findMaxId(scope) {
        var tabs = scope.tabs;
        var max = -1;
        tabs.forEach(function(tab) {
            var id = parseInt(tab.id.substring(4), 10);
            if (id > max) {
                max = id;
            }
        });
        max++;
        scope.curTabIndex = max;
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
        watchTab(scope, kdm, lastIndex);
    }
    function watchTab(scope, kdm, tabIndex) {
        if (kdm.type === "char") {
            scope.$watch('tabs[' + tabIndex + '].courage.levels', watchCheckboxArray, true);
            scope.$watch('tabs[' + tabIndex + '].understanding.levels', watchCheckboxArray, true);
            scope.$watch('tabs[' + tabIndex + '].age', watchCheckboxArray, true);
            scope.$watch('tabs[' + tabIndex + '].weapon.levels', watchCheckboxArray, true);
        } else if (kdm.type === "settlement") {
            scope.$watch('tabs[' + tabIndex + '].population.lost', watchCheckboxArray, true);
            scope.$watch('tabs[' + tabIndex + '].deathCount', watchCheckboxArray, true);
            scope.$watch('tabs[' + tabIndex + '].timeline', watchCheckboxArray, true);
            scope.$watch('tabs[' + tabIndex + '].principles', watchPrinciples, true);
        }
    }
    function watchCheckboxArray(newVal, oldVal) {
        if (newVal !== undefined && oldVal !== undefined && newVal !== oldVal) {
            // find the changed index
            var index = -1;
            for (var i = 0; i < newVal.length; i++) {
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
    function watchPrinciples(newVal, oldVal) {
        if (newVal !== oldVal && newVal !== undefined && oldVal !== undefined) {
            var newCur;
            var oldCur;
            for (var i = 0; i < newVal.length; i++) {
                newCur = newVal[i];
                oldCur = oldVal[i];
                if (newCur.choiceleft && oldCur.choiceright) {
                    newCur.choiceright = false;
                } else if (newCur.choiceright && oldCur.choiceleft) {
                    newCur.choiceleft = false;
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
        $rootScope.$apply();
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
