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
  downloadCanvas(options: object, name: string, width: number, height: number, dpi: number, format: string, drawOverlay: (ctx) => void): Promise<string> {

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

          // Overlay user-defined draw instructions for the colour-scale canvas.
          if (drawOverlay !== null) {
            let colourScaleCanvas = this.mapDom.createColourScaleCanvas(canvas.width, canvas.height);
            let colourScaleCtx = colourScaleCanvas.getContext("2d");

            // Pass context into draw instructions.
            drawOverlay(colourScaleCtx);
            canvas = webglToCanvas2d(canvas);
            let mapCtx = canvas.getContext("2d");

            // Combine the map and overlay canvases.
            mapCtx.drawImage(colourScaleCanvas, 0, 0);
          }


          if (format === 'png') {
            canvas.toBlob(blob => saveAs(blob, fileName));
            resolve(fileName);
          } else if (format === 'pdf') {
            this.buildPdf(canvas, fileName, width, height);
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
      unit: 'mm',
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

    if (isNaN(dpi) || isNaN(width) || isNaN(height) ) {
      errors.push(`Width, height and DPI must be numbers.`);
    }

    if (dpi > this.dpiLimit || dpi < 0) {
      errors.push(`DPI must be between 0 and ${this.dpiLimit}.`);
    }

    return errors.join(' ');
  }
}
