import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Detta letar i ALLA mappar under tests efter filer som slutar på .test.js eller .test.ts
    include: ['tests/*/.{test,spec}.{js,ts}'],
    environment: 'jsdom', // Krävs för att testa kod som använder document.querySelector osv.
  },
});