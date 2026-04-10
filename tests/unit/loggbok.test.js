<<<<<<< HEAD
import { test, expect } from "vitest";
import { escapeHTML } from "../../ts/loggbok";

test('escapeHTML omvandlar farliga tecken till säkra HTML-entiteter', () => {
    const farligSträng = '<script>alert("Hej & Välkommen")</script>';
    const säkerSträng = escapeHTML(farligSträng);
    
    // Förväntar sig att <, >, och & har bytts ut
    expect(säkerSträng).toBe('&lt;script&gt;alert(&quot;Hej &amp; Välkommen&quot;)&lt;/script&gt;');
});

test('escapeHTML hanterar tomma strängar korrekt', () => {
    expect(escapeHTML('')).toBe('');
=======
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
>>>>>>> aa5fcff8742ff25929c79979cd774bd386cc151d
});