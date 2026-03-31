import { HydratedDocument, Types } from 'mongoose';
export type ImportSessionDocument = HydratedDocument<ImportSession>;
export declare class ImportSession {
    importDate: Date;
    importOrder: number;
    userId: Types.ObjectId;
}
export declare const ImportSessionSchema: import("mongoose").Schema<ImportSession, import("mongoose").Model<ImportSession, any, any, any, (import("mongoose").Document<unknown, any, ImportSession, any, import("mongoose").DefaultSchemaOptions> & ImportSession & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, ImportSession, any, import("mongoose").DefaultSchemaOptions> & ImportSession & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, ImportSession>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ImportSession, import("mongoose").Document<unknown, {}, ImportSession, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ImportSession & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    importDate?: import("mongoose").SchemaDefinitionProperty<Date, ImportSession, import("mongoose").Document<unknown, {}, ImportSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    importOrder?: import("mongoose").SchemaDefinitionProperty<number, ImportSession, import("mongoose").Document<unknown, {}, ImportSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ImportSession, import("mongoose").Document<unknown, {}, ImportSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ImportSession>;
