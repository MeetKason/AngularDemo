import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private isDark = false;

  toggleTheme() {
    this.isDark = !this.isDark;
    const hostClass = this.isDark ? 'dark-theme' : 'light-theme';
    // 直接操作 body 的 class，确保所有组件（包括弹窗）都能响应
    document.body.className = hostClass;
    //return this.isDark;
  }
}
