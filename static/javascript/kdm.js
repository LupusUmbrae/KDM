(function () {
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

  run.$inject = ['$rootScope'];
  jsonify.$inject = ['$rootScope'];
  
  function jsonify(scope) {
    console.log(scope.kdm);
    console.log(JSON.stringify(scope.kdm));
  }
  
  function load(scope, json) {
    var parsed = JSON.parse(json);
    scope.kdm = parsed;
    scope.$apply();
  }

  function run($rootScope) {
    $rootScope.jsonify = function() {
      jsonify($rootScope);
    }
    
    $rootScope.load = function(json) {
      load($rootScope, json);
    }
    
    // TODO: Can we make this nicer? too many lines :(
    
    var kdm = {};
    
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
    abilitiesImpairments.limit = "Maximum 3";
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
    
    $rootScope.kdm = kdm;
  }
})();
