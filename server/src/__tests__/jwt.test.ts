import { test, expect } from 'vitest';
import { generateAccessToken } from '../utils/jwt';

test('generates a token', () => {
  process.env.ACCESS_SECRET = 'test-secret';
  const token = generateAccessToken('123', 'test');
  expect(token).toBeTruthy();
});
