import { contextBridge } from 'electron';
import fs from 'fs';
import path from 'path';

contextBridge.exposeInMainWorld('wasmLoader', {
    load: () => {
        const fullPath = path.join(
            process.resourcesPath,
            'wasm/hducgh_backend_web.wasm'
        );
        return fs.readFileSync(fullPath);
    }
});