import fs from 'fs';
import path from 'path';

function safeDelete(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true });
    console.log('deleted:', filePath);
  }
}

export default async function (context) {
  const appDir = context.appOutDir;

  const localesDir = path.join(appDir, 'locales');
  if (fs.existsSync(localesDir)) {
    for (const file of fs.readdirSync(localesDir)) {
      if (file !== 'en-US.pak') {
        safeDelete(path.join(localesDir, file));
      }
    }
  }

  console.log('done');
};