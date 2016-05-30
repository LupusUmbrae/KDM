(function() {
    'use strict';
    
    angular
    .module('kdm', [
    'kdm.config', 
    ]);
    
    angular
    .module('kdm.config', []);
    
    angular
    .module('kdm.directives', []);
    
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
        
        parsed.forEach(function(kdm, index) {
            watchTab(scope, kdm, index);
        })
        
        scope.$apply();
    }
    
    function run($rootScope, $parse) {
        
        $rootScope.addtimeline = {}
        
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
            $('#confirm-delete-dialog').data('tab', {
                tab
            }).dialog('open')
        }
        
        $rootScope.removeEvent = function(timeline, year, event) {
            var index = timeline[year.year - 1].events.indexOf(event)
            if (index >= 0) {
                timeline[year.year - 1].events.splice(index, 1)
            }
        }
        
        $rootScope.inc = function(item, name="value") {
            if (item[name] === undefined) {
                item[name] = 0
            } else if (typeof item[name] === "string") {
                item[name] = Number(item[name])
            }
            item[name] += 1;
        }
        
        $rootScope.dec = function(item, name="value") {
            if (item[name] === undefined) {
                item[name] = 0
            } else if (typeof item[name] === "string") {
                item[name] = Number(item[name])
            }
            item[name] -= 1;
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
            new Clipboard('.btn');
            
            $('.dropdown-submenu').click(
            function(event) {
                // stop bootstrap.js to hide the parents
                event.stopPropagation();
                // hide the open children
                $(this).find(".dropdown-submenu").removeClass('open');
                // add 'open' class to all parents with class 'dropdown-submenu'
                $(this).parents(".dropdown-submenu").addClass('open');
                // this is also open (or was)
                $(this).toggleClass('open');
            });
            
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
            
            $("#loadjson-menu").click(function() {
                $("#load-dialog").dialog("open");
            });
            
            $("#save-dialog").dialog({
                autoOpen: false,
                resizable: true,
                height: 400,
                modal: true,
            });
            
            $("#savejson-menu").click(function() {
                $('textarea#savejson').val(angular.element(document.body).scope().jsonify());
                $("#save-dialog").dialog("open");
            });
            
            $("#timeline-dialog").dialog({
                autoOpen: false,
                resizable: true,
                height: 190,
                modal: true,
                position: {
                    my: "center top",
                    at: "center top",
                    of: window
                },
                buttons: {
                    "Add Event": function() {
                        var openSettlement = $("div.active");
                        var settlementId = openSettlement.attr("id");
                        
                        var setYear = Number($rootScope.addtimeline.year);
                        var setType = $rootScope.addtimeline.option;
                        var setEvent = $rootScope.addtimeline.event;
                        
                        console.log(setType)
                        
                        var ok = true;
                        var msgs = [];
                        if (isNaN(setYear) || setYear < 0 || setYear > 40) {
                            ok = false;
                            $rootScope.addtimeline.yearok = false;
                            if (isNaN(setYear)) {
                                msgs.push("Year is not set")
                            } else {
                                msgs.push("Year is out of range")
                            }
                        }
                        
                        if (setEvent === undefined || setEvent === "") {
                            ok = false;
                            $rootScope.addtimeline.eventok = false;
                            msgs.push("Event text not set");
                        }
                        if (ok) {
                            var tab;
                            
                            $rootScope.addtimeline.error = false;
                            $rootScope.addtimeline.errormsg = "";
                            
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
                            }
                            $rootScope.$apply();
                            $(this).dialog("close");
                        } else {
                            $rootScope.addtimeline.error = true;
                            $rootScope.addtimeline.errormsg = msgs.join(", ");
                            $rootScope.$apply();
                        }
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                },
                open: function(event, ui) {
                    $rootScope.addtimeline.option = "Story";
                    $rootScope.addtimeline.year = undefined;
                    $rootScope.addtimeline.event = undefined;
                    $rootScope.$apply();
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
            
            $(function() {
                $("#confirm-delete-dialog").dialog({
                    autoOpen: false,
                    resizable: false,
                    height: 140,
                    modal: true,
                    buttons: {
                        "Delete": function() {
                            var tab = $(this).data('tab').tab;
                            deleteTab($rootScope, tab.id);
                            $(this).dialog("close");
                        },
                        Cancel: function() {
                            $(this).dialog("close");
                        }
                    },
                    open: function(event, ui) {
                        var tab = $(this).data('tab').tab;
                        var name = "Unamed " + tab.type;
                        if (tab.name !== undefined && tab.name.name !== undefined) {
                            name = tab.name.name;
                        }
                        $rootScope.tabtodelete = name;
                    }
                });
            });
            
            $('.nav-tabs a').click(function(e) {
                e.preventDefault()
                $(this).tab('show')
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
