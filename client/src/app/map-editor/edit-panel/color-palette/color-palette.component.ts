import {ChangeDetectionStrategy, Component, HostBinding, Input, ViewEncapsulation} from '@angular/core';


@Component({
  selector: 'color-palette',
  templateUrl: './color-palette.html',
  styleUrls: ['./color-palette.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPaletteComponent {

  @HostBinding('class.color-palette') numberSliderComponentClass = true;

  @Input() colors: string[];

  constructor() {}

}
