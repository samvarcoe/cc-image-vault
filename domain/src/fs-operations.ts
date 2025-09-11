/**
 * Filesystem operations wrapper to enable testing
 * This module provides a mockable interface for filesystem operations
 */

import * as fs from 'fs';
import { promises } from 'fs';

export const fsOps = {
  mkdirSync: fs.mkdirSync.bind(fs),
  existsSync: fs.existsSync.bind(fs),
  statSync: fs.statSync.bind(fs),
  rmSync: fs.rmSync.bind(fs),
  readdirSync: fs.readdirSync.bind(fs),
  writeFileSync: fs.writeFileSync.bind(fs),
  unlinkSync: fs.unlinkSync.bind(fs),
  // Async operations
  stat: promises.stat.bind(promises),
  readFile: promises.readFile.bind(promises),
  writeFile: promises.writeFile.bind(promises),
  unlink: promises.unlink.bind(promises)
};