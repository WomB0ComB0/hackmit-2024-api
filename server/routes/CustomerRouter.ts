import { Router } from 'express';
import { CustomerRepo } from '../repository/CustomerRepo';
import { asyncHandler } from '../middlewares';

class CustomerRouter {
    private router = Router();
    private customerRepo: CustomerRepo;

    constructor() {
        this.customerRepo = new CustomerRepo();
        this.routes();
    }

    private routes(): void {
        this.router.post('/', asyncHandler(this.createCustomer));
        this.router.get('/:id', asyncHandler(this.getCustomer));
        this.router.put('/:id', asyncHandler(this.updateCustomer));
        this.router.delete('/:id', asyncHandler(this.deleteCustomer));
    }

    private createCustomer = async (req, res) => {
        const customer = await this.customerRepo.createCustomer();
        res.status(201).json(customer);
    };

    private getCustomer = async (req, res) => {
        const customer = await this.customerRepo.getCustomer();
        res.status(200).json(customer);
    };

    private updateCustomer = async (req, res) => {
        const updatedCustomer = await this.customerRepo.updateCustomer();
        res.status(200).json(updatedCustomer);
    };

    private deleteCustomer = async (req, res) => {
        await this.customerRepo.deleteCustomer();
        res.status(204).end();
    };

    public getRouter(): Router {
        return this.router;
    }
}

export default new CustomerRouter().getRouter();
