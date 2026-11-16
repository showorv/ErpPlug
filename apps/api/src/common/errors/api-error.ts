import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Throw this from any controller or service to return a specific code and details:
 *   throw new ApiException(HttpStatus.CONFLICT, "sales.QUOTATION_LOCKED", "This quotation is already confirmed.");
 * Module-specific codes start with the module key (rule R7). Platform codes are ERROR_CODES in
 * @erpplug/contracts, which also defines the response shape (ApiErrorBody).
 */
export class ApiException extends HttpException {
  constructor(status: HttpStatus, code: string, message: string, details?: unknown) {
    super({ code, message, details }, status);
  }
}
