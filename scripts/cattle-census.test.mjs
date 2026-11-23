import assert from 'node:assert/strict';
import test from 'node:test';
import { census } from './cattle-census.mjs';

function sum(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0);
}

test('census size classes add back to the inventory', () => {
  for (const level of [census.levels.us, census.levels.tx, census.levels.bastrop]) {
    assert.equal(sum(level.size, 'head'), level.inventory.head, level.label);
    assert.equal(sum(level.size, 'farms'), level.inventory.farms, level.label);
  }
  assert.equal(sum(census.levels.bastrop.beefCowSize, 'head'), census.levels.bastrop.beefCows.head);
  assert.equal(sum(census.levels.bastrop.beefCowSize, 'farms'), census.levels.bastrop.beefCows.farms);
  assert.equal(sum(census.levels.us.largeBands, 'farms'), census.levels.us.size.at(-1).farms);
  assert.equal(sum(census.levels.us.largeBands, 'head'), census.levels.us.size.at(-1).head);
});

test('Bastrop cattle sales match the county profile', () => {
  assert.equal(census.levels.bastrop.inventory.head, 46801);
  assert.equal(census.levels.bastrop.sales.dollars, 26989000);
  assert.equal(census.levels.bastrop.inventory2017.head, 76438);
});
