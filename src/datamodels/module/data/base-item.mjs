import mighty-bladeDataModel from "./base-model.mjs";

export default class mighty-bladeItemBase extends mighty-bladeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.description = new fields.StringField({ required: true, blank: true });

    return schema;
  }

}