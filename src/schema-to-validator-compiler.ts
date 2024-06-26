import { AST } from "@effect/schema";
import * as Schema from "@effect/schema/Schema";
import type { PropertyValidators, Validator } from "convex/values";
import { v, Value } from "convex/values";
import { Array, Data, Effect, Match, Option, pipe } from "effect";

// Args

export const args = <DatabaseValue, TypeScriptValue = DatabaseValue>(
  schema: Schema.Schema<TypeScriptValue, DatabaseValue>
): PropertyValidators => goTopArgs(Schema.encodedSchema(schema).ast);

const goTopArgs = (ast: AST.AST): PropertyValidators =>
  pipe(
    ast,
    Match.value,
    Match.tag("TypeLiteral", ({ indexSignatures, propertySignatures }) =>
      Array.isEmptyReadonlyArray(indexSignatures)
        ? handlePropertySignatures(propertySignatures)
        : Effect.fail(new IndexSignaturesAreNotSupportedError())
    ),
    Match.orElse(() => Effect.fail(new TopLevelMustBeObjectError())),
    Effect.runSync
  );

// Table

export const table = <DatabaseValue, TypeScriptValue = DatabaseValue>(
  schema: Schema.Schema<TypeScriptValue, DatabaseValue>
): Validator<Record<string, any>, false, any> =>
  goTopTable(Schema.encodedSchema(schema).ast);

const goTopTable = (ast: AST.AST): Validator<Record<string, any>, false, any> =>
  pipe(
    ast,
    Match.value,
    Match.tag("TypeLiteral", ({ indexSignatures }) =>
      Array.isEmptyReadonlyArray(indexSignatures)
        ? Effect.succeed(compile(ast))
        : Effect.fail(new IndexSignaturesAreNotSupportedError())
    ),
    Match.orElse(() => Effect.fail(new TopLevelMustBeObjectError())),
    Effect.runSync
  );

// Compiler

export const compile = (ast: AST.AST): Validator<any, any, any> =>
  pipe(
    ast,
    Match.value,
    Match.tag("Literal", ({ literal }) =>
      pipe(
        literal,
        Match.value,
        Match.whenOr(
          Match.string,
          Match.number,
          Match.bigint,
          Match.boolean,
          (l) => v.literal(l)
        ),
        Match.when(Match.null, () => v.null()),
        Match.exhaustive,
        Effect.succeed
      )
    ),
    Match.tag("BooleanKeyword", () => Effect.succeed(v.boolean())),
    Match.tag("StringKeyword", () => Effect.succeed(v.string())),
    Match.tag("NumberKeyword", () => Effect.succeed(v.float64())),
    Match.tag("BigIntKeyword", () => Effect.succeed(v.int64())),
    Match.tag("Union", ({ types: [first, second, ...rest] }) =>
      Effect.succeed(
        v.union(compile(first), compile(second), ...Array.map(rest, compile))
      )
    ),
    Match.tag("TypeLiteral", (typeLiteral) => handleTypeLiteral(typeLiteral)),
    Match.tag("TupleType", ({ elements, rest }) => {
      const restValidator = pipe(rest, Array.head, Option.map(compile));

      const [f, s, ...r] = elements;

      const elementToValidator = ({
        type,
        isOptional,
      }: AST.Element): Validator<any, any, any> =>
        isOptional ? v.optional(compile(type)) : compile(type);

      const arrayItemsValidator: Effect.Effect<
        Validator<any, any, any>,
        EmptyTupleIsNotSupportedError
      > = f === undefined
        ? Option.match(restValidator, {
            onNone: () => Effect.fail(new EmptyTupleIsNotSupportedError()),
            onSome: (validator) => Effect.succeed(validator),
          })
        : s === undefined
          ? Option.match(restValidator, {
              onNone: () => Effect.succeed(elementToValidator(f)),
              onSome: (validator) =>
                Effect.succeed(v.union(elementToValidator(f), validator)),
            })
          : Effect.succeed(
              v.union(
                elementToValidator(f),
                elementToValidator(s),
                ...Array.map(r, elementToValidator),
                ...Option.match(restValidator, {
                  onSome: (validator) => [validator] as const,
                  onNone: () => [] as const,
                })
              )
            );

      return pipe(
        arrayItemsValidator,
        Effect.map((validator) => v.array(validator))
      );
    }),
    Match.tag("UnknownKeyword", "AnyKeyword", () => Effect.succeed(v.any())),
    Match.tag(
      "Declaration",
      "UniqueSymbol",
      "SymbolKeyword",
      "UndefinedKeyword",
      "VoidKeyword",
      "NeverKeyword",
      "Enums",
      "TemplateLiteral",
      "ObjectKeyword",
      "Suspend",
      "Transformation",
      "Refinement",
      unsupportedEffectSchemaTypeError
    ),
    Match.exhaustive,
    Effect.runSync
  );

const handleTypeLiteral = ({
  indexSignatures,
  propertySignatures,
}: AST.TypeLiteral) =>
  pipe(
    indexSignatures,
    Array.head,
    Option.match({
      onNone: () =>
        pipe(
          propertySignatures,
          handlePropertySignatures,
          Effect.map(v.object)
        ),
      onSome: () => Effect.fail(new IndexSignaturesAreNotSupportedError()),
    })
  );

const handlePropertySignatures = (
  propertySignatures: readonly AST.PropertySignature[]
) =>
  pipe(
    propertySignatures,
    Effect.forEach(({ type, name, isOptional }) => {
      const typeofName = typeof name;

      if (typeofName !== "string") {
        return Effect.fail(
          new UnsupportedPropertySignatureKeyTypeError({ keyType: typeofName })
        );
      } else {
        const validator = compile(type);

        return Effect.succeed({
          propertyName: name,
          validator: isOptional ? v.optional(validator) : validator,
        });
      }
    }),
    Effect.flatMap((propertyNamesWithValidators) =>
      pipe(
        propertyNamesWithValidators,
        Array.reduce(
          {} as Record<string, Validator<any, any, any>>,
          (acc, { propertyName, validator }) => ({
            [propertyName]: validator,
            ...acc,
          })
        ),
        Effect.succeed
      )
    )
  );

export type Compile<V extends Value> = Validator<V, any, any>;

// Errors

class TopLevelMustBeObjectError extends Data.TaggedError(
  "TopLevelMustBeObjectError"
) {}

class UnsupportedPropertySignatureKeyTypeError extends Data.TaggedError(
  "UnsupportedPropertySignatureKeyTypeError"
)<{
  readonly keyType: string;
}> {}

class EmptyTupleIsNotSupportedError extends Data.TaggedError(
  "EmptyTupleIsNotSupportedError"
) {}

class UnsupportedEffectSchemaTypeError extends Data.TaggedError(
  "UnsupportedEffectSchemaTypeError"
)<{
  readonly effectSchemaType: AST.AST["_tag"];
}> {}

class IndexSignaturesAreNotSupportedError extends Data.TaggedError(
  "IndexSignaturesAreNotSupportedError"
) {}

const unsupportedEffectSchemaTypeError = ({ _tag }: AST.AST) =>
  Effect.fail(new UnsupportedEffectSchemaTypeError({ effectSchemaType: _tag }));
