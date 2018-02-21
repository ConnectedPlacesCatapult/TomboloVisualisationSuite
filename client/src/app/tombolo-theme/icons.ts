
import {MatIconRegistry} from '@angular/material';
import {DomSanitizer} from '@angular/platform-browser';

export  const ICONS = [
  'backarrow',
  'cross',
  'disclosure',
  'dropdown',
  'export',
  'eye',
  'info',
  'line',
  'login',
  'map',
  'map-pin',
  'minus',
  'plus',
  'polygon',
  'radio-off',
  'radio-on',
  'save',
  'share',
  'signup',
  'trash',
  'user'
];

export function RegisterIcons(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
  return () => {
    ICONS.forEach(icon =>
      iconRegistry.addSvgIcon(icon, sanitizer.bypassSecurityTrustResourceUrl(`assets/icons/${icon}.svg`)));
  }
}
