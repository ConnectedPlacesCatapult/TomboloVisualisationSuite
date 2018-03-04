import {IMapDefinition} from './IMapDefinition';

export interface IStyle {
  zoom: number;
  center: number[];
  sources: object;
  layers: object[];
  metadata: IStyleMetadata;
}

export interface IStyleMetadata {
  mapDefinition: IMapDefinition;
  insertionPoints: {[key: string]: string};
  basemapDetail: IBasemapDetailMetadata;
  labelLayerStyle: ILabelLayerStyleMetadata;
}

export interface IBasemapDetailMetadata {
  defaultDetailLevel: number;
  layers: {[key: string]: number};
}

export interface ILabelLayerStyleMetadata {
  paint: {[key: string]: any};
  layout: {[key: string]: any};
}
