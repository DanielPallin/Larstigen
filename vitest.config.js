import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 👇 HÄR ÄR MAGIN FÖR GITHUB ACTIONS: 
    // Vi ger Vitest låtsas-nycklar så att api.ts aldrig kraschar när den byggs i molnet!
    env: {
      VITE_SUPABASE_URL: 'https://latsas-url.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'latsas-nyckel'
    },

    // 1. Leta efter testfiler i BÅDE unit- och integration-mapparna. 
    // Vi lägger till stöd för både .js och .ts (TypeScript).
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts}',
      'tests/integration/**/*.{test,spec}.{js,ts}',
    ],
    
    // 2. Säg till Vitest att ignorera Playwrights E2E-tester, 
    // så de inte krockar med varandra.
    exclude: [
      'tests/e2e/**/*', 
      'node_modules/**/*'
    ],

    // 3. Slå på JSDOM så att dina integrationstester kan rita upp HTML (DOM)
    environment: 'jsdom',

    // 4. (Bonus) Rensar automatiskt alla dina "vi.mock()" mellan varje test 
    // så att ett test inte råkar påverka nästa.
    clearMocks: true,
  },
});