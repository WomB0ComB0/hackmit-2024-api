// Enum for transaction types, mediums, and statuses
enum TransactionType {
    Deposit = 'deposit',
    Withdrawal = 'withdrawal',
    Transfer = 'transfer',
    Purchase = 'purchase',
}

enum TransactionMedium {
    Balance = 'balance',
    Credit = 'credit',
}

enum TransactionStatus {
    Completed = 'completed',
    Cancelled = 'cancelled',
    Pending = 'pending',
}

interface Transaction {
    _id: string;
    amount: number;
    description: string;
    medium: TransactionMedium;
    payee_id?: string;
    payer_id?: string;
    status: TransactionStatus;
    transaction_date: string;
    type: TransactionType;
    location?: string;
}

class BankAccount {
    private balance: number;
    private transactions: Transaction[];
    private accountId: string;

    constructor(initialBalance: number = 0, accountId: string) {
        this.balance = initialBalance;
        this.transactions = [];
        this.accountId = accountId;
    }

    purchase(amount: number, description: string = 'Purchase made', location: string = 'Store'): void {
        this.validateAmount(amount);
        if (this.balance < amount) throw new Error('Insufficient funds.');
        
        this.balance -= amount;
        this.recordTransaction(TransactionType.Purchase, amount, description, location, TransactionMedium.Balance);
    }

    deposit(amount: number, description: string = 'Deposit made', location: string = 'Online'): void {
        this.validateAmount(amount);
        this.balance += amount;
        this.recordTransaction(TransactionType.Deposit, amount, description, location, TransactionMedium.Balance);
    }

    withdraw(amount: number, description: string = 'Withdrawal made', location: string = 'ATM'): void {
        this.validateAmount(amount);
        if (this.balance < amount) throw new Error('Insufficient funds.');
        
        this.balance -= amount;
        this.recordTransaction(TransactionType.Withdrawal, amount, description, location, TransactionMedium.Balance);
    }

    transfer(amount: number, recipientAccount: BankAccount, description: string = 'Transfer made', location: string = 'Online'): void {
        this.validateAmount(amount);
        if (!recipientAccount) throw new Error('Recipient account does not exist.');
        if (this.balance < amount) throw new Error('Insufficient funds.');
        
        this.withdraw(amount, description, location);
        recipientAccount.deposit(amount, description, location);
        this.recordTransaction(TransactionType.Transfer, amount, description, location, TransactionMedium.Balance, recipientAccount.accountId, this.accountId);
    }

    checkBalance(): number {
        return this.balance;
    }

    getTransactionHistory(): Transaction[] {
        return this.transactions;
    }

    private recordTransaction(
        type: TransactionType,
        amount: number,
        description: string,
        location: string,
        medium: TransactionMedium,
        payee_id?: string,
        payer_id?: string
    ): void {
        const transaction: Transaction = {
            _id: this.generateTransactionId(),
            amount,
            description,
            medium,
            payee_id,
            payer_id,
            status: TransactionStatus.Completed,
            transaction_date: new Date().toISOString(),
            type,
            location,
        };
        this.transactions.push(transaction);
    }

    private generateTransactionId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    private validateAmount(amount: number): void {
        if (amount <= 0) throw new Error('Amount must be positive.');
    }
}

export { BankAccount, TransactionType, TransactionMedium, TransactionStatus, Transaction };
