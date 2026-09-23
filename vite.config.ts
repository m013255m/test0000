import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function lanAttendancePlugin(): Plugin {
  let inMemoryMembers: any[] = [];
  let inMemoryAttendance: any[] = [];

  return {
    name: 'lan-attendance-sync',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // Host computer syncs members & attendance to server memory
        if (url.startsWith('/api/lan-sync') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (Array.isArray(data.members)) inMemoryMembers = data.members;
              if (Array.isArray(data.attendance)) inMemoryAttendance = data.attendance;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: inMemoryMembers.length }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'invalid json' }));
            }
          });
          return;
        }

        // Phone gets latest members across local network
        if (url.startsWith('/api/lan-members') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ members: inMemoryMembers }));
          return;
        }

        // Direct /attendance route rewrite so dev server and proxies never 404
        if (url.startsWith('/attendance') && !url.includes('.')) {
          const queryString = url.includes('?') ? url.substring(url.indexOf('?')) : '';
          req.url = '/index.html' + queryString;
        }

        // Phone registers attendance across local network
        if (url.startsWith('/api/lan-attendance') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const record = JSON.parse(body);
              // Avoid exact duplicate timestamp
              const exists = inMemoryAttendance.some(
                (a) => a.id === record.id || (a.memberId === record.memberId && a.date === record.date && Math.abs(a.checkInTimestamp - record.checkInTimestamp) < 5000)
              );
              if (!exists) {
                inMemoryAttendance.unshift(record);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, record }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'invalid json' }));
            }
          });
          return;
        }

        // Host computer pulls attendance registered by phones
        if (url.startsWith('/api/lan-attendance') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ attendance: inMemoryAttendance }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), lanAttendancePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
