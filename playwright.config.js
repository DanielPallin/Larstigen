import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  // 👇 LÄGG TILL DETTA BLOCK: Berättar för Playwright hur den startar din hemsida
  webServer: {
    command: 'npm run dev',        // Kommandot för att starta din Vite-server
    url: 'http://localhost:5173',  // Adressen den ska sitta och vänta på
    reuseExistingServer: !process.env.CI, // (Smart funktion: Återanvänder servern om du kör lokalt, startar en ny i GitHub)
    timeout: 120 * 1000,           // Ger servern upp till 2 minuter på sig att vakna i molnet
  },
});