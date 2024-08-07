import { Schema } from "@effect/schema";
import { expectTypeOf, test } from "@effect/vitest";

import type { DatabaseSchemasFromConfectDataModel } from "~/src/database";
import {
	type ConfectDataModelFromConfectSchema,
	defineConfectTable,
} from "~/src/schema";
import { SchemaId } from "../src/SchemaId";

test("DatabaseSchemasFromConfectDataModel", () => {
	const notesSchemaFields = {
		text: Schema.String,
		tags: Schema.Array(Schema.String).pipe(Schema.optional),
	};
	const confectSchema = {
		notes: defineConfectTable(Schema.Struct(notesSchemaFields)),
	};
	type ConfectSchema = typeof confectSchema;
	type ConfectDataModel = ConfectDataModelFromConfectSchema<ConfectSchema>;

	type DatabaseSchemas = DatabaseSchemasFromConfectDataModel<ConfectDataModel>;

	const notesDocumentSchema = Schema.Struct({
		_id: SchemaId<"notes">(),
		_creationTime: Schema.Number,
		...notesSchemaFields,
	});
	type NotesDocumentSchema = typeof notesDocumentSchema;

	type ExpectedDatabaseSchemas = {
		notes: NotesDocumentSchema;
	};

	type ActualNotesSchemaType = DatabaseSchemas["notes"]["Type"];
	type ExpectedNotesSchemaType = ExpectedDatabaseSchemas["notes"]["Type"];
	expectTypeOf<ActualNotesSchemaType>().toEqualTypeOf<ExpectedNotesSchemaType>();

	type ActualNotesSchemaEncoded = DatabaseSchemas["notes"]["Encoded"];
	type ExpectedNotesSchemaEncoded = ExpectedDatabaseSchemas["notes"]["Encoded"];
	expectTypeOf<ActualNotesSchemaEncoded>().toEqualTypeOf<ExpectedNotesSchemaEncoded>();
});
