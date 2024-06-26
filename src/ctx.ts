import {
  Expand,
  FunctionReference,
  FunctionReturnType,
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  NamedTableInfo,
  OptionalRestArgs,
  TableNamesInDataModel,
  VectorIndexNames,
  VectorSearchQuery,
} from "convex/server";
import { GenericId } from "convex/values";
import { Effect } from "effect";

import { EffectAuth, EffectAuthImpl } from "~/src/auth";
import {
  DataModelFromConfectDataModel,
  GenericConfectDataModel,
} from "~/src/data-model";
import {
  DatabaseSchemasFromConfectDataModel,
  EffectDatabaseReader,
  EffectDatabaseReaderImpl,
  EffectDatabaseWriter,
  EffectDatabaseWriterImpl,
} from "~/src/database";
import { EffectScheduler, EffectSchedulerImpl } from "~/src/scheduler";
import {
  EffectStorageReader,
  EffectStorageReaderImpl,
  EffectStorageWriter,
  EffectStorageWriterImpl,
} from "~/src/storage";

export type EffectMutationCtx<EffectDataModel extends GenericConfectDataModel> =
  {
    db: EffectDatabaseWriter<EffectDataModel>;
    auth: EffectAuth;
    storage: EffectStorageWriter;
    scheduler: EffectScheduler;
  };

export type EffectQueryCtx<EffectDataModel extends GenericConfectDataModel> = {
  db: EffectDatabaseReader<EffectDataModel>;
  auth: EffectAuth;
  storage: EffectStorageReader;
};

export type EffectActionCtx<EffectDataModel extends GenericConfectDataModel> = {
  runQuery<Query extends FunctionReference<"query", "public" | "internal">>(
    query: Query,
    ...args: OptionalRestArgs<Query>
  ): Effect.Effect<FunctionReturnType<Query>>;
  runMutation<
    Mutation extends FunctionReference<"mutation", "public" | "internal">,
  >(
    mutation: Mutation,
    ...args: OptionalRestArgs<Mutation>
  ): Effect.Effect<FunctionReturnType<Mutation>>;
  runAction<Action extends FunctionReference<"action", "public" | "internal">>(
    action: Action,
    ...args: OptionalRestArgs<Action>
  ): Effect.Effect<FunctionReturnType<Action>>;
  scheduler: EffectScheduler;
  auth: EffectAuth;
  storage: EffectStorageWriter;
  vectorSearch<
    TableName extends TableNamesInDataModel<EffectDataModel>,
    IndexName extends VectorIndexNames<
      NamedTableInfo<EffectDataModel, TableName>
    >,
  >(
    tableName: TableName,
    indexName: IndexName,
    query: Expand<
      VectorSearchQuery<NamedTableInfo<EffectDataModel, TableName>, IndexName>
    >
  ): Effect.Effect<Array<{ _id: GenericId<TableName>; _score: number }>>;
};

export const makeEffectQueryCtx = <
  EffectDataModel extends GenericConfectDataModel,
>(
  ctx: GenericQueryCtx<DataModelFromConfectDataModel<EffectDataModel>>,
  databaseSchemas: DatabaseSchemasFromConfectDataModel<EffectDataModel>
): EffectQueryCtx<EffectDataModel> => ({
  db: new EffectDatabaseReaderImpl(ctx.db, databaseSchemas),
  auth: new EffectAuthImpl(ctx.auth),
  storage: new EffectStorageReaderImpl(ctx.storage),
});

export const makeEffectMutationCtx = <
  EffectDataModel extends GenericConfectDataModel,
>(
  ctx: GenericMutationCtx<DataModelFromConfectDataModel<EffectDataModel>>,
  databaseSchemas: DatabaseSchemasFromConfectDataModel<EffectDataModel>
): EffectMutationCtx<EffectDataModel> => ({
  db: new EffectDatabaseWriterImpl(ctx.db, databaseSchemas),
  auth: new EffectAuthImpl(ctx.auth),
  storage: new EffectStorageWriterImpl(ctx.storage),
  scheduler: new EffectSchedulerImpl(ctx.scheduler),
});

export const makeEffectActionCtx = <
  EffectDataModel extends GenericConfectDataModel,
>(
  ctx: GenericActionCtx<DataModelFromConfectDataModel<EffectDataModel>>
): EffectActionCtx<EffectDataModel> => ({
  runQuery: <Query extends FunctionReference<"query", "public" | "internal">>(
    query: Query,
    ...queryArgs: OptionalRestArgs<Query>
  ) => Effect.promise(() => ctx.runQuery(query, ...queryArgs)),
  runMutation: <
    Mutation extends FunctionReference<"mutation", "public" | "internal">,
  >(
    mutation: Mutation,
    ...mutationArgs: OptionalRestArgs<Mutation>
  ) => Effect.promise(() => ctx.runMutation(mutation, ...mutationArgs)),
  runAction: <
    Action extends FunctionReference<"action", "public" | "internal">,
  >(
    action: Action,
    ...actionArgs: OptionalRestArgs<Action>
  ) => Effect.promise(() => ctx.runAction(action, ...actionArgs)),
  vectorSearch: <
    TableName extends TableNamesInDataModel<EffectDataModel>,
    IndexName extends VectorIndexNames<
      NamedTableInfo<EffectDataModel, TableName>
    >,
  >(
    tableName: TableName,
    indexName: IndexName,
    query: Expand<
      VectorSearchQuery<NamedTableInfo<EffectDataModel, TableName>, IndexName>
    >
  ) => Effect.promise(() => ctx.vectorSearch(tableName, indexName, query)),
  auth: new EffectAuthImpl(ctx.auth),
  storage: new EffectStorageWriterImpl(ctx.storage),
  scheduler: new EffectSchedulerImpl(ctx.scheduler),
});
