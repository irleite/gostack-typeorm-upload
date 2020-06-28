import { getRepository } from 'typeorm';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
}

class CreateCategoryService {
  public async execute({ title }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);
    const categoryExists = await categoryRepository.findOne({
      title,
    });
    if (categoryExists) {
      throw new AppError('Category already exists');
    }
    const category = categoryRepository.create({
      title,
    });
    await categoryRepository.save(category);
    return category;
  }
}

export default CreateCategoryService;
