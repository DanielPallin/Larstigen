import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {

        main: resolve(__dirname, 'index.html'), 
        
        dashboard: resolve(__dirname, 'pages/dashboard.html'),
        information: resolve(__dirname, 'pages/information.html'),
        kalender: resolve(__dirname, 'pages/kalender.html'),
        loggbok: resolve(__dirname, 'pages/loggbok.html'),
        profil: resolve(__dirname, 'pages/profil.html')
      }
    }
  }
});