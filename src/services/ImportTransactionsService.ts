import fs from 'fs';
import csvParse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction, { TransactionTypes } from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  value: number;
  type: TransactionTypes;
  category: string;
}

interface Request {
  path: string;
}

class ImportTransactionsService {
  public async execute({ path }: Request): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);
    const transactionsCSV: CSVTransaction[] = [];
    const categoriesCSV: string[] = [];
    const transactionsFile = fs.createReadStream(path);
    const parses = csvParse({
      from_line: 2,
    });

    const parseCSV = transactionsFile.pipe(parses);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value || !category) return;
      const categoryIndex = categoriesCSV.findIndex(item => item === category);
      if (categoryIndex < 0) {
        categoriesCSV.push(category);
      }
      transactionsCSV.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categoriesCSV),
      },
    });

    const existentCategoryTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const categoriesToCreate = categoriesCSV.filter(
      category => !existentCategoryTitles.includes(category),
    );

    const createdCategories = categoryRepository.create(
      categoriesToCreate.map(title => ({ title })),
    );

    await categoryRepository.save(createdCategories);

    const categories = [...existentCategories, ...createdCategories];

    const createdTransactios = transactionRepository.create(
      transactionsCSV.map(transaction => {
        const { title, value, type, category } = transaction;
        const categoryTransaction = categories.find(
          item => item.title === category,
        );
        return {
          title,
          category: categoryTransaction,
          type,
          value,
        };
      }),
    );
    await transactionRepository.save(createdTransactios);

    await fs.promises.unlink(path);
    return createdTransactios;
  }
}

export default ImportTransactionsService;
