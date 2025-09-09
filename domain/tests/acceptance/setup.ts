import { CONFIG } from "@/config";
import { Fixtures, DirectoryFixtures } from "@/utils";
import { use as chaiUse, config as chaiConfig } from "chai";
import sinon from "sinon";
import chaiMatchPattern from 'chai-match-pattern';

chaiUse(chaiMatchPattern);
chaiConfig.includeStack = true;
chaiConfig.truncateThreshold = 0;
chaiConfig.showDiff = true;

export const mochaHooks = {
    async beforeEach() {
        const tmpDir = await DirectoryFixtures.createTemporary({ prefix: 'acceptance-tests-' });
        sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(tmpDir.path);
    },

    async afterEach() {
        sinon.restore();
        await Fixtures.cleanup();
    }
};