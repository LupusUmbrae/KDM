(function() {
    'use strict';
    
    var app = angular
    .module('kdm', [
    'kdm.config', 
    'vxWamp'
    ]);
    
    var editorWatch;
    var editorsLoaded;
    
    var wamp;

    var campaignId;
    
    var wsuri;
    if (document.location.origin == "file://") {
        wsuri = "ws://127.0.0.1:8080/ws";
    
    } else {
        wsuri = (document.location.protocol === "http:" ? "ws:" : "wss:") + "//" + 
        document.location.host + "/ws";
    }
    
    angular
    .module('kdm.config', []);
    
    angular
    .module('kdm.directives', []);
    
    app.config(function($wampProvider) {
        $wampProvider.init({
            url: wsuri,
            realm: 'realm1'
        });
    })
    
    angular
    .module('kdm')
    .run(run);
    
    run.$inject = ['$rootScope', '$parse', '$wamp'];
    
    function run($rootScope, $parse, $wamp) {
        $wamp.open()
        
        wamp = $wamp;
        
        $rootScope.register = {};
        $rootScope.login = {};
        $rootScope.errors = {};
        
        $rootScope.account = {};
        $rootScope.account.loggedIn = false;
        
        $rootScope.campaign = {};
        
        $rootScope.jsonify = function() {
            return jsonify($rootScope);
        }
        
        $rootScope.save = function() {
            save($rootScope, $wamp);
        }
        
        $rootScope.listCampaigns = function() {
            listCampaigns($rootScope, $wamp)
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
        
        $rootScope.logout = function() {
            logout($rootScope, $wamp);
        }
        
        $rootScope.addEditor = function() {
            var username = $('#addEditorName').val();
            checkUserName($wamp, username, 
            function(res) {
                
                if (!res) {
                    $rootScope.errors.addEditor = ""
                    $rootScope.errors.addEditorOk = !res;
                    if ($rootScope.campaign.editors === undefined) {
                        $rootScope.campaign.editors = [];
                    }
                    $rootScope.campaign.editors.push(username)
                } else {
                    $rootScope.errors.addEditor = "Unknown user: " + username
                    $rootScope.errors.addEditorOk = !res;
                }
            });
        }
        
        $rootScope.removeEditor = function(username) {
            var index = $rootScope.campaign.editors.indexOf(username);
            if(index >= 0) {
                $rootScope.campaign.editors.splice(index, 1);
            }
        }

        $rootScope.tabs = [];
        
        var local = localStorage.getItem('kdm');
        if (local == null ) {
            addNewSettlement($rootScope);
            addNewChar($rootScope);
        } else {
            loadFromJson($rootScope, local);
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
                $(this).find(".dropdown-submenu").removeClass('open');
                // add 'open' class to all parents with class 'dropdown-submenu'
                $(this).parents(".dropdown-submenu").addClass('open');
                // this is also open (or was)
                $(this).toggleClass('open');
            });
            
            $("#import-dialog").dialog({
                autoOpen: false,
                resizable: true,
                height: 400,
                modal: true,
                buttons: {
                    "Load": function() {
                        $(this).dialog("close");
                        loadFromJson($rootScope, $('textarea#loadjson').val());
                        $rootScope.$apply()
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                }
            });
            
            $("#loadjson").click(function() {
                $("#import-dialog").dialog("open");
            });
            
            $("#export-dialog").dialog({
                autoOpen: false,
                resizable: true,
                height: 400
            });
            
            $("#savejson").click(function() {
                $('textarea#savejson').val(angular.element(document.body).scope().jsonify());
                $("#export-dialog").dialog("open");
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
                            
                            if (username === "") {
                                $rootScope.register.usernameok = false;
                                $rootScope.register.registererror = "Username blank";
                                $rootScope.$apply();
                                return;
                            }
                            
                            if (password === "") {
                                $rootScope.register.passwordok = false;
                                $rootScope.register.passworderror = "Password is blank";
                                $rootScope.$apply();
                                return;
                            }
                            
                            if (password !== confirmPassword) {
                                $rootScope.register.passwordok = false;
                                $rootScope.register.passworderror = "Passwords do not match";
                                $rootScope.$apply();
                                return;
                            }
                            
                            $(this).dialog("close");
                            register($rootScope, $wamp, username, password);
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
                            
                            var username = $rootScope.login.username;
                            var password = $rootScope.login.password;
                            
                            var ok = true;
                            if (username === "") {
                                ok = false;
                                login.usernameok = false;
                                login.usernameerror = "Username is blank";
                            }
                            
                            if (password === "") {
                                ok = false;
                                login.passwordok = false
                                login.passworderror = "Password is blank"
                            }
                            
                            if (ok) {
                                $rootScope.login.username = '';
                                $rootScope.login.password = '';
                                login($rootScope, $wamp, username, password)
                                $(this).dialog("close");
                            }
                        },
                        Cancel: function() {
                            $(this).dialog("close");
                        }
                    }
                });
            });
            
            $('#login').click(function() {
                $("#login-dialog").dialog("open");
            });
            
            $(function() {
                $("#load-dialog").dialog({
                    autoOpen: false,
                    resizable: false,
                    height: 300,
                    modal: true,
                    buttons: {
                        "Load": function() {
                            var campaignId = $('#selectCampaign').val()
                            if (campaignId !== undefined) {
                                load($rootScope, $wamp, campaignId)
                                $(this).dialog("close");
                            } else {
                            // Ewwor!
                            }
                        
                        },
                        Cancel: function() {
                            $(this).dialog("close");
                        }
                    }
                });
            });
            
            $('#load').click(function() {
                $("#load-dialog").dialog("open");
            });
            
            $(function() {
                $("#editors-dialog").dialog({
                    autoOpen: false,
                    resizable: true,
                    height: 300,
                    close: function() {
                        if (editorWatch !== undefined) {
                            editorWatch();
                        } else {
                            console.log("Editors watcher undefined")
                        }
                    }
                });
            });
            
            $('#editors').click(function() {
                editorsLoaded = false;
                loadEditors($rootScope, $wamp);
                editorWatch = $rootScope.$watch('campaign.editors', watchEditors, true);
                $("#editors-dialog").dialog("open");
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
    
    function jsonify(scope) {
        return JSON.stringify(scope.tabs);
    }
    
    function loadFromJson(scope, json) {
        var parsed = JSON.parse(json);
        scope.tabs = parsed;
        
        parsed.forEach(function(kdm, index) {
            watchTab(scope, kdm, index);
        })
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
        if (username === "") {
            return
        }
        wamp.call("com.kdmwebforms.public.checkusername", [username]).then(function(res) {
            scope.register.usernameok = res
            if (res) {
                scope.register.registererror = ""
            } else {
                scope.register.registererror = "Username taken"
            }
        }, 
        function(err) {
            console.log(err)
        })
    }
    
    function checkUserName(wamp, username, okcallback) {
        if (username === "") {
            return
        }
        wamp.call("com.kdmwebforms.public.checkusername", [username]).then(okcallback, 
        function(err) {
            console.log(err)
        })
    }
    
    function register(scope, wamp, username, password) {
        wamp.call("com.kdmwebforms.public.register", [username, password]).then(function(res) {
            authWamp(wamp, username, res)
        }, 
        function(err) {
            console.log(err)
        })
    }
    
    function login(scope, wamp, username, password) {
        wamp.call("com.kdmwebforms.public.login", [username, password]).then(function(res) {
            authWamp(scope, wamp, username, res)
        }, 
        function(err) {
            console.log(err);
        })
    }
    
    function authWamp(scope, wamp, username, secret) {
        scope.account.loggedIn = true;
        scope.account.username = username;
        scope.account.secret = secret;
        listCampaigns(scope, wamp);
    }
    
    function logout(scope, wamp) {
        scope.account = {};
        scope.account.loggedIn = false
    }
    
    function listCampaigns(scope, wamp) {
        wamp.call('com.kdmwebforms.public.list', []).then(
        function(res) {
            scope.account.campaigns = res
        }, 
        function(err) {
            console.log(err)
        });
    }
    
    function load(scope, wamp, id) {
        scope.campaign.id = id;
        campaignId = id;
        wamp.call('com.kdmwebforms.public.load', [campaignId]).then(
        function(res) {
            loadFromJson(scope, res[1]);
            scope.campaign.name = res[0];
        }, 
        function(err) {
            console.log(err);
        });
    }
    
    function save(scope, wamp) {
        console.log("Save")
        var name = scope.campaign.name;
        var data = JSON.stringify(scope.tabs);
        var id = scope.campaign.id;
        var params = [name, data];
        if (id) {
            params.push(id);
        }
        
        wamp.call('com.kdmwebforms.public.save', params).then(
        function(res) {
            console.log(res);
        }, 
        function(err) {
            console.log(err);
        });
    }
    
    function loadEditors(scope, wamp) {
        var campiagnId = scope.campaign.id;
        if (campiagnId === undefined) {
            return
        }
        wamp.call("com.kdmwebforms.public.list_editors", [campiagnId]).then(
        function(res) {
            scope.campaign.editors = res;
        }, 
        function(err) {
            console.log(err);
        });
    }
    
    function watchEditors(newVal, oldVal) {
        if (newVal !== oldVal) {
            if (!editorsLoaded) {
                // Skip first load of editors
                editorsLoaded = true;
            } else {
                var newEditors = [];
                var removedEditors = [];
                
                newVal.forEach(function(val) {
                    if (oldVal.indexOf(val) < 0) {
                        newEditors.push(val);
                    }
                });
                
                oldVal.forEach(function(val) {
                    if (newVal.indexOf(val) < 0) {
                        removedEditors.push(val);
                    }
                });
                
                removedEditors.forEach(function(val) {
                    removeEditor(val);
                });
                
                newEditors.forEach(function(val) {
                    addEditor(val);
                });
            }
        }
    }
    
    function addEditor(username) {
        wamp.call("com.kdmwebforms.public.add_editor", [campaignId, username]).then(
        function(res) {
            console.log("Editor added: " + username)
        }, 
        function(err) {
            console.log(err);
        });
    }
    
    function removeEditor(username) {
        wamp.call("com.kdmwebforms.public.remove_editor", [campaignId, username]).then(
        function(res) {
            console.log("Editor removed: " + username)
        }, 
        function(err) {
            console.log(err);
        });
    }

})();
