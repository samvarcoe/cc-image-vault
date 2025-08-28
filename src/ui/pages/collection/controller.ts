import { Controller } from '../../mvc.js';
import CollectionPageModel from './model.js';
import CollectionPageView from './view.js';

export default class CollectionPageController extends Controller<CollectionPageModel, CollectionPageView> {
  constructor(model: CollectionPageModel, view: CollectionPageView) {
    super(model, view);
  }
}