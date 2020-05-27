import { arrayProp, getModelForClass, modelOptions, prop } from '../../src/typegoose';

@modelOptions({
  schemaOptions: {
    discriminatorKey: 'width',
    collection: 'buildings'
  }
})
export class Building {
  @prop({ default: 100 })
  public width?: number;
}

export class OfficeBuilding extends Building {
  @prop({ default: 4 })
  public doors?: number;
}

export class Garage extends Building {
  @prop({ default: 10 })
  public slotsForCars?: number;
}

@modelOptions({
  schemaOptions: {
    collection: 'skyscrapers'
  }
})
export class Skyscraper extends OfficeBuilding {
  @prop({ default: 'Some cool string' })
  public name?: string;

  @prop({ _id: false })
  public mainGarage?: Garage;

  @arrayProp({ items: Garage, _id: false })
  public garagesInArea?: Garage[];
}

export const SkyscraperModel = getModelForClass(Skyscraper);
