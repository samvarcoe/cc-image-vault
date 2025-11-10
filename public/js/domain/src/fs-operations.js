import fs from 'fs';
import { promises } from 'fs';
let shouldFail = false;
let errorMessage = 'Injected test error';
export const fsOps = {
    setFailure(fail, message = 'Injected test error') {
        shouldFail = fail;
        errorMessage = message;
    },
    mkdirSync(filePath, options) {
        if (shouldFail)
            throw new Error(errorMessage);
        return fs.mkdirSync(filePath, options);
    },
    readdirSync(filePath, options) {
        if (shouldFail)
            throw new Error(errorMessage);
        return fs.readdirSync(filePath, options);
    },
    writeFileSync(filePath, data, options) {
        if (shouldFail)
            throw new Error(errorMessage);
        return fs.writeFileSync(filePath, data, options);
    },
    existsSync: fs.existsSync.bind(fs),
    statSync: fs.statSync.bind(fs),
    rmSync: fs.rmSync.bind(fs),
    unlinkSync: fs.unlinkSync.bind(fs),
    stat: promises.stat.bind(promises),
    readFile: promises.readFile.bind(promises),
    writeFile: promises.writeFile.bind(promises),
    unlink: promises.unlink.bind(promises)
};
