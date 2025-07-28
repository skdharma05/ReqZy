import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  rules?: any; // optional JSON rules for PR categorization
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  rules: { type: Schema.Types.Mixed },
});

export const CategoryModel = model<ICategory>("Category", CategorySchema);
