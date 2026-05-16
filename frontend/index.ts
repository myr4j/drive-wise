// Must be first import — initialises gesture handler for web and native.
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import App from './App';
registerRootComponent(App);
