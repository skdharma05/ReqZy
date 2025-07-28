import { Schema, model, Document } from "mongoose";

export interface IDepartment extends Document {
  name: string;
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, unique: true },
});

export const DepartmentModel = model<IDepartment>(
  "Department",
  DepartmentSchema,
);
