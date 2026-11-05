import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import manifest from './src/manifest.json';

const { action, background: _background, host_permissions, optional_host_permissions, ...base } = manifest;

const firefoxManifest = (): Plugin => ({
  name: 'firefox-manifest',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'manifest.json',
      source: JSON.stringify({
        ...base,
        manifest_version: 2,
        browser_action: action,
        permissions: [...manifest.permissions, ...host_permissions],
        optional_permissions: optional_host_permissions,
        // Firefox supports persistent MV2 pages. Bulk requests can take minutes;
        // MV3's event page may suspend even a pending listener after two idle
        // intervals when the popup closes. Keep this task runner persistent.
        background: { scripts: ['background.js'], type: 'module', persistent: true },
        browser_specific_settings: {
          gecko_android: { strict_min_version: '142.0' },
          gecko: {
            id: 'markmind@zeya-labs.github.io',
            strict_min_version: '140.0',
            data_collection_permissions: {
              required: ['bookmarksInfo', 'websiteContent', 'browsingActivity', 'authenticationInfo'],
            },
          },
        },
      }, null, 2),
    });
  },
});

export default defineConfig({
  plugins: [react(), firefoxManifest()],
  // Firefox's MV2 chrome namespace is callback-only; its native browser
  // namespace provides the Promise APIs used by this application.
  define: { chrome: 'browser' },
  build: {
    outDir: 'dist/firefox',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: chunk => chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
        manualChunks: {
          'vendor-react': ['react', 'react-dom/client'],
        },
      },
    },
  },
});
