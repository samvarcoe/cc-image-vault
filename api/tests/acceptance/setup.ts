import { Fixtures } from "@/utils";
import { use as chaiUse, config as chaiConfig } from "chai";
import sinon from "sinon";
import chaiMatchPattern from 'chai-match-pattern';
import chaiSubset from 'chai-subset';
import { Collection } from "@/domain";

chaiUse(chaiMatchPattern);
chaiUse(chaiSubset);

chaiConfig.includeStack = true;
chaiConfig.truncateThreshold = 0;
chaiConfig.showDiff = true;

export const mochaHooks = {
    async beforeEach() {
       Collection.clear(); 
    },

    async afterEach() {
        sinon.restore();
        await Fixtures.cleanup();
    }
};