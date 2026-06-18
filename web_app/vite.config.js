import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
    const isElectron = process.env.BUILD_TARGET === 'electron';

    return {
        base: isElectron ? './' : '/web-app/',
        plugins: [
            react(),
            tailwindcss(),
        ],
    }
})