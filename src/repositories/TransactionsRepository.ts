import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  private async GetSumValues(type: string): Promise<number> {
    const { value } = await this.createQueryBuilder('transaction')
      .select('SUM(transaction.value)', 'value')
      .where(' type = :type', { type })
      .getRawOne();
    return value || 0;
  }

  public async getBalance(): Promise<Balance> {
    const income = (await this.GetSumValues('income')) as number;
    const outcome = (await this.GetSumValues('outcome')) as number;

    const total = income - outcome;
    return {
      income,
      outcome,
      total,
    };
  }
}

export default TransactionsRepository;
