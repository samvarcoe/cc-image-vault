import { Controller } from '../../mvc.js';
import HomePageModel from './model.js';
import HomePageView from './view.js';

export default class HomePageController extends Controller<HomePageModel, HomePageView> {}