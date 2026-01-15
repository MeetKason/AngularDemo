import { provideAnimations } from '@angular/platform-browser/animations';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideNzIcons } from 'ng-zorro-antd/icon';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    //provideNzIcons([EyeOutlin]),
  ],
};
