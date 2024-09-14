interface Transaction {
    _id: string;
    amount: number;
    description: string;
    medium: 'balance' | 'credit';
    payee_id?: string;
    payer_id?: string;
    status: 'completed' | 'cancelled' | 'pending';
    transaction_date: string;
    type: 'deposit' | 'withdrawal' | 'transfer' | 'purchase';
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

    // Method to make a purchase
    purchase(amount: number, description: string = 'Purchase made', location: string = 'Store'): void {
        if (amount <= 0) {
            throw new Error('Purchase amount must be positive.');
        }
        if (this.balance < amount) {
            throw new Error('Insufficient funds.');
        }
        this.balance -= amount;
        this.recordTransaction('purchase', amount, description, location, 'balance', undefined, this.accountId);
    }

    // Method to deposit money
    deposit(amount: number, description: string = 'Deposit made', location: string = 'Online'): void {
        if (amount <= 0) {
            throw new Error('Deposit amount must be positive.');
        }
        this.balance += amount;
        this.recordTransaction('deposit', amount, description, location, 'balance', this.accountId, undefined);
    }

    // Method to withdraw money
    withdraw(amount: number, description: string = 'Withdrawal made', location: string = 'ATM'): void {
        if (amount <= 0) {
            throw new Error('Withdrawal amount must be positive.');
        }
        if (this.balance < amount) {
            throw new Error('Insufficient funds.');
        }
        this.balance -= amount;
        this.recordTransaction('withdrawal', amount, description, location, 'balance', undefined, this.accountId);
    }

    // Method to transfer money to another account
    transfer(amount: number, recipientAccount: BankAccount, description: string = 'Transfer made', location: string = 'Online'): void {
        if (amount <= 0) {
            throw new Error('Transfer amount must be positive.');
        }
        if (this.balance < amount) {
            throw new Error('Insufficient funds.');
        }
        this.withdraw(amount, description, location); // Withdraw from current account
        recipientAccount.deposit(amount, description, location); // Deposit into recipient's account
        this.recordTransaction('transfer', amount, description, location, 'balance', recipientAccount.accountId, this.accountId);
    }

    // Method to check current balance
    checkBalance(): number {
        return this.balance;
    }

    // Method to get transaction history
    getTransactionHistory(): Transaction[] {
        return this.transactions;
    }

    // Method to record each transaction
    private recordTransaction(
        type: 'deposit' | 'withdrawal' | 'transfer' | 'purchase',
        amount: number,
        description: string,
        location: string,
        medium: 'balance' | 'credit',
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
            status: 'completed', // Default status, can be updated if needed
            transaction_date: new Date().toISOString(),
            type,
            location
        };
        this.transactions.push(transaction);
    }

    // Helper method to generate a unique transaction ID
    private generateTransactionId(): string {
        return Math.random().toString(36).substr(2, 9); // Generates a random ID
    }
}

export { BankAccount, Transaction };
