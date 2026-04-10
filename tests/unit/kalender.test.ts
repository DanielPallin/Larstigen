import { describe, it, expect } from 'vitest';
// Du måste exportera funktionen från kalender.ts för att kunna importera den här!
import { getDatesOfWeek } from '../../ts/utils'; 

describe('Unit test: Kalenderns hjälpfunktioner (kalender.ts)', () => {

  describe('Funktion: getDatesOfWeek', () => {
    
    it('ska returnera rätt måndag och söndag för en standardvecka (Vecka 16, 2026)', () => {
      // Vi VET från en vanlig kalender att v.16 2026 är 13 april - 19 april.
      // Här testar vi exakt den vecka vi precis byggde i appen.
      const result = getDatesOfWeek(16, 2026);
      expect(result).toEqual({ start: '2026-04-13', end: '2026-04-19' });
    });

    it('ska hantera årets första vecka korrekt (även om den börjar föregående år)', () => {
      // Edge case: Vecka 1 år 2026 börjar faktiskt måndagen den 29 december 2025!
      // Detta är ett klassiskt ställe där Date-matematik ofta går sönder.
      const result = getDatesOfWeek(1, 2026);
      expect(result).toEqual({ start: '2025-12-29', end: '2026-01-04' });
    });

    it('ska hantera skottår över månadsskiftet februari/mars (Vecka 9, 2024)', () => {
      // Edge case: 2024 var ett skottår. Vecka 9 spänner över den extra dagen (29 feb).
      const result = getDatesOfWeek(9, 2024);
      expect(result).toEqual({ start: '2024-02-26', end: '2024-03-03' });
    });

    it('ska hantera slutet på året (Vecka 52, 2026)', () => {
      // Edge case: Sista veckan på året, som sträcker sig in i nästa år.
      const result = getDatesOfWeek(52, 2026);
      expect(result).toEqual({ start: '2026-12-21', end: '2026-12-27' });
    });

  });

});