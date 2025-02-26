import { describe, test, expect } from 'vitest';
import axios from '../utils/axios';

test('axios instance exists', () => {
  expect(axios).toBeTruthy();
});
