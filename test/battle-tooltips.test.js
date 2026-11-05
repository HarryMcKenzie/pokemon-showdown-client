const assert = require('assert').strict;

window = global;

try {
  global.BattlePokedex = require('../play.pokemonshowdown.com/data/pokedex.js').BattlePokedex;
} catch (err) {}
require('../play.pokemonshowdown.com/js/battle-dex-data.js');
require('../play.pokemonshowdown.com/js/battle-dex.js');
require('../play.pokemonshowdown.com/js/battle-scene-stub.js');
require('../play.pokemonshowdown.com/js/battle-text-parser.js');
require('../play.pokemonshowdown.com/js/battle.js');
require('../play.pokemonshowdown.com/js/battle-tooltips.js');

/**
 * Creates a Battle from a protocol log.
 * The base log sets up a Gen 9 Shared Power singles battle.
 */
function createBattle(extraLog) {
  return new Battle({
    debug: true,
    log: [
      '|init|battle',
      '|title|Test vs. Test',
      '|player|p1|Test|1',
      '|player|p2|Test2|2',
      '|teamsize|p1|6',
      '|teamsize|p2|6',
      '|gametype|singles',
      '|gen|9',
      '|tier|[Gen 9] Shared Power',
      '|',
      '|start',
      ...extraLog,
    ],
  });
}

// Snorlax L100 Hardy 252HP/0rest 31IVs
// Base stats: HP 160, Atk 110, Def 65, SpA 65, SpD 110, Spe 30
// Calculated: atk=256, def=166, spa=166, spd=256, spe=96
const SNORLAX_SERVER = {
  stats: {atk: 256, def: 166, spa: 166, spd: 256, spe: 96},
  ability: 'Thick Fat',
  baseAbility: 'Thick Fat',
  item: 'Leftovers',
  speciesForme: 'Snorlax',
  hp: 524,
  maxhp: 524,
};

const TEST_MOVES = {
  machpunch: new Move('machpunch', 'Mach Punch', {
    exists: true,
    type: 'Fighting',
    category: 'Physical',
    basePower: 40,
    accuracy: 100,
    pp: 30,
    priority: 1,
    target: 'normal',
    flags: {contact: 1, protect: 1, punch: 1},
  }),
  fireblast: new Move('fireblast', 'Fire Blast', {
    exists: true,
    type: 'Fire',
    category: 'Special',
    basePower: 110,
    accuracy: 85,
    pp: 5,
    target: 'normal',
    flags: {protect: 1},
  }),
  quickattack: new Move('quickattack', 'Quick Attack', {
    exists: true,
    type: 'Normal',
    category: 'Physical',
    basePower: 40,
    accuracy: 100,
    pp: 30,
    priority: 1,
    target: 'normal',
    flags: {contact: 1, protect: 1},
  }),
  moonblast: new Move('moonblast', 'Moonblast', {
    exists: true,
    type: 'Fairy',
    category: 'Special',
    basePower: 95,
    accuracy: 100,
    pp: 15,
    target: 'normal',
    flags: {protect: 1},
  }),
  bravebird: new Move('bravebird', 'Brave Bird', {
    exists: true,
    type: 'Flying',
    category: 'Physical',
    basePower: 120,
    accuracy: 100,
    pp: 15,
    target: 'normal',
    recoil: [33, 100],
    flags: {contact: 1, protect: 1, mirror: 1},
  }),
};

function showMoveTooltip(battle, pokemon, moveId, serverPokemon = {}) {
  const tooltips = new BattleTooltips(battle);
  const move = TEST_MOVES[moveId];
  return tooltips.showMoveTooltip(move, 'move', pokemon, {
    ...SNORLAX_SERVER,
    moves: [moveId],
    ...serverPokemon,
  });
}

describe('Shared Power Tooltips', () => {

  // --- Unconditional abilities ---

  it('Huge Power shared should double Atk', () => {
    const battle = createBattle([
      '|switch|p1a: Azumarill|Azumarill, F|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Huge Power',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['hugepower'], 'Snorlax should have hugepower volatile');

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.atk, 512, 'Shared Huge Power should double Atk to 512');
  });

  it('Pure Power shared should double Atk', () => {
    const battle = createBattle([
      '|switch|p1a: Medicham|Medicham, F|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Pure Power',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['purepower'], 'Snorlax should have purepower volatile');

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.atk, 512, 'Shared Pure Power should double Atk to 512');
  });

  it('Hustle shared should multiply Atk by 1.5', () => {
    const battle = createBattle([
      '|switch|p1a: Delibird|Delibird, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Hustle',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['hustle'], 'Snorlax should have hustle volatile');

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.atk, 384, 'Shared Hustle should boost Atk to 384');
  });

  it('Fur Coat shared should double Def', () => {
    const battle = createBattle([
      '|switch|p1a: Furfrou|Furfrou, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Fur Coat',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['furcoat'], 'Snorlax should have furcoat volatile');

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.def, 332, 'Shared Fur Coat should double Def to 332');
  });

  // --- Status- and item-dependent abilities ---

  it('Quick Feet shared should boost Spe and ignore paralysis drop', () => {
    const battle = createBattle([
      '|switch|p1a: Jolteon|Jolteon, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100 par',
      '|-start|p1a: Snorlax|ability: Quick Feet',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['quickfeet'], 'Snorlax should have quickfeet volatile');
    assert.equal(snorlax.status, 'par', 'Snorlax should be paralyzed');

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.spe, 144, 'Shared Quick Feet should boost Spe to 144 without paralysis drop');
  });

  it('Klutz shared should suppress Choice Band Atk boost', () => {
    const battle = createBattle([
      '|switch|p1a: Lopunny|Lopunny, F|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Klutz',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['klutz'], 'Snorlax should have klutz volatile');

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, {...SNORLAX_SERVER, item: 'Choice Band'});

    assert.equal(stats.atk, 256, 'Shared Klutz should suppress the Choice Band Atk boost');
  });

  it('Sword of Ruin shared should not lower the source Pokemon defense', () => {
    const battle = createBattle([
      '|switch|p1a: Chien-Pao|Chien-Pao|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Sword of Ruin',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['swordofruin'], 'Snorlax should have swordofruin volatile');

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.def, 166, 'Shared Sword of Ruin should not lower the source Pokemon Def');
  });

  it('Beads of Ruin shared should not lower the source Pokemon special defense', () => {
    const battle = createBattle([
      '|switch|p1a: Chi-Yu|Chi-Yu|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Beads of Ruin',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['beadsofruin'], 'Snorlax should have beadsofruin volatile');

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.spd, 256, 'Shared Beads of Ruin should not lower the source Pokemon SpD');
  });

  // --- Weather-dependent abilities ---

  it('Orichalcum Pulse in sun should boost Atk by 4/3', () => {
    const battle = createBattle([
      '|switch|p1a: Koraidon|Koraidon|100/100',
      '|switch|p2a: Torkoal|Torkoal, F|100/100',
      '|-weather|SunnyDay|[from] ability: Drought|[of] p2a: Torkoal',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Orichalcum Pulse',
      '|turn|2',
    ]);

    assert.equal(battle.weather, 'sunnyday', 'Weather should be sunny');
    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['orichalcumpulse'], 'Snorlax should have orichalcumpulse volatile');

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    // floor(256 * 1.3333) = 341
    assert.equal(stats.atk, 341, 'Shared Orichalcum Pulse in sun should boost Atk to 341');
  });

  it('Chlorophyll in sun should double Spe', () => {
    const battle = createBattle([
      '|switch|p1a: Venusaur|Venusaur, M|100/100',
      '|switch|p2a: Torkoal|Torkoal, F|100/100',
      '|-weather|SunnyDay|[from] ability: Drought|[of] p2a: Torkoal',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Chlorophyll',
      '|turn|2',
    ]);

    assert.equal(battle.weather, 'sunnyday', 'Weather should be sunny');
    const snorlax = battle.sides[0].active[0];

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.spe, 192, 'Shared Chlorophyll in sun should double Spe to 192');
  });

  it('Swift Swim in rain should double Spe', () => {
    const battle = createBattle([
      '|switch|p1a: Kingdra|Kingdra, M|100/100',
      '|switch|p2a: Pelipper|Pelipper, F|100/100',
      '|-weather|RainDance|[from] ability: Drizzle|[of] p2a: Pelipper',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Swift Swim',
      '|turn|2',
    ]);

    assert.equal(battle.weather, 'raindance', 'Weather should be rainy');
    const snorlax = battle.sides[0].active[0];

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.spe, 192, 'Shared Swift Swim in rain should double Spe to 192');
  });

  it('Sand Rush in sand should double Spe', () => {
    const battle = createBattle([
      '|switch|p1a: Excadrill|Excadrill, M|100/100',
      '|switch|p2a: Tyranitar|Tyranitar, F|100/100',
      '|-weather|Sandstorm|[from] ability: Sand Stream|[of] p2a: Tyranitar',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Sand Rush',
      '|turn|2',
    ]);

    assert.equal(battle.weather, 'sandstorm', 'Weather should be sandstorm');
    const snorlax = battle.sides[0].active[0];

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.spe, 192, 'Shared Sand Rush in sand should double Spe to 192');
  });

  it('Slush Rush in snow should double Spe', () => {
    const battle = createBattle([
      '|switch|p1a: Beartic|Beartic, M|100/100',
      '|switch|p2a: Abomasnow|Abomasnow, F|100/100',
      '|-weather|Snow|[from] ability: Snow Warning|[of] p2a: Abomasnow',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Slush Rush',
      '|turn|2',
    ]);

    assert.equal(battle.weather, 'snowscape', 'Weather should be snow (snowscape)');
    const snorlax = battle.sides[0].active[0];

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.spe, 192, 'Shared Slush Rush in snow should double Spe to 192');
  });

  it('Solar Power in sun should boost SpA by 1.5', () => {
    const battle = createBattle([
      '|switch|p1a: Charizard|Charizard, M|100/100',
      '|switch|p2a: Torkoal|Torkoal, F|100/100',
      '|-weather|SunnyDay|[from] ability: Drought|[of] p2a: Torkoal',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Solar Power',
      '|turn|2',
    ]);

    assert.equal(battle.weather, 'sunnyday', 'Weather should be sunny');
    const snorlax = battle.sides[0].active[0];

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    // floor(166 * 1.5) = 249
    assert.equal(stats.spa, 249, 'Shared Solar Power in sun should boost SpA to 249');
  });

  // --- Terrain-dependent abilities ---

  it('Hadron Engine in Electric Terrain should boost SpA by 4/3', () => {
    const battle = createBattle([
      '|switch|p1a: Miraidon|Miraidon|100/100',
      '|switch|p2a: Pincurchin|Pincurchin, F|100/100',
      '|-fieldstart|move: Electric Terrain|[from] ability: Electric Surge|[of] p2a: Pincurchin',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Hadron Engine',
      '|turn|2',
    ]);

    assert(battle.hasPseudoWeather('Electric Terrain'), 'Electric Terrain should be active');
    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['hadronengine'], 'Snorlax should have hadronengine volatile');

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    // floor(166 * 1.3333) = 221
    assert.equal(stats.spa, 221, 'Shared Hadron Engine in Electric Terrain should boost SpA to 221');
  });

  it('Surge Surfer in Electric Terrain should double Spe', () => {
    const battle = createBattle([
      '|switch|p1a: Raichu-Alola|Raichu-Alola, M|100/100',
      '|switch|p2a: Pincurchin|Pincurchin, F|100/100',
      '|-fieldstart|move: Electric Terrain|[from] ability: Electric Surge|[of] p2a: Pincurchin',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Surge Surfer',
      '|turn|2',
    ]);

    assert(battle.hasPseudoWeather('Electric Terrain'), 'Electric Terrain should be active');
    const snorlax = battle.sides[0].active[0];

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    assert.equal(stats.spe, 192, 'Shared Surge Surfer in Electric Terrain should double Spe to 192');
  });

  it('Grass Pelt in Grassy Terrain should boost Def by 1.5', () => {
    const battle = createBattle([
      '|switch|p1a: Gogoat|Gogoat, M|100/100',
      '|switch|p2a: Tapu Bulu|Tapu Bulu|100/100',
      '|-fieldstart|move: Grassy Terrain|[from] ability: Grassy Surge|[of] p2a: Tapu Bulu',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Grass Pelt',
      '|turn|2',
    ]);

    assert(battle.hasPseudoWeather('Grassy Terrain'), 'Grassy Terrain should be active');
    const snorlax = battle.sides[0].active[0];

    const tooltips = new BattleTooltips(battle);
    const stats = tooltips.calculateModifiedStats(snorlax, SNORLAX_SERVER);

    // floor(166 * 1.5) = 249
    assert.equal(stats.def, 249, 'Shared Grass Pelt in Grassy Terrain should boost Def to 249');
  });

  it('Technician shared should boost low-base-power move previews', () => {
    const battle = createBattle([
      '|switch|p1a: Scizor|Scizor, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Technician',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['technician'], 'Snorlax should have technician volatile');

    const tooltip = showMoveTooltip(battle, snorlax, 'machpunch');

    assert.match(tooltip, /Base power: 60 \(1\.5&times; from Technician\)/);
  });

  it('Technician shared should boost low-base-power move previews from request sharedAbilities data', () => {
    const battle = createBattle([
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(!snorlax.volatiles['technician'], 'Snorlax should not have a technician volatile in this request-driven case');

    const tooltip = showMoveTooltip(battle, snorlax, 'machpunch', {sharedAbilities: ['technician']});

    assert.match(tooltip, /Base power: 60 \(1\.5&times; from Technician\)/);
  });

  it('Victory Star shared should boost move accuracy previews', () => {
    const battle = createBattle([
      '|switch|p1a: Victini|Victini|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Victory Star',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['victorystar'], 'Snorlax should have victorystar volatile');

    const tooltip = showMoveTooltip(battle, snorlax, 'fireblast');

    assert.match(tooltip, /Accuracy: 94% \(1\.1&times; from Victory Star\)/);
  });

  it('No Guard should be shown in move accuracy previews when the current ability differs from server data', () => {
    const battle = createBattle([
      '|switch|p1a: Machamp|Machamp, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-ability|p1a: Snorlax|No Guard',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert.equal(snorlax.ability, 'No Guard', 'Snorlax should remember No Guard as its current ability');

    const tooltip = showMoveTooltip(battle, snorlax, 'fireblast');

    assert.match(tooltip, /No Guard/);
  });

  it('Galvanize should change move type previews when the current ability differs from server data', () => {
    const battle = createBattle([
      '|switch|p1a: Alolan Golem|Golem-Alola, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-ability|p1a: Snorlax|Galvanize',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert.equal(snorlax.ability, 'Galvanize', 'Snorlax should remember Galvanize as its current ability');

    const tooltip = showMoveTooltip(battle, snorlax, 'quickattack');

    assert.match(tooltip, /sprites\/types\/Electric\.png/);
    assert.match(tooltip, /Galvanize/);
  });

  it('Iron Fist shared should add the boosted move tag', () => {
    const battle = createBattle([
      '|switch|p1a: Hitmonchan|Hitmonchan, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Iron Fist',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['ironfist'], 'Snorlax should have ironfist volatile');

    const tooltip = showMoveTooltip(battle, snorlax, 'machpunch');

    assert.match(tooltip, /boosted by Iron Fist/);
  });

  it('Reckless shared should boost recoil move previews from request sharedAbilities data', () => {
    const battle = createBattle([
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(!snorlax.volatiles['reckless'], 'Snorlax should not have a reckless volatile in this request-driven case');

    const tooltip = showMoveTooltip(battle, snorlax, 'bravebird', {sharedAbilities: ['reckless']});

    assert.match(tooltip, /Base power: 144 \(1\.2&times; from Reckless\)/);
    assert.match(tooltip, /boosted by Reckless/);
  });

  it('Fairy Aura shared should boost move power previews', () => {
    const battle = createBattle([
      '|switch|p1a: Xerneas|Xerneas|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Fairy Aura',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['fairyaura'], 'Snorlax should have fairyaura volatile');

    const tooltip = showMoveTooltip(battle, snorlax, 'moonblast');

    assert.match(tooltip, /1\.33&times; from Fairy Aura/);
  });

  // --- Shared ability display in tooltip ---

  it('Shared abilities should be displayed in ability text', () => {
    const battle = createBattle([
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
    ]);

    const snorlax = battle.sides[0].active[0];
    const tooltips = new BattleTooltips(battle);
    const text = tooltips.getPokemonAbilityText(snorlax, {
      ...SNORLAX_SERVER,
      sharedAbilities: ['intimidate', 'chlorophyll'],
    }, true);

    assert.match(text, /Shared:/, 'Should contain Shared: label');
    assert.match(text, /intimidate/i, 'Should contain Intimidate');
    assert.match(text, /chlorophyll/i, 'Should contain Chlorophyll');
  });

  it('Empty sharedAbilities should not show Shared line', () => {
    const battle = createBattle([
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
    ]);

    const snorlax = battle.sides[0].active[0];
    const tooltips = new BattleTooltips(battle);
    const text = tooltips.getPokemonAbilityText(snorlax, {
      ...SNORLAX_SERVER,
      sharedAbilities: [],
    }, true);

    assert.doesNotMatch(text, /Shared:/, 'Should not contain Shared: label');
  });

  it('Missing sharedAbilities should not show Shared line', () => {
    const battle = createBattle([
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
    ]);

    const snorlax = battle.sides[0].active[0];
    const tooltips = new BattleTooltips(battle);
    const text = tooltips.getPokemonAbilityText(snorlax, SNORLAX_SERVER, true);

    assert.doesNotMatch(text, /Shared:/, 'Should not contain Shared: label');
  });

  it('Switch tooltip should show shared abilities', () => {
    const battle = createBattle([
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
    ]);

    const snorlax = battle.sides[0].active[0];
    const tooltips = new BattleTooltips(battle);
    const text = tooltips.getPokemonAbilityText(snorlax, {
      ...SNORLAX_SERVER,
      sharedAbilities: ['intimidate'],
    }, false);

    assert.match(text, /Shared:/, 'Switch tooltip should contain Shared: label');
    assert.match(text, /intimidate/i, 'Switch tooltip should contain Intimidate');
  });

  it('Transformed Ditto should show both ability info and shared line', () => {
    const battle = createBattle([
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
    ]);

    const snorlax = battle.sides[0].active[0];
    const tooltips = new BattleTooltips(battle);
    const text = tooltips.getPokemonAbilityText(snorlax, {
      ...SNORLAX_SERVER,
      ability: 'Pixilate',
      baseAbility: 'Imposter',
      sharedAbilities: ['intimidate'],
    }, true);

    assert.match(text, /Ability:/, 'Should show Ability: label');
    assert.match(text, /Pixilate/, 'Should show current ability');
    assert.match(text, /Imposter/, 'Should show base ability');
    assert.match(text, /Shared:/, 'Should show Shared: label');
    assert.match(text, /intimidate/i, 'Should show shared Intimidate');
  });

  it('Shared ability -start should not clobber the displayed ability', () => {
    const battle = createBattle([
      '|switch|p1a: Gothitelle|Gothitelle, F|100/100',
      '|-start|p1a: Gothitelle|ability: Shadow Tag',
      '|-start|p1a: Gothitelle|ability: Dauntless Shield',
      '|-start|p1a: Gothitelle|ability: Snow Warning',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
    ]);

    const gothitelle = battle.sides[0].active[0];
    // After processing -start messages, clientPokemon.ability is clobbered
    // to the last shared ability. The tooltip should still show the real ability.

    const tooltips = new BattleTooltips(battle);
    const serverPokemon = {
      ...SNORLAX_SERVER,
      speciesForme: 'Gothitelle',
      ability: 'Shadow Tag',
      baseAbility: 'Shadow Tag',
      sharedAbilities: ['dauntlessshield', 'snowwarning'],
    };
    const text = tooltips.getPokemonAbilityText(gothitelle, serverPokemon, true);

    // The ability line (before <br />) should show the real ability
    const abilityLine = text.split('<br />')[0];
    assert.match(abilityLine, /Shadow Tag/, 'Should show Shadow Tag as the ability');
    assert.doesNotMatch(abilityLine, /Dauntless Shield/, 'Should not show Dauntless Shield as the main ability');
    assert.doesNotMatch(abilityLine, /Snow Warning/, 'Should not show Snow Warning as the main ability');
    assert.match(text, /Shared:/, 'Should still show the Shared: line');
  });

  it('Shared ability -start firing before own ability should not corrupt baseAbility display', () => {
    // Shared Moxie -start fires BEFORE own Weak Armor -start, which would
    // clobber clientPokemon.baseAbility to Moxie. serverPokemon corrects it.
    const battle = createBattle([
      '|switch|p1a: Ceruledge|Ceruledge|100/100',
      '|-start|p1a: Ceruledge|ability: Moxie',
      '|-start|p1a: Ceruledge|ability: Weak Armor',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
    ]);

    const ceruledge = battle.sides[0].active[0];
    const tooltips = new BattleTooltips(battle);
    const serverPokemon = {
      ...SNORLAX_SERVER,
      speciesForme: 'Ceruledge',
      ability: 'Weak Armor',
      baseAbility: 'Weak Armor',
      sharedAbilities: ['moxie'],
    };
    const text = tooltips.getPokemonAbilityText(ceruledge, serverPokemon, true);

    const abilityLine = text.split('<br />')[0];
    assert.match(abilityLine, /Weak Armor/, 'Should show Weak Armor as the ability');
    assert.doesNotMatch(abilityLine, /base:/, 'Should not show a base ability annotation');
    assert.doesNotMatch(abilityLine, /Moxie/, 'Should not show Moxie as the base ability');
  });

  it('Levitate shared should make move-preview groundedness checks false', () => {
    const battle = createBattle([
      '|switch|p1a: Rotom|Rotom|100/100',
      '|switch|p2a: Blissey|Blissey, F|100/100',
      '|turn|1',
      '|',
      '|switch|p1a: Snorlax|Snorlax, M|100/100',
      '|-start|p1a: Snorlax|ability: Levitate',
      '|turn|2',
    ]);

    const snorlax = battle.sides[0].active[0];
    assert(snorlax.volatiles['levitate'], 'Snorlax should have levitate volatile');

    assert.equal(snorlax.isGrounded(SNORLAX_SERVER), false, 'Shared Levitate should make Snorlax ungrounded');
  });

});
