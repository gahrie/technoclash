import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/src/index.jsx', // New entry point
                'resources/sass/app.scss',
            ],
            refresh: true,
        }),
        react(),
    ],
});
