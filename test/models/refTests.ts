import { arrayProp, getModelForClass, getName, mongoose, prop, Ref } from '../../src/typegoose';

export class RefTestBuffer {
  @prop()
  public _id!: mongoose.Schema.Types.Buffer;
}

export class RefTestNumber {
  @prop()
  public _id!: number;
}

export class RefTestString {
  @prop()
  public _id!: string;
}

export class RefTestStringOptional {
  @prop()
  public _id?: string;
}

export class RefTestStringOrUndefined {
  @prop()
  public _id!: string | undefined;
}

export const RefTestBufferModel = getModelForClass(RefTestBuffer);
export const RefTestNumberModel = getModelForClass(RefTestNumber);
export const RefTestStringModel = getModelForClass(RefTestString);

export class RefTest {
  // ref objectid
  @prop({ ref: RefTest })
  public refField?: Ref<RefTest>;

  @prop({ ref: getName(RefTest) })
  public refField2?: Ref<RefTest>;

  // ref objectid array
  @arrayProp({ ref: RefTest })
  public refArray?: Ref<RefTest>[];

  @arrayProp({ ref: getName(RefTest) })
  public refArray2?: Ref<RefTest>[];

  // ref string
  @prop({ ref: RefTestString, refType: mongoose.Schema.Types.String })
  public refFieldString?: Ref<RefTestString/* , string */>; // RefType not set, to know if automatic Ref is brocken

  @prop({ ref: getName(RefTestString), refType: mongoose.Schema.Types.String })
  public refFieldString2?: Ref<RefTestString/* , string */>; // RefType not set, to know if automatic Ref is brocken

  // ref string array
  @arrayProp({ ref: RefTestString, refType: mongoose.Schema.Types.String })
  public refArrayString?: Ref<RefTestString, string>[];

  @arrayProp({ ref: getName(RefTestString), refType: mongoose.Schema.Types.String })
  public refArrayString2?: Ref<RefTestString, string>[];

  // ref string optional or undefined
  @prop({ ref: RefTestString, refType: mongoose.Schema.Types.String })
  public refFieldStringOptional?: Ref<RefTestStringOptional /* , string */>; // RefType not set, to know if automatic Ref is brocken

  @prop({ ref: getName(RefTestString), refType: mongoose.Schema.Types.String })
  public refFieldStringOrUndefined?: Ref<RefTestStringOrUndefined /* , string */>; // RefType not set, to know if automatic Ref is brocken

  // ref string array
  @arrayProp({ ref: RefTestString, refType: mongoose.Schema.Types.String })
  public refArrayStringOptional?: Ref<RefTestStringOptional, string>[];

  @arrayProp({ ref: getName(RefTestString), refType: mongoose.Schema.Types.String })
  public refArrayStringOrUndefined?: Ref<RefTestStringOrUndefined, string>[];

  // ref number
  @prop({ ref: RefTestNumber, refType: mongoose.Schema.Types.Number })
  public refFieldNumber?: Ref<RefTestNumber, number>;

  @prop({ ref: getName(RefTestNumber), refType: mongoose.Schema.Types.Number })
  public refFieldNumber2?: Ref<RefTestNumber, number>;

  // ref number array
  @arrayProp({ ref: RefTestNumber, refType: mongoose.Schema.Types.Number })
  public refArrayNumber?: Ref<RefTestNumber, number>[];

  @arrayProp({ ref: getName(RefTestNumber), refType: mongoose.Schema.Types.Number })
  public refArrayNumber2?: Ref<RefTestNumber, number>[];

  // ref buffer
  @prop({ ref: RefTestBuffer, refType: mongoose.Schema.Types.Buffer })
  public refFieldBuffer?: Ref<RefTestBuffer, Buffer>;

  @prop({ ref: getName(RefTestBuffer), refType: mongoose.Schema.Types.Buffer })
  public refFieldBuffer2?: Ref<RefTestBuffer, Buffer>;

  // ref buffer array
  @arrayProp({ ref: RefTestBuffer, refType: mongoose.Schema.Types.Buffer })
  public refArrayBuffer?: Ref<RefTestBuffer, Buffer>[];

  @arrayProp({ ref: getName(RefTestBuffer), refType: mongoose.Schema.Types.Buffer })
  public refArrayBuffer2?: Ref<RefTestBuffer, Buffer>[];
}

export const RefTestModel = getModelForClass(RefTest);

export class RefTestArrayTypes {
  @arrayProp({ ref: RefTestString, refType: String })
  public array?: mongoose.Types.Array<Ref<RefTestString>>;
}

export const RefTestArrayTypesModel = getModelForClass(RefTestArrayTypes);
