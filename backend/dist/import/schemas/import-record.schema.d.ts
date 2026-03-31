import { HydratedDocument, Types } from 'mongoose';
export type ImportRecordDocument = HydratedDocument<ImportRecord>;
export declare class ImportRecord {
    sessionId: Types.ObjectId;
    subId: string;
    campaignName: string;
    cp: number;
    dt: number;
    importDate: Date;
    importOrder: number;
    userId: Types.ObjectId;
}
export declare const ImportRecordSchema: import("mongoose").Schema<ImportRecord, import("mongoose").Model<ImportRecord, any, any, any, (import("mongoose").Document<unknown, any, ImportRecord, any, import("mongoose").DefaultSchemaOptions> & ImportRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, ImportRecord, any, import("mongoose").DefaultSchemaOptions> & ImportRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, ImportRecord>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ImportRecord, import("mongoose").Document<unknown, {}, ImportRecord, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ImportRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    sessionId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ImportRecord, import("mongoose").Document<unknown, {}, ImportRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    subId?: import("mongoose").SchemaDefinitionProperty<string, ImportRecord, import("mongoose").Document<unknown, {}, ImportRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    campaignName?: import("mongoose").SchemaDefinitionProperty<string, ImportRecord, import("mongoose").Document<unknown, {}, ImportRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cp?: import("mongoose").SchemaDefinitionProperty<number, ImportRecord, import("mongoose").Document<unknown, {}, ImportRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    dt?: import("mongoose").SchemaDefinitionProperty<number, ImportRecord, import("mongoose").Document<unknown, {}, ImportRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    importDate?: import("mongoose").SchemaDefinitionProperty<Date, ImportRecord, import("mongoose").Document<unknown, {}, ImportRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    importOrder?: import("mongoose").SchemaDefinitionProperty<number, ImportRecord, import("mongoose").Document<unknown, {}, ImportRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ImportRecord, import("mongoose").Document<unknown, {}, ImportRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ImportRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ImportRecord>;
