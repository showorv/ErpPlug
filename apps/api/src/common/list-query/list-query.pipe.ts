import { HttpStatus, type PipeTransform } from "@nestjs/common";
import {
  ERROR_CODES,
  type ListQuery,
  type ListQueryDefinition,
  type RawQuery,
} from "@erpplug/contracts";
import { ApiException } from "../errors/api-error";

/**
 * Validates a list endpoint's query string against its definition from `defineListQuery`
 * and hands the controller a typed ListQuery. Bad input becomes `400 INVALID_QUERY` with one
 * issue per parameter in `details`.
 *
 *   @Get()
 *   list(@Query(new ListQueryPipe(contactListQuery)) query: ListQueryOf<typeof contactListQuery>) {}
 */
export class ListQueryPipe<S extends string, F extends string> implements PipeTransform<
  unknown,
  ListQuery<S, F>
> {
  constructor(private readonly definition: ListQueryDefinition<S, F>) {}

  transform(value: unknown): ListQuery<S, F> {
    const raw = (typeof value === "object" && value !== null ? value : {}) as RawQuery;
    const result = this.definition.parse(raw);
    if (!result.success) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_QUERY,
        "Some list parameters are not valid.",
        result.issues,
      );
    }
    return result.data;
  }
}
