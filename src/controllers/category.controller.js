import factory from "./factory.js";
import categoryService from "@/services/category.service.js";

const categoryController = {
  getCategory: factory.getAll(categoryService.getAllCategory),
};

export default categoryController;
