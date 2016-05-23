(function() {
    'use strict';
    
    var app = angular
    .module('kdm', [
    'kdm.config',
    'vxWamp'
    ]);
    
    angular
    .module('kdm.config', []);

    angular
    .module('kdm.directives', []);

    app.config(function ($wampProvider) {
        var wsuri;
        if (document.location.origin == "file://") {
          wsuri = "ws://127.0.0.1:8080/ws";

        } else {
          wsuri = (document.location.protocol === "http:" ? "ws:" : "wss:") + "//" +
                      document.location.host + "/ws";
        }
        $wampProvider.init({
            url: wsuri,
            realm: 'realm1'
        });
    })

    angular
    .module('kdm')
    .run(run);
    
    run.$inject = ['$rootScope', '$parse', '$wamp'];


    
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
    
    function run($rootScope, $parse, $wamp) {
        $wamp.open()

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

        $rootScope.wampCheckusername = function() {
            checkUserName($wamp, $rootScope.username, $rootScope)
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
            $('.dropdown-submenu').click(
                function(event) {
                    // stop bootstrap.js to hide the parents
                    event.stopPropagation();
                    // hide the open children
                    $( this ).find(".dropdown-submenu").removeClass('open');
                    // add 'open' class to all parents with class 'dropdown-submenu'
                    $( this ).parents(".dropdown-submenu").addClass('open');
                    // this is also open (or was)
                    $( this ).toggleClass('open');
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

            $(function() {
                $("#register-dialog").dialog({
                    autoOpen: false,
                    resizable: false,
                    height: 350,
                    modal: true,
                    buttons: {
                        "Register": function() {
                            var username = $("#username-register").val()
                            var password = $("#password-register").val()
                            var confirmPassword = $("#confirm-password-register").val()

                            if(username === "") {
                                $rootScope.usernameok = false;
                                $rootScope.registererror = "Username blank";
                                $rootScope.$apply();
                                return;
                            }

                            if(password === "") {
                                $rootScope.passwordok = false;
                                $rootScope.passworderror = "Password is blank";
                                $rootScope.$apply();
                                return;
                            }

                            if(password !== confirmPassword) {
                                $rootScope.passwordok = false;
                                $rootScope.passworderror = "Passwords do not match";
                                $rootScope.$apply();
                                return;
                            }

                            $(this).dialog("close");
                            register($wamp, username, password);
                        },
                        Cancel: function() {
                            $(this).dialog("close");
                        }
                    }
                });
            });
            
            $('#register').click(function() {
                $("#register-dialog").dialog("open");
            });

             $(function() {
                $("#login-dialog").dialog({
                    autoOpen: false,
                    resizable: false,
                    height: 300,
                    modal: true,
                    buttons: {
                        "login": function() {
                            $(this).dialog("close");
                        },
                        Cancel: function() {
                            $(this).dialog("close");
                        }
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

    function checkUserName(wamp, username, scope) {
        if(username === ""){
            return
        }
        wamp.call("com.kdmwebforms.public.checkusername", [username]).then(function(res) {
            scope.usernameok = res
            if(res) {
                scope.registererror = ""
            } else{
                scope.registererror = "Username taken"
            }
        },
        function(err){
            console.log(err)
        })
    }

    function register(wamp, username, password) {
        wamp.call("com.kdmwebforms.public.register", [username, password]).then(function(res) {
            console.log(res)
        },
        function(err){
            console.log(err)
        })
    }
})();
