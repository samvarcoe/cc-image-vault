import { Model } from '../../mvc';

export interface CollectionListItem {
  id: string;
}

export interface HomePageData {
  collections: CollectionListItem[];
}

export class HomePageModel extends Model<HomePageData> {
  constructor(collections: CollectionListItem[] = []) {
    super({ collections });
  }

  getCollections(): CollectionListItem[] {
    return this.data.collections || [];
  }

  getSortedCollections(): CollectionListItem[] {
    return [...this.getCollections()].sort((a, b) => a.id.localeCompare(b.id));
  }

  hasCollections(): boolean {
    return this.getCollections().length > 0;
  }
}