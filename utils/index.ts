import { CONFIG } from '@/config';
import { Collection } from '@/domain';
import { writeFileSync } from 'fs';

export { Fixtures } from './fixtures/base-fixtures';
export { getImageFixture } from './fixtures/image-fixtures';
export { DirectoryFixtures } from './fixtures/directory-fixtures';

export const corruptCollectionDB = (collection: Collection): void => {
    writeFileSync(`${CONFIG.COLLECTIONS_DIRECTORY}/${collection.name}/collection.db`, 'corrupted');
}
