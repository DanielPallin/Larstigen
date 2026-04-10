import { describe, it, expect } from 'vitest';
import { escapeHTML } from '../../ts/loggbok'; 

describe('Loggbok Unit Tests', () => {
  it('escapeHTML bör neutralisera farlig HTML', () => {
    const maliciousInput = '<img src=x onerror=alert(1)>';
    const safeOutput = '&lt;img src=x onerror=alert(1)&gt;';
    expect(escapeHTML(maliciousInput)).toBe(safeOutput);
  });

  it('escapeHTML bör hantera tomma värden', () => {
    expect(escapeHTML(null)).toBe("");
    expect(escapeHTML(undefined)).toBe("");
    expect(escapeHTML("")).toBe("");
  });
});