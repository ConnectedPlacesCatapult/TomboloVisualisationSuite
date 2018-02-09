/**
 * Export Map Class
 */

import 'rxjs/add/operator/map';
import * as jsPDF from 'jspdf';
import {saveAs} from 'file-saver';
import {Map} from 'mapbox-gl';
import * as webglToCanvas2d from 'webgl-to-canvas2d';
import {MapDom} from "./map-dom";

export class ExportMap {

  renderMap: Map;
  nativeDPI: number;

  dimensionsLimit = 1200; // Max width and height in mm
  dpiLimit = 300;

  mapDom = new MapDom();

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
  downloadCanvas(options: object, name: string, width: number, height: number, dpi: number, format: string, drawOverlay = () => {}): Promise<string> {

    // Handle errors
    const errors = this.getErrors(width, height, dpi);
    if (errors !== '') {
      return new Promise((resolve,reject) => {
        reject(new Error(errors));
      });
    }

    const containerWidth = (width/25.4)*96, containerHeight = (height/25.4)*96;
    this.nativeDPI = window.devicePixelRatio * 96;

    this.setCanvasDPI(dpi);

    const container = this.mapDom.createContainerDiv(containerWidth, containerHeight);

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

          // Before blobbing, draw something overlaying the map.
          let colourScaleCanvas = this.mapDom.createColourScaleCanvas(canvas.width, canvas.height);
          let colourScaleCtx = colourScaleCanvas.getContext("2d");

          // User-defined draw instructions for the colour-scale canvas.
          drawOverlay(colourScaleCtx);

          // Combine the map canvas and the overlayed colour-scale canvas.
          let map2dCanvas = webglToCanvas2d(canvas);
          let mapCtx = map2dCanvas.getContext("2d");
          mapCtx.drawImage(colourScaleCanvas, 0, 0);


          if (format === 'png') {
            map2dCanvas.toBlob(blob => saveAs(blob, fileName));
            resolve(fileName);
          } else if (format === 'pdf') {
            this.buildPdf(map2dCanvas, fileName, width, height);
            resolve(fileName);
          } else {
            reject(new Error(`Unsupported format ${format}. Must be png or pdf.`));
            return;
          }

          this.revertChanges();
        }, 300);
      });
    });

  }

  private buildPdf(canvas, name: string, width: number, height: number): void {
    let pdf = new jsPDF({
      orientation: width > height ? 'l' : 'p',
      unit: 'in',
      format: [width, height],
      compress: true
    });

    pdf.addImage(canvas.toDataURL('image/png'),
      'png', 0, 0, width, height, null, 'FAST');

    pdf.save(name);
  }

  private setCanvasDPI(dpi: number): void {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => dpi/96
    });
  }

  // Remove temporary DOM elements and map copy,
  // and change the DPI back to its native setting.
  private revertChanges(): void {
    this.renderMap.remove();
    this.mapDom.revertDomChanges();
    this.setCanvasDPI(this.nativeDPI);
  }

  private getErrors(width: number, height: number, dpi: number): string {
    let errors = [];

    if (width > this.dimensionsLimit || width < 0 || height > this.dimensionsLimit || height < 0) {
      errors.push(`Width and height be between 0 and ${this.dimensionsLimit}mm.`);
    }

    if (dpi > this.dpiLimit || dpi < 0) {
      errors.push(`DPI must be between 0 and ${this.dpiLimit}.`);
    }

    return errors.join(' ');
  }
}
