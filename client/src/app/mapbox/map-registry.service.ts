/**
 * MapRegistry - service to register and retrieve MapBoxGL maps
 */

import {Injectable} from "@angular/core";
import * as Debug from 'debug';
import {TomboloMapbox} from "./mapbox.component";

const debug = Debug('tombolo:MapRegistry');

@Injectable()
export class MapRegistry {

  private maps: Map<string, Promise<TomboloMapbox>> = new Map<string, Promise<TomboloMapbox>>();

  registerMap(id: string, map: TomboloMapbox): void {

    debug(`Registering map '${id}'`);

    this.maps.set(id, new Promise((resolve, reject) => {
      map.once('load', () => {
        debug(`Registered map '${id}'`);
        resolve(map);
      });
    }));
  }

  getMap(id: string): Promise<TomboloMapbox> {
    debug(`Getting map '${id}'`);
    const mapPromise = this.maps.get(id);
    if (!mapPromise) {
      return Promise.reject(new Error(`Map '${id}' not registered`));
    }

    return mapPromise;
  }
}
