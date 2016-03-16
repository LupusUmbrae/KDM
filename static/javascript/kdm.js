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
        console.log(scope.tabs);
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
        
        addNewSettlement($rootScope);
        addNewChar($rootScope);
        
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
            });
            $("#savejson").click(function() {
                $('textarea#savejson').val(angular.element(document.body).scope().jsonify());
                $("#save-dialog").dialog("open");
            });
            $("input:checkbox").each(function() {
                $(this).hide();
                
                var $image = $("<img src='static/images/checkbox-unchecked.svg' />").insertAfter(this);
                
                $image.click(function() {
                    var $checkbox = $(this).prev(".check");
                    $checkbox.prop('checked', !$checkbox.prop('checked'));
                    
                    if ($checkbox.prop("checked")) {
                        $image.attr("src", "static/images/checkbox-checked.svg");
                    } else {
                        $image.attr("src", "static/images/checkbox-unchecked.svg");
                    }
                })
            });
        });
    }
    
    function addNewChar(scope) {
        var id = "tab-" + scope.tabs.length;
        addToTabs(scope, createEmptyCharSheet(id));
    }
    
    function addNewSettlement(scope) {
        var id = "tab-" + scope.tabs.length;
        addToTabs(scope, createEmptySettlement(id));
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
        
        var kdm = {};
        kdm.id = id;
        kdm.type = "char";
        kdm.template = "static/templates/char.html"
        
        // TODO: Can we make this nicer? too many lines :(
        
        // NAME
        var name = {};
        
        // SURVIVAL
        var survival = {};
        survival.encourage = false;
        survival.surge = false;
        survival.dash = false;
        survival.cannotspend = false;
        kdm.survival = survival;
        
        // ATTRIBUTES
        var attrs = [];
        var mov = {};
        mov.name = "Movement";
        mov.value = 5;
        attrs.push(mov);
        var acc = {};
        acc.name = "Accuracy"
        attrs.push(acc);
        var str = {};
        str.name = "Strength"
        attrs.push(str);
        var eva = {};
        eva.name = "Evasion"
        attrs.push(eva);
        var lck = {};
        lck.name = "Luck"
        attrs.push(lck);
        var spd = {};
        spd.name = "Speed"
        attrs.push(spd);
        
        kdm.attrs = attrs;
        
        // BRAIN
        var brain = {};
        brain.wound = false;
        kdm.brain = brain;
        
        // ARMOUR
        
        var armour = [];
        
        var head = {};
        head.name = "Head";
        head.heavy = false;
        armour.push(head);
        
        var arms = {};
        arms.name = "Arms";
        arms.light = false;
        arms.heavy = false;
        armour.push(arms);
        
        var body = {};
        body.name = "Body";
        body.light = false;
        body.heavy = false;
        armour.push(body);
        
        var waist = {};
        waist.name = "Waist";
        waist.light = false;
        waist.heavy = false;
        armour.push(waist);
        
        var legs = {};
        legs.name = "Legs";
        legs.light = false;
        legs.heavy = false;
        armour.push(legs);
        
        kdm.armour = armour;
        
        // AGE
        
        var age = [];
        for (var i = 0; i < 16; i++) {
            var agebox = {};
            if (i === 15) {
                agebox.retire = true;
                ;
            } else if (i === 1 || i === 5 || i === 9 || i === 14) {
                agebox.level = true;
            }
            age.push(agebox);
        }
        kdm.age = age;
        
        // WEAPON PROFICIENCY
        
        var weapon = {};
        weapon.type = "";
        weapon.levels = [];
        for (var i = 0; i < 8; i++) {
            var level = {};
            if (i === 2 || i === 7) {
                level.level = true;
            }
            weapon.levels.push(level);
        }
        kdm.weapon = weapon;
        
        // COURAGE
        
        var courage = {};
        courage.bold = "";
        courage.levels = [];
        for (var i = 0; i < 9; i++) {
            var level = {};
            if (i === 2 || i === 8) {
                level.level = true;
            }
            courage.levels.push(level);
        }
        kdm.courage = courage;
        
        // UNDERSTANDING
        
        var understanding = {};
        understanding.insight = "";
        understanding.levels = [];
        for (var i = 0; i < 9; i++) {
            var level = {};
            if (i === 2 || i === 8) {
                level.level = true;
            }
            understanding.levels.push(level);
        }
        kdm.understanding = understanding;
        
        // RECORDS
        
        var records = [];
        
        var fightingArts = {};
        fightingArts.name = "Fighting Arts";
        fightingArts.limit = "Maximum 3";
        fightingArts.checkbox = {};
        fightingArts.checkbox.text = "Cannot use fighting arts";
        fightingArts.checkbox.value = false;
        fightingArts.lines = [];
        fightingArts.lines.push("");
        fightingArts.lines.push("");
        fightingArts.lines.push("");
        
        var disorders = {};
        disorders.name = "Disorders";
        disorders.limit = "Maximum 3";
        disorders.lines = [];
        disorders.lines.push("");
        disorders.lines.push("");
        disorders.lines.push("");
        
        var abilitiesImpairments = {};
        abilitiesImpairments.name = "Abilities & Impairments";
        abilitiesImpairments.checkbox = {};
        abilitiesImpairments.checkbox.text = "Skip Next Hunt";
        abilitiesImpairments.checkbox.value = false;
        abilitiesImpairments.lines = [];
        abilitiesImpairments.lines.push("");
        abilitiesImpairments.lines.push("");
        abilitiesImpairments.lines.push("");
        abilitiesImpairments.lines.push("");
        abilitiesImpairments.lines.push("");
        abilitiesImpairments.lines.push("");
        abilitiesImpairments.lines.push("");
        
        
        records.push(fightingArts);
        records.push(disorders);
        records.push(abilitiesImpairments);
        
        kdm.records = records;
        return kdm;
    }
    
    function createEmptySettlement(id) {
        var kdm = {};
        
        kdm.id = id;
        kdm.type = "settlement";
        kdm.template = "static/templates/settlement.html"
        
        // NAME
        var name = {};
        kdm.name = name;
        
        // DEATH COUNT
        var deathCount = [];
        for (var i = 0; i < 40; i++) {
            var deathbox = {};
            if (i === 0) {
                deathbox.level = true;
            }
            deathCount.push(deathbox);
        }
        kdm.deathCount = deathCount;
        
        // TIMELINE
        var timeline = [];
        
        for (var i = 0; i < 40; i++) {
            timeline.push({
                year: i + 1
            });
        }
        
        kdm.timeline = timeline;
        
        // MILESTONE STORY EVENTS
        var milestones = [];
        
        milestones.push({
            name: "First child is born",
            event: "Principle: New Life",
            disabled: true
        });
        milestones.push({
            name: "First time death count is updated",
            event: "Principle: Death",
            disabled: true
        });
        milestones.push({
            name: "Population reaches 15",
            event: "Principle: Society",
            disabled: true
        });
        milestones.push({
            name: "Settlement has 5 innovations",
            event: "Hooded Knight",
            disabled: true
        });
        milestones.push({
            name: "Population reaches 0",
            event: "Game Over",
            disabled: true
        });
        
        for (var i = 0; i < 4; i++) {
            milestones.push({});
        }
        
        kdm.milestones = milestones;
        
        // NEMISIS MONSTERS
        var nemesis = [];
        // nemesises :P
        nemesis.push({
            name: "Butcher",
            disabled: true
        });
        nemesis.push({
            name: "King's Man",
            disabled: true
        });
        nemesis.push({
            name: "The Hand",
            disabled: true
        });
        for (var i = 0; i < 3; i++) {
            nemesis.push({});
        }
        
        
        kdm.nemesis = nemesis;
        
        // INNOVATIONS 22
        var innovations = [];
        for (var i = 0; i < 22; i++) {
            innovations.push("");
        }
        innovations[0] = "Language"
        kdm.innovations = innovations;
        
        // SETTLEMENT LOCATIONS - 18
        var locations = [];
        locations.push({
            name: "Lantern Hoard",
            owned: true,
            disabled: true
        });
        locations.push({
            name: "Bone Smith",
            disabled: true
        });
        locations.push({
            name: "Skinnery",
            disabled: true
        });
        locations.push({
            name: "Organ Grinder",
            disabled: true
        });
        locations.push({
            name: "Catarium",
            disabled: true
        });
        locations.push({
            name: "Weapon Crafter",
            disabled: true
        });
        locations.push({
            name: "Leather Worker",
            disabled: true
        });
        locations.push({
            name: "Stone Circle",
            disabled: true
        });
        locations.push({
            name: "Barber Surgeon",
            disabled: true
        });
        locations.push({
            name: "Plumery",
            disabled: true
        });
        locations.push({
            name: "Blacksmith",
            disabled: true
        });
        locations.push({
            name: "Mask Maker",
            disabled: true
        });
        for (var i = 0; i < 8; i++) {
            locations.push({
                name: ""
            })
        }
        kdm.locations = locations;
        
        // PRINCIPLES
        var principles = [];
        
        principles.push({
            name: "New Life",
            left: "Protect the Young",
            right: "Survival of the Fittest",
            disabled: true
        });
        principles.push({
            name: "Death",
            left: "Cannibalize",
            right: "Graves",
            disabled: true
        });
        principles.push({
            name: "Society",
            left: "Collective Toil",
            right: "Accept Darkness",
            disabled: true
        });
        principles.push({
            name: "Conviction",
            left: "Barbaric",
            right: "Romantic",
            disabled: true
        });
        
        principles.push({
            name: "",
            left: "",
            right: ""
        });
        principles.push({
            name: "",
            left: "",
            right: ""
        });
        
        kdm.principles = principles;
        
        // QUARRIES
        var quarries = [];
        quarries.push({
            name: "White Lion",
            disabled: true
        })
        quarries.push({
            name: "Screaming Antelope",
            disabled: true
        })
        quarries.push({
            name: "Phoenix",
            disabled: true
        })
        for (var i = 0; i < 5; i++) {
            quarries.push({});
        }
        
        kdm.quarries = quarries;
        
        // STORAGE
        var records = [];
        
        var storage = {};
        storage.name = "Storage";
        storage.note = "Gear and Resources may be stored without liimit";
        
        var stored = [];
        for (var colIndex = 0; colIndex < 4; colIndex++) {
            var col = [];
            for (var rowIndex = 0; rowIndex < 10; rowIndex++) {
                col.push("");
            }
            stored.push(col);
        }
        storage.entries = stored;
        
        records.push(storage);
        
        // DEFEATED MONSTERS
        var defeated = {};
        
        var entries = []
        defeated.name = "Defeated Monsters"
        defeated.note = "A list of defeated monsters and their levels";
        for (var colIndex = 0; colIndex < 4; colIndex++) {
            var col = [];
            for (var rowIndex = 0; rowIndex < 10; rowIndex++) {
                col.push("");
            }
            entries.push(col);
        }
        
        defeated.entries = entries;
        records.push(defeated);
        
        kdm.records = records;
        
        // POPULATION
        var population = {}
        
        var lost = [];
        for (var i = 0; i < 20; i++) {
            var lostbox = {};
            if ((i % 5) === 0) {
                lostbox.level = true;
            }
            lost.push(lostbox);
        }
        population.lost = lost;
        
        var people = [];
        for (var i = 0; i < 20; i++) {
            var person = {};
            person.name = "";
            person.gender = "";
            person.notes = "";
            people.push(person);
        }
        population.people = people;
        
        kdm.population = population;
        
        return kdm;
    }
})();
