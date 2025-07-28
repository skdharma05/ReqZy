import { DepartmentModel } from "../models/department";
import { CategoryModel } from "../models/category";

export async function checkDepartmentExists(id: string) {
  const dep = await DepartmentModel.findById(id).exec();
  if (!dep) throw new Error(`Department ${id} not found`);
  return dep;
}

export async function checkCategoryExists(id: string) {
  const cat = await CategoryModel.findById(id).exec();
  if (!cat) throw new Error(`Category ${id} not found`);
  return cat;
}
