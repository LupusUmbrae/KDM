(function() {
    'use strict';
    angular.module('kdm.dialogs', []).factory('dialogs', factory);
    function factory() {
        return {
            loadDialogs: loadDialogs
        }
    }
    function loadDialogs(scope) {
        scope.$on('$includeContentLoaded', function() {
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
                        var setYear = parseInt($rootScope.addtimeline.year, 10);
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
                            if (tab.type === "settlement") {
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
                            var tab = $(this).data('tab');
                            deleteTab($rootScope, tab.id);
                            $(this).dialog("close");
                        },
                        Cancel: function() {
                            $(this).dialog("close");
                        }
                    },
                    open: function(event, ui) {
                        var tab = $(this).data('tab');
                        var name = "Unamed " + tab.type;
                        if (tab.name !== undefined && tab.name.name !== undefined) {
                            name = tab.name.name;
                        }
                        $rootScope.tabtodelete = name;
                    }
                });
            });
        });
    }
})();
