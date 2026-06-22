import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * A NestJS pipe that validates incoming request bodies against a Zod schema.
 *
 * Usage:
 *   @Post()
 *   @UsePipes(new ZodValidationPipe(someSchema))
 *   async endpoint(@Body() body: SomeDto) { ... }
 *
 * On validation failure, throws BadRequestException with structured error details.
 */
@Injectable()
export class ZodValidationPipe<T = unknown> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    // Only validate body; skip params, query, custom decorators
    if (_metadata.type !== 'body') return value as T;

    try {
      return this.schema.parse(value) as T;
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => ({
          field: e.path.join('.') || '(root)',
          message: e.message,
          code: e.code,
        }));
        throw new BadRequestException({
          statusCode: 400,
          error: 'Validation failed',
          messages,
        });
      }
      throw err;
    }
  }
}
