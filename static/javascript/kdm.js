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
    console.log(scope.kdm)
  }

  function run($rootScope) {
    $rootScope.jsonify = function() {
      jsonify($rootScope);
    }
    
    var kdm = {};
  
    kdm.armour = [{"name":"Head","heavyOnly":true}, {"name":"Arms","heavyOnly":false}, {"name":"Body","heavyOnly":false}, {"name":"Waist","heavyOnly":false}, {"name":"Legs","heavyOnly":false}];
    
    var records = [];
    
    var fightingArts = {};
    fightingArts.name = "Fighting Arts";
    fightingArts.limit = "Maximum 3";
    fightingArts.checkbox = {};
    fightingArts.checkbox.text = "Cannot use fighting arts";
    fightingArts.checkbox.valse = false;
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
    abilitiesImpairments.checkbox.valse = false;
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
