import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    // Detta letar i ALLA mappar under tests efter filer som slutar på .test.js eller .test.ts
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'], // Ignorera e2e-mappen så att Playwright får hantera de filerna ifred
    environment: 'jsdom', // Krävs för att testa kod som använder document.querySelector osv.
  },
});