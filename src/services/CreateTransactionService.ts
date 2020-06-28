import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction, { TransactionTypes } from '../models/Transaction';
import Category from '../models/Category';
import CreateCategoryService from './CreateCategoryService';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: TransactionTypes;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    if (type.toString() === 'outcome') {
      const balance = await transactionRepository.getBalance();
      if (value > balance.total) {
        throw new AppError('Insufficient balance');
      }
    }
    const categoryRepository = getRepository(Category);
    let transactionCategory = await categoryRepository.findOne({
      title: category,
    });
    if (!transactionCategory) {
      const createCategory = new CreateCategoryService();
      transactionCategory = await createCategory.execute({ title: category });
    }
    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: transactionCategory?.id,
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
