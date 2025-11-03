import { CreateSupplierInput } from "../domain/Supplier";

/*
* DTO for creating a new Supplier
*/

export type CreateSupplierDto = Omit<CreateSupplierInput, 'created_by' | 'created_by_role' | 'created_by_email'>;