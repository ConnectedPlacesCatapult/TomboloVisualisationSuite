import {ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, ViewEncapsulation} from '@angular/core';
import {IPalette} from '../../../../../../src/shared/IPalette';

const DEFAULT_CHIP_SIZE = 20;

interface MapKeyChip {
  color: string;
  value: number | string;
  size: number,
  tooltip: string
}

@Component({
  selector: 'map-key-item',
  templateUrl: './map-key-item.html',
  styleUrls: ['./map-key-item.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapKeyItemComponent implements OnChanges {

  @HostBinding('class.map-key-item') mapKeyItemClass = true;

  @Input() title: string;
  @Input() palette: IPalette; // With 5 color stops to apply to chips
  @Input() ndColor: string;
  @Input() values: number[]; // Array of 5 values to annotate each chip
  @Input() mode: 'square' | 'circle';
  @Input() sizes: number[]; // Array of 5 pixels sizes for each chip. Can be null to specify fixed max size

  chips: MapKeyChip[];

  constructor() {}

  ngOnChanges(changes) {

    // Init chips
    let chips: MapKeyChip[] = [];

    // NoData chip
    chips.push({
      color: this.ndColor,
      value: 'ND',
      size: ((this.sizes)? this.sizes[0] : DEFAULT_CHIP_SIZE),
      tooltip: 'No Data'
    });

    for(let i = 0; i < 5; i++) {
      chips.push({
        color: (this.palette)? this.palette.colorStops[i] : this.ndColor,
        value: this.values[i],
        size: ((this.sizes)? this.sizes[i + 1] : DEFAULT_CHIP_SIZE),
        tooltip: null
      })
    }

    this.chips = chips;
  }

}
