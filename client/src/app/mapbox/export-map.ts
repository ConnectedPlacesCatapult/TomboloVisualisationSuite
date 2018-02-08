/**
 * Export Map Class
 */

import 'rxjs/add/operator/map';
import * as jsPDF from 'jspdf';
import {saveAs} from 'file-saver';
import {Map} from 'mapbox-gl';

export class ExportMap {

  renderMap: Map;
  nativeDPI: number;

  constructor() {
  }

  /**
   * Download the map canvas as a PNG or PDF file. Width and height should be in inches.
   *
   * @param {string} name
   * @param {number} width
   * @param {number} height
   * @param {number} dpi
   * @param {string} format
   * @returns {Promise<string>}
   */
  downloadCanvas(options: object, name: string, width: number, height: number, dpi: number, format: string): Promise<string> {
    const containerWidth = width*96, containerHeight = height*96;
    this.nativeDPI = window.devicePixelRatio * 96;

    this.setCanvasDPI(dpi);

    const container = this.createContainerDiv(containerWidth, containerHeight);

    // Temporary "copy" of the orginal Map object which will be used for exporting.
    this.renderMap = new Map({
      ...options,
      container: container,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true
    });

    return new Promise((resolve,reject) => {
      this.renderMap.on('load', () => {
        const fileName = `${name}.${format}`;

        setTimeout(() => {
          let canvas = this.renderMap.getCanvas();

          if (format === 'png') {
            canvas.toBlob(blob => saveAs(blob, fileName));
            resolve(fileName);
          } else if (format === 'pdf') {
            this.buildPdf(fileName, width, height);
            resolve(fileName);
          } else {
            reject(new Error(`Unsupported format ${format}. Must be png or pdf.`));
          }

          this.revertChanges();
        }, 300);
      });
    });

  }

  private buildPdf(name: string, width: number, height: number): void {
    let pdf = new jsPDF({
      orientation: width > height ? 'l' : 'p',
      unit: 'in',
      format: [width, height],
      compress: true
    });

    pdf.addImage(this.renderMap.getCanvas().toDataURL('image/png'),
      'png', 0, 0, width, height, null, 'FAST');

    pdf.save(name);
  }

  private setCanvasDPI(dpi: number): void {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => dpi/96
    });
  }

  // Create the container div for the temporary renderMap.
  private createContainerDiv(width: number, height: number): HTMLDivElement {
    let hidden = this.createHiddenDiv();
    let container = document.createElement('div');
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    hidden.appendChild(container);
    return container;
  }

  // Create the hidden div which the renderMap container sits in.
  private createHiddenDiv(): HTMLDataElement {
    let hidden = <HTMLDivElement>document.createElement('div');
    hidden.className = 'hidden-map';
    hidden.id = 'hidden-map';
    hidden.style = 'width: 0px; height: 0px; position: fixed; overflow: hidden;';
    document.body.appendChild(hidden);
    return hidden;
  }

  // Remove temporary DOM elements and map copy,
  // and change the DPI back to its native setting.
  private revertChanges(): void {
    this.renderMap.remove();
    const hidden = document.getElementById('hidden-map');
    hidden.parentNode.removeChild(hidden);
    this.setCanvasDPI(this.nativeDPI);
  }
}
