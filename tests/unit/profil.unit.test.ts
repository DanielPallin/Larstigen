import { describe, it, expect } from 'vitest';
// Nu importerar vi funktionen DIREKT från din profil.ts!
import { getInitials } from '../../ts/profil'; 

describe('Unit test: Profilsidan (profil.ts)', () => {
  
  describe('Funktion: getInitials', () => {
    it('ska returnera korrekta initialer för ett vanligt för- och efternamn', () => {
      const result = getInitials('Daniel', 'Pallin');
      expect(result).toBe('DP');
    });

    it('ska göra om små bokstäver till stora initialer', () => {
      const result = getInitials('sandra', 'karlsson');
      expect(result).toBe('SK');
    });

    it('ska hantera om efternamnet saknas (exempelvis om databasen returnerar tomt)', () => {
      const result = getInitials('Hanna', '');
      expect(result).toBe('H');
    });

    it('ska inte krascha utan returnera en tom sträng om den får null', () => {
      const result = getInitials(null, null);
      expect(result).toBe('');
    });
  });

});