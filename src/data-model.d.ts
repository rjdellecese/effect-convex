import type {
	GenericDocument,
	GenericFieldPaths,
	GenericTableIndexes,
	GenericTableSearchIndexes,
	GenericTableVectorIndexes,
} from "convex/server";
import type { ReadonlyRecord } from "effect/Record";

export type GenericConfectDocument = ReadonlyRecord<string, any>;

export type ConfectDocumentByName<
	ConfectDataModel extends GenericConfectDataModel,
	TableName extends TableNamesInConfectDataModel<ConfectDataModel>,
> = ConfectDataModel[TableName]["confectDocument"];

export type GenericConfectDataModel = Record<string, GenericConfectTableInfo>;

export type DataModelFromConfectDataModel<
	ConfectDataModel extends GenericConfectDataModel,
> = {
	[TableName in keyof ConfectDataModel & string]: TableInfoFromConfectTableInfo<
		ConfectDataModel[TableName]
	>;
};

export type TableNamesInConfectDataModel<
	ConfectDataModel extends GenericConfectDataModel,
> = keyof ConfectDataModel & string;

export type TableInfoFromConfectTableInfo<
	ConfectTableInfo extends GenericConfectTableInfo,
> = {
	document: ConfectTableInfo["convexDocument"];
	fieldPaths: ConfectTableInfo["fieldPaths"];
	indexes: ConfectTableInfo["indexes"];
	searchIndexes: ConfectTableInfo["searchIndexes"];
	vectorIndexes: ConfectTableInfo["vectorIndexes"];
};

export type GenericConfectTableInfo = {
	confectDocument: GenericConfectDocument;
	convexDocument: GenericDocument;
	fieldPaths: GenericFieldPaths;
	indexes: GenericTableIndexes;
	searchIndexes: GenericTableSearchIndexes;
	vectorIndexes: GenericTableVectorIndexes;
};
