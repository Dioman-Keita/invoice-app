import ApiResponder from "../utils/ApiResponder";
import Invoice from "../models/Invoice";

export async function createInvoice(req, res) {
  try {
    const data = req.body;
    const result = await Invoice.create(data);
    return ApiResponder.created(res, result, 'Invoice created');
  } catch (err) {
    return ApiResponder.error(res, err);
  }
}

export async function getInvoice(req, res) {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice || (Array.isArray(invoice) && invoice.length === 0)) {
      return ApiResponder.notFound(res, 'Invoice not found');
    }
    return ApiResponder.success(res, invoice);
  } catch (err) {
    return ApiResponder.error(res, err);
  }
}
