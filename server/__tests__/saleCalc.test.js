import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSaleTotals } from '../utils/saleCalc.js';

const products = [
  { id: 'p1', name: 'Agua', code: 'A1', price: 1.5, stock: 10 },
  { id: 'p2', name: 'Arroz', code: 'A2', price: 3.8, stock: 5 },
];

test('calcula subtotal y total correctamente', () => {
  const grouped = new Map([
    ['p1', 3],
    ['p2', 2],
  ]);
  const r = buildSaleTotals(products, grouped, 0);
  assert.equal(r.subtotal, 12.1); // 1.5*3 + 3.8*2 = 4.5 + 7.6
  assert.equal(r.total, 12.1);
  assert.equal(r.detailData.length, 2);
});

test('aplica descuento sin superar el subtotal', () => {
  const grouped = new Map([['p1', 2]]); // subtotal 3.0
  const r = buildSaleTotals([products[0]], grouped, 5); // descuento mayor al subtotal
  assert.equal(r.subtotal, 3.0);
  assert.equal(r.discount, 3.0); // se limita al subtotal
  assert.equal(r.total, 0);
});

test('rechaza venta cuando la cantidad supera el stock', () => {
  const grouped = new Map([['p2', 6]]); // stock es 5
  assert.throws(() => buildSaleTotals([products[1]], grouped, 0), /Stock insuficiente/);
});

test('rechaza cantidades no positivas', () => {
  const grouped = new Map([['p1', 0]]);
  assert.throws(() => buildSaleTotals([products[0]], grouped, 0), /Cantidad inválida/);
});
