
export interface ITomboloMap {
  id: string;
  name: string;
  recipe: string;
  description: string;
  icon: string;
  zoom: number;
  center: number;
  ownerId: string;
  basemapId: string;
  mapGroupId: string;
  order: number;
 // layers: TomboloMapLayer[];
}
