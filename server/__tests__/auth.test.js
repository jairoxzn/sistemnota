import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, comparePassword } from '../utils/password.js';

test('el hash de contraseña se verifica correctamente', async () => {
  const hash = await hashPassword('Secreto123!');
  assert.notEqual(hash, 'Secreto123!'); // nunca en texto plano
  assert.equal(await comparePassword('Secreto123!', hash), true);
  assert.equal(await comparePassword('incorrecta', hash), false);
});
