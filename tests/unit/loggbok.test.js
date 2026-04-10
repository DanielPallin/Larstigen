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
});