import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type chunk_lo_mappingsModel = runtime.Types.Result.DefaultSelection<Prisma.$chunk_lo_mappingsPayload>;
export type AggregateChunk_lo_mappings = {
    _count: Chunk_lo_mappingsCountAggregateOutputType | null;
    _avg: Chunk_lo_mappingsAvgAggregateOutputType | null;
    _sum: Chunk_lo_mappingsSumAggregateOutputType | null;
    _min: Chunk_lo_mappingsMinAggregateOutputType | null;
    _max: Chunk_lo_mappingsMaxAggregateOutputType | null;
};
export type Chunk_lo_mappingsAvgAggregateOutputType = {
    confidence: number | null;
};
export type Chunk_lo_mappingsSumAggregateOutputType = {
    confidence: number | null;
};
export type Chunk_lo_mappingsMinAggregateOutputType = {
    chunk_id: string | null;
    lo_id: string | null;
    confidence: number | null;
    source: string | null;
    created_at: Date | null;
};
export type Chunk_lo_mappingsMaxAggregateOutputType = {
    chunk_id: string | null;
    lo_id: string | null;
    confidence: number | null;
    source: string | null;
    created_at: Date | null;
};
export type Chunk_lo_mappingsCountAggregateOutputType = {
    chunk_id: number;
    lo_id: number;
    confidence: number;
    source: number;
    created_at: number;
    _all: number;
};
export type Chunk_lo_mappingsAvgAggregateInputType = {
    confidence?: true;
};
export type Chunk_lo_mappingsSumAggregateInputType = {
    confidence?: true;
};
export type Chunk_lo_mappingsMinAggregateInputType = {
    chunk_id?: true;
    lo_id?: true;
    confidence?: true;
    source?: true;
    created_at?: true;
};
export type Chunk_lo_mappingsMaxAggregateInputType = {
    chunk_id?: true;
    lo_id?: true;
    confidence?: true;
    source?: true;
    created_at?: true;
};
export type Chunk_lo_mappingsCountAggregateInputType = {
    chunk_id?: true;
    lo_id?: true;
    confidence?: true;
    source?: true;
    created_at?: true;
    _all?: true;
};
export type Chunk_lo_mappingsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_lo_mappingsWhereInput;
    orderBy?: Prisma.chunk_lo_mappingsOrderByWithRelationInput | Prisma.chunk_lo_mappingsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_lo_mappingsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Chunk_lo_mappingsCountAggregateInputType;
    _avg?: Chunk_lo_mappingsAvgAggregateInputType;
    _sum?: Chunk_lo_mappingsSumAggregateInputType;
    _min?: Chunk_lo_mappingsMinAggregateInputType;
    _max?: Chunk_lo_mappingsMaxAggregateInputType;
};
export type GetChunk_lo_mappingsAggregateType<T extends Chunk_lo_mappingsAggregateArgs> = {
    [P in keyof T & keyof AggregateChunk_lo_mappings]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateChunk_lo_mappings[P]> : Prisma.GetScalarType<T[P], AggregateChunk_lo_mappings[P]>;
};
export type chunk_lo_mappingsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_lo_mappingsWhereInput;
    orderBy?: Prisma.chunk_lo_mappingsOrderByWithAggregationInput | Prisma.chunk_lo_mappingsOrderByWithAggregationInput[];
    by: Prisma.Chunk_lo_mappingsScalarFieldEnum[] | Prisma.Chunk_lo_mappingsScalarFieldEnum;
    having?: Prisma.chunk_lo_mappingsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Chunk_lo_mappingsCountAggregateInputType | true;
    _avg?: Chunk_lo_mappingsAvgAggregateInputType;
    _sum?: Chunk_lo_mappingsSumAggregateInputType;
    _min?: Chunk_lo_mappingsMinAggregateInputType;
    _max?: Chunk_lo_mappingsMaxAggregateInputType;
};
export type Chunk_lo_mappingsGroupByOutputType = {
    chunk_id: string;
    lo_id: string;
    confidence: number;
    source: string;
    created_at: Date;
    _count: Chunk_lo_mappingsCountAggregateOutputType | null;
    _avg: Chunk_lo_mappingsAvgAggregateOutputType | null;
    _sum: Chunk_lo_mappingsSumAggregateOutputType | null;
    _min: Chunk_lo_mappingsMinAggregateOutputType | null;
    _max: Chunk_lo_mappingsMaxAggregateOutputType | null;
};
export type GetChunk_lo_mappingsGroupByPayload<T extends chunk_lo_mappingsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Chunk_lo_mappingsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Chunk_lo_mappingsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Chunk_lo_mappingsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Chunk_lo_mappingsGroupByOutputType[P]>;
}>>;
export type chunk_lo_mappingsWhereInput = {
    AND?: Prisma.chunk_lo_mappingsWhereInput | Prisma.chunk_lo_mappingsWhereInput[];
    OR?: Prisma.chunk_lo_mappingsWhereInput[];
    NOT?: Prisma.chunk_lo_mappingsWhereInput | Prisma.chunk_lo_mappingsWhereInput[];
    chunk_id?: Prisma.StringFilter<"chunk_lo_mappings"> | string;
    lo_id?: Prisma.StringFilter<"chunk_lo_mappings"> | string;
    confidence?: Prisma.FloatFilter<"chunk_lo_mappings"> | number;
    source?: Prisma.StringFilter<"chunk_lo_mappings"> | string;
    created_at?: Prisma.DateTimeFilter<"chunk_lo_mappings"> | Date | string;
    chunks_metadata?: Prisma.XOR<Prisma.Chunks_metadataScalarRelationFilter, Prisma.chunks_metadataWhereInput>;
    learning_outcomes?: Prisma.XOR<Prisma.Learning_outcomesScalarRelationFilter, Prisma.learning_outcomesWhereInput>;
};
export type chunk_lo_mappingsOrderByWithRelationInput = {
    chunk_id?: Prisma.SortOrder;
    lo_id?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    chunks_metadata?: Prisma.chunks_metadataOrderByWithRelationInput;
    learning_outcomes?: Prisma.learning_outcomesOrderByWithRelationInput;
};
export type chunk_lo_mappingsWhereUniqueInput = Prisma.AtLeast<{
    chunk_id_lo_id?: Prisma.chunk_lo_mappingsChunk_idLo_idCompoundUniqueInput;
    AND?: Prisma.chunk_lo_mappingsWhereInput | Prisma.chunk_lo_mappingsWhereInput[];
    OR?: Prisma.chunk_lo_mappingsWhereInput[];
    NOT?: Prisma.chunk_lo_mappingsWhereInput | Prisma.chunk_lo_mappingsWhereInput[];
    chunk_id?: Prisma.StringFilter<"chunk_lo_mappings"> | string;
    lo_id?: Prisma.StringFilter<"chunk_lo_mappings"> | string;
    confidence?: Prisma.FloatFilter<"chunk_lo_mappings"> | number;
    source?: Prisma.StringFilter<"chunk_lo_mappings"> | string;
    created_at?: Prisma.DateTimeFilter<"chunk_lo_mappings"> | Date | string;
    chunks_metadata?: Prisma.XOR<Prisma.Chunks_metadataScalarRelationFilter, Prisma.chunks_metadataWhereInput>;
    learning_outcomes?: Prisma.XOR<Prisma.Learning_outcomesScalarRelationFilter, Prisma.learning_outcomesWhereInput>;
}, "chunk_id_lo_id">;
export type chunk_lo_mappingsOrderByWithAggregationInput = {
    chunk_id?: Prisma.SortOrder;
    lo_id?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    _count?: Prisma.chunk_lo_mappingsCountOrderByAggregateInput;
    _avg?: Prisma.chunk_lo_mappingsAvgOrderByAggregateInput;
    _max?: Prisma.chunk_lo_mappingsMaxOrderByAggregateInput;
    _min?: Prisma.chunk_lo_mappingsMinOrderByAggregateInput;
    _sum?: Prisma.chunk_lo_mappingsSumOrderByAggregateInput;
};
export type chunk_lo_mappingsScalarWhereWithAggregatesInput = {
    AND?: Prisma.chunk_lo_mappingsScalarWhereWithAggregatesInput | Prisma.chunk_lo_mappingsScalarWhereWithAggregatesInput[];
    OR?: Prisma.chunk_lo_mappingsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.chunk_lo_mappingsScalarWhereWithAggregatesInput | Prisma.chunk_lo_mappingsScalarWhereWithAggregatesInput[];
    chunk_id?: Prisma.StringWithAggregatesFilter<"chunk_lo_mappings"> | string;
    lo_id?: Prisma.StringWithAggregatesFilter<"chunk_lo_mappings"> | string;
    confidence?: Prisma.FloatWithAggregatesFilter<"chunk_lo_mappings"> | number;
    source?: Prisma.StringWithAggregatesFilter<"chunk_lo_mappings"> | string;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"chunk_lo_mappings"> | Date | string;
};
export type chunk_lo_mappingsCreateInput = {
    confidence?: number;
    source: string;
    created_at?: Date | string;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutChunk_lo_mappingsInput;
    learning_outcomes: Prisma.learning_outcomesCreateNestedOneWithoutChunk_lo_mappingsInput;
};
export type chunk_lo_mappingsUncheckedCreateInput = {
    chunk_id: string;
    lo_id: string;
    confidence?: number;
    source: string;
    created_at?: Date | string;
};
export type chunk_lo_mappingsUpdateInput = {
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutChunk_lo_mappingsNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateOneRequiredWithoutChunk_lo_mappingsNestedInput;
};
export type chunk_lo_mappingsUncheckedUpdateInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_lo_mappingsCreateManyInput = {
    chunk_id: string;
    lo_id: string;
    confidence?: number;
    source: string;
    created_at?: Date | string;
};
export type chunk_lo_mappingsUpdateManyMutationInput = {
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_lo_mappingsUncheckedUpdateManyInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_lo_mappingsChunk_idLo_idCompoundUniqueInput = {
    chunk_id: string;
    lo_id: string;
};
export type chunk_lo_mappingsCountOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    lo_id?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
};
export type chunk_lo_mappingsAvgOrderByAggregateInput = {
    confidence?: Prisma.SortOrder;
};
export type chunk_lo_mappingsMaxOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    lo_id?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
};
export type chunk_lo_mappingsMinOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    lo_id?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
};
export type chunk_lo_mappingsSumOrderByAggregateInput = {
    confidence?: Prisma.SortOrder;
};
export type Chunk_lo_mappingsListRelationFilter = {
    every?: Prisma.chunk_lo_mappingsWhereInput;
    some?: Prisma.chunk_lo_mappingsWhereInput;
    none?: Prisma.chunk_lo_mappingsWhereInput;
};
export type chunk_lo_mappingsOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type chunk_lo_mappingsCreateNestedManyWithoutChunks_metadataInput = {
    create?: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutChunks_metadataInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput> | Prisma.chunk_lo_mappingsCreateWithoutChunks_metadataInput[] | Prisma.chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.chunk_lo_mappingsCreateOrConnectWithoutChunks_metadataInput | Prisma.chunk_lo_mappingsCreateOrConnectWithoutChunks_metadataInput[];
    createMany?: Prisma.chunk_lo_mappingsCreateManyChunks_metadataInputEnvelope;
    connect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
};
export type chunk_lo_mappingsUncheckedCreateNestedManyWithoutChunks_metadataInput = {
    create?: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutChunks_metadataInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput> | Prisma.chunk_lo_mappingsCreateWithoutChunks_metadataInput[] | Prisma.chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.chunk_lo_mappingsCreateOrConnectWithoutChunks_metadataInput | Prisma.chunk_lo_mappingsCreateOrConnectWithoutChunks_metadataInput[];
    createMany?: Prisma.chunk_lo_mappingsCreateManyChunks_metadataInputEnvelope;
    connect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
};
export type chunk_lo_mappingsUpdateManyWithoutChunks_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutChunks_metadataInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput> | Prisma.chunk_lo_mappingsCreateWithoutChunks_metadataInput[] | Prisma.chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.chunk_lo_mappingsCreateOrConnectWithoutChunks_metadataInput | Prisma.chunk_lo_mappingsCreateOrConnectWithoutChunks_metadataInput[];
    upsert?: Prisma.chunk_lo_mappingsUpsertWithWhereUniqueWithoutChunks_metadataInput | Prisma.chunk_lo_mappingsUpsertWithWhereUniqueWithoutChunks_metadataInput[];
    createMany?: Prisma.chunk_lo_mappingsCreateManyChunks_metadataInputEnvelope;
    set?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    disconnect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    delete?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    connect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    update?: Prisma.chunk_lo_mappingsUpdateWithWhereUniqueWithoutChunks_metadataInput | Prisma.chunk_lo_mappingsUpdateWithWhereUniqueWithoutChunks_metadataInput[];
    updateMany?: Prisma.chunk_lo_mappingsUpdateManyWithWhereWithoutChunks_metadataInput | Prisma.chunk_lo_mappingsUpdateManyWithWhereWithoutChunks_metadataInput[];
    deleteMany?: Prisma.chunk_lo_mappingsScalarWhereInput | Prisma.chunk_lo_mappingsScalarWhereInput[];
};
export type chunk_lo_mappingsUncheckedUpdateManyWithoutChunks_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutChunks_metadataInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput> | Prisma.chunk_lo_mappingsCreateWithoutChunks_metadataInput[] | Prisma.chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.chunk_lo_mappingsCreateOrConnectWithoutChunks_metadataInput | Prisma.chunk_lo_mappingsCreateOrConnectWithoutChunks_metadataInput[];
    upsert?: Prisma.chunk_lo_mappingsUpsertWithWhereUniqueWithoutChunks_metadataInput | Prisma.chunk_lo_mappingsUpsertWithWhereUniqueWithoutChunks_metadataInput[];
    createMany?: Prisma.chunk_lo_mappingsCreateManyChunks_metadataInputEnvelope;
    set?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    disconnect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    delete?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    connect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    update?: Prisma.chunk_lo_mappingsUpdateWithWhereUniqueWithoutChunks_metadataInput | Prisma.chunk_lo_mappingsUpdateWithWhereUniqueWithoutChunks_metadataInput[];
    updateMany?: Prisma.chunk_lo_mappingsUpdateManyWithWhereWithoutChunks_metadataInput | Prisma.chunk_lo_mappingsUpdateManyWithWhereWithoutChunks_metadataInput[];
    deleteMany?: Prisma.chunk_lo_mappingsScalarWhereInput | Prisma.chunk_lo_mappingsScalarWhereInput[];
};
export type chunk_lo_mappingsCreateNestedManyWithoutLearning_outcomesInput = {
    create?: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutLearning_outcomesInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.chunk_lo_mappingsCreateWithoutLearning_outcomesInput[] | Prisma.chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.chunk_lo_mappingsCreateOrConnectWithoutLearning_outcomesInput | Prisma.chunk_lo_mappingsCreateOrConnectWithoutLearning_outcomesInput[];
    createMany?: Prisma.chunk_lo_mappingsCreateManyLearning_outcomesInputEnvelope;
    connect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
};
export type chunk_lo_mappingsUncheckedCreateNestedManyWithoutLearning_outcomesInput = {
    create?: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutLearning_outcomesInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.chunk_lo_mappingsCreateWithoutLearning_outcomesInput[] | Prisma.chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.chunk_lo_mappingsCreateOrConnectWithoutLearning_outcomesInput | Prisma.chunk_lo_mappingsCreateOrConnectWithoutLearning_outcomesInput[];
    createMany?: Prisma.chunk_lo_mappingsCreateManyLearning_outcomesInputEnvelope;
    connect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
};
export type chunk_lo_mappingsUpdateManyWithoutLearning_outcomesNestedInput = {
    create?: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutLearning_outcomesInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.chunk_lo_mappingsCreateWithoutLearning_outcomesInput[] | Prisma.chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.chunk_lo_mappingsCreateOrConnectWithoutLearning_outcomesInput | Prisma.chunk_lo_mappingsCreateOrConnectWithoutLearning_outcomesInput[];
    upsert?: Prisma.chunk_lo_mappingsUpsertWithWhereUniqueWithoutLearning_outcomesInput | Prisma.chunk_lo_mappingsUpsertWithWhereUniqueWithoutLearning_outcomesInput[];
    createMany?: Prisma.chunk_lo_mappingsCreateManyLearning_outcomesInputEnvelope;
    set?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    disconnect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    delete?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    connect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    update?: Prisma.chunk_lo_mappingsUpdateWithWhereUniqueWithoutLearning_outcomesInput | Prisma.chunk_lo_mappingsUpdateWithWhereUniqueWithoutLearning_outcomesInput[];
    updateMany?: Prisma.chunk_lo_mappingsUpdateManyWithWhereWithoutLearning_outcomesInput | Prisma.chunk_lo_mappingsUpdateManyWithWhereWithoutLearning_outcomesInput[];
    deleteMany?: Prisma.chunk_lo_mappingsScalarWhereInput | Prisma.chunk_lo_mappingsScalarWhereInput[];
};
export type chunk_lo_mappingsUncheckedUpdateManyWithoutLearning_outcomesNestedInput = {
    create?: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutLearning_outcomesInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.chunk_lo_mappingsCreateWithoutLearning_outcomesInput[] | Prisma.chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.chunk_lo_mappingsCreateOrConnectWithoutLearning_outcomesInput | Prisma.chunk_lo_mappingsCreateOrConnectWithoutLearning_outcomesInput[];
    upsert?: Prisma.chunk_lo_mappingsUpsertWithWhereUniqueWithoutLearning_outcomesInput | Prisma.chunk_lo_mappingsUpsertWithWhereUniqueWithoutLearning_outcomesInput[];
    createMany?: Prisma.chunk_lo_mappingsCreateManyLearning_outcomesInputEnvelope;
    set?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    disconnect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    delete?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    connect?: Prisma.chunk_lo_mappingsWhereUniqueInput | Prisma.chunk_lo_mappingsWhereUniqueInput[];
    update?: Prisma.chunk_lo_mappingsUpdateWithWhereUniqueWithoutLearning_outcomesInput | Prisma.chunk_lo_mappingsUpdateWithWhereUniqueWithoutLearning_outcomesInput[];
    updateMany?: Prisma.chunk_lo_mappingsUpdateManyWithWhereWithoutLearning_outcomesInput | Prisma.chunk_lo_mappingsUpdateManyWithWhereWithoutLearning_outcomesInput[];
    deleteMany?: Prisma.chunk_lo_mappingsScalarWhereInput | Prisma.chunk_lo_mappingsScalarWhereInput[];
};
export type chunk_lo_mappingsCreateWithoutChunks_metadataInput = {
    confidence?: number;
    source: string;
    created_at?: Date | string;
    learning_outcomes: Prisma.learning_outcomesCreateNestedOneWithoutChunk_lo_mappingsInput;
};
export type chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput = {
    lo_id: string;
    confidence?: number;
    source: string;
    created_at?: Date | string;
};
export type chunk_lo_mappingsCreateOrConnectWithoutChunks_metadataInput = {
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutChunks_metadataInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput>;
};
export type chunk_lo_mappingsCreateManyChunks_metadataInputEnvelope = {
    data: Prisma.chunk_lo_mappingsCreateManyChunks_metadataInput | Prisma.chunk_lo_mappingsCreateManyChunks_metadataInput[];
    skipDuplicates?: boolean;
};
export type chunk_lo_mappingsUpsertWithWhereUniqueWithoutChunks_metadataInput = {
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
    update: Prisma.XOR<Prisma.chunk_lo_mappingsUpdateWithoutChunks_metadataInput, Prisma.chunk_lo_mappingsUncheckedUpdateWithoutChunks_metadataInput>;
    create: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutChunks_metadataInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutChunks_metadataInput>;
};
export type chunk_lo_mappingsUpdateWithWhereUniqueWithoutChunks_metadataInput = {
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
    data: Prisma.XOR<Prisma.chunk_lo_mappingsUpdateWithoutChunks_metadataInput, Prisma.chunk_lo_mappingsUncheckedUpdateWithoutChunks_metadataInput>;
};
export type chunk_lo_mappingsUpdateManyWithWhereWithoutChunks_metadataInput = {
    where: Prisma.chunk_lo_mappingsScalarWhereInput;
    data: Prisma.XOR<Prisma.chunk_lo_mappingsUpdateManyMutationInput, Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutChunks_metadataInput>;
};
export type chunk_lo_mappingsScalarWhereInput = {
    AND?: Prisma.chunk_lo_mappingsScalarWhereInput | Prisma.chunk_lo_mappingsScalarWhereInput[];
    OR?: Prisma.chunk_lo_mappingsScalarWhereInput[];
    NOT?: Prisma.chunk_lo_mappingsScalarWhereInput | Prisma.chunk_lo_mappingsScalarWhereInput[];
    chunk_id?: Prisma.StringFilter<"chunk_lo_mappings"> | string;
    lo_id?: Prisma.StringFilter<"chunk_lo_mappings"> | string;
    confidence?: Prisma.FloatFilter<"chunk_lo_mappings"> | number;
    source?: Prisma.StringFilter<"chunk_lo_mappings"> | string;
    created_at?: Prisma.DateTimeFilter<"chunk_lo_mappings"> | Date | string;
};
export type chunk_lo_mappingsCreateWithoutLearning_outcomesInput = {
    confidence?: number;
    source: string;
    created_at?: Date | string;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutChunk_lo_mappingsInput;
};
export type chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput = {
    chunk_id: string;
    confidence?: number;
    source: string;
    created_at?: Date | string;
};
export type chunk_lo_mappingsCreateOrConnectWithoutLearning_outcomesInput = {
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutLearning_outcomesInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput>;
};
export type chunk_lo_mappingsCreateManyLearning_outcomesInputEnvelope = {
    data: Prisma.chunk_lo_mappingsCreateManyLearning_outcomesInput | Prisma.chunk_lo_mappingsCreateManyLearning_outcomesInput[];
    skipDuplicates?: boolean;
};
export type chunk_lo_mappingsUpsertWithWhereUniqueWithoutLearning_outcomesInput = {
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
    update: Prisma.XOR<Prisma.chunk_lo_mappingsUpdateWithoutLearning_outcomesInput, Prisma.chunk_lo_mappingsUncheckedUpdateWithoutLearning_outcomesInput>;
    create: Prisma.XOR<Prisma.chunk_lo_mappingsCreateWithoutLearning_outcomesInput, Prisma.chunk_lo_mappingsUncheckedCreateWithoutLearning_outcomesInput>;
};
export type chunk_lo_mappingsUpdateWithWhereUniqueWithoutLearning_outcomesInput = {
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
    data: Prisma.XOR<Prisma.chunk_lo_mappingsUpdateWithoutLearning_outcomesInput, Prisma.chunk_lo_mappingsUncheckedUpdateWithoutLearning_outcomesInput>;
};
export type chunk_lo_mappingsUpdateManyWithWhereWithoutLearning_outcomesInput = {
    where: Prisma.chunk_lo_mappingsScalarWhereInput;
    data: Prisma.XOR<Prisma.chunk_lo_mappingsUpdateManyMutationInput, Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutLearning_outcomesInput>;
};
export type chunk_lo_mappingsCreateManyChunks_metadataInput = {
    lo_id: string;
    confidence?: number;
    source: string;
    created_at?: Date | string;
};
export type chunk_lo_mappingsUpdateWithoutChunks_metadataInput = {
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    learning_outcomes?: Prisma.learning_outcomesUpdateOneRequiredWithoutChunk_lo_mappingsNestedInput;
};
export type chunk_lo_mappingsUncheckedUpdateWithoutChunks_metadataInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_lo_mappingsUncheckedUpdateManyWithoutChunks_metadataInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_lo_mappingsCreateManyLearning_outcomesInput = {
    chunk_id: string;
    confidence?: number;
    source: string;
    created_at?: Date | string;
};
export type chunk_lo_mappingsUpdateWithoutLearning_outcomesInput = {
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutChunk_lo_mappingsNestedInput;
};
export type chunk_lo_mappingsUncheckedUpdateWithoutLearning_outcomesInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_lo_mappingsUncheckedUpdateManyWithoutLearning_outcomesInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_lo_mappingsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    lo_id?: boolean;
    confidence?: boolean;
    source?: boolean;
    created_at?: boolean;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chunk_lo_mappings"]>;
export type chunk_lo_mappingsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    lo_id?: boolean;
    confidence?: boolean;
    source?: boolean;
    created_at?: boolean;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chunk_lo_mappings"]>;
export type chunk_lo_mappingsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    lo_id?: boolean;
    confidence?: boolean;
    source?: boolean;
    created_at?: boolean;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chunk_lo_mappings"]>;
export type chunk_lo_mappingsSelectScalar = {
    chunk_id?: boolean;
    lo_id?: boolean;
    confidence?: boolean;
    source?: boolean;
    created_at?: boolean;
};
export type chunk_lo_mappingsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"chunk_id" | "lo_id" | "confidence" | "source" | "created_at", ExtArgs["result"]["chunk_lo_mappings"]>;
export type chunk_lo_mappingsInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
};
export type chunk_lo_mappingsIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
};
export type chunk_lo_mappingsIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
};
export type $chunk_lo_mappingsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "chunk_lo_mappings";
    objects: {
        chunks_metadata: Prisma.$chunks_metadataPayload<ExtArgs>;
        learning_outcomes: Prisma.$learning_outcomesPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        chunk_id: string;
        lo_id: string;
        confidence: number;
        source: string;
        created_at: Date;
    }, ExtArgs["result"]["chunk_lo_mappings"]>;
    composites: {};
};
export type chunk_lo_mappingsGetPayload<S extends boolean | null | undefined | chunk_lo_mappingsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload, S>;
export type chunk_lo_mappingsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<chunk_lo_mappingsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Chunk_lo_mappingsCountAggregateInputType | true;
};
export interface chunk_lo_mappingsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['chunk_lo_mappings'];
        meta: {
            name: 'chunk_lo_mappings';
        };
    };
    findUnique<T extends chunk_lo_mappingsFindUniqueArgs>(args: Prisma.SelectSubset<T, chunk_lo_mappingsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__chunk_lo_mappingsClient<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends chunk_lo_mappingsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, chunk_lo_mappingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__chunk_lo_mappingsClient<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends chunk_lo_mappingsFindFirstArgs>(args?: Prisma.SelectSubset<T, chunk_lo_mappingsFindFirstArgs<ExtArgs>>): Prisma.Prisma__chunk_lo_mappingsClient<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends chunk_lo_mappingsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, chunk_lo_mappingsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__chunk_lo_mappingsClient<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends chunk_lo_mappingsFindManyArgs>(args?: Prisma.SelectSubset<T, chunk_lo_mappingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends chunk_lo_mappingsCreateArgs>(args: Prisma.SelectSubset<T, chunk_lo_mappingsCreateArgs<ExtArgs>>): Prisma.Prisma__chunk_lo_mappingsClient<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends chunk_lo_mappingsCreateManyArgs>(args?: Prisma.SelectSubset<T, chunk_lo_mappingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends chunk_lo_mappingsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, chunk_lo_mappingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends chunk_lo_mappingsDeleteArgs>(args: Prisma.SelectSubset<T, chunk_lo_mappingsDeleteArgs<ExtArgs>>): Prisma.Prisma__chunk_lo_mappingsClient<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends chunk_lo_mappingsUpdateArgs>(args: Prisma.SelectSubset<T, chunk_lo_mappingsUpdateArgs<ExtArgs>>): Prisma.Prisma__chunk_lo_mappingsClient<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends chunk_lo_mappingsDeleteManyArgs>(args?: Prisma.SelectSubset<T, chunk_lo_mappingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends chunk_lo_mappingsUpdateManyArgs>(args: Prisma.SelectSubset<T, chunk_lo_mappingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends chunk_lo_mappingsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, chunk_lo_mappingsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends chunk_lo_mappingsUpsertArgs>(args: Prisma.SelectSubset<T, chunk_lo_mappingsUpsertArgs<ExtArgs>>): Prisma.Prisma__chunk_lo_mappingsClient<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends chunk_lo_mappingsCountArgs>(args?: Prisma.Subset<T, chunk_lo_mappingsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Chunk_lo_mappingsCountAggregateOutputType> : number>;
    aggregate<T extends Chunk_lo_mappingsAggregateArgs>(args: Prisma.Subset<T, Chunk_lo_mappingsAggregateArgs>): Prisma.PrismaPromise<GetChunk_lo_mappingsAggregateType<T>>;
    groupBy<T extends chunk_lo_mappingsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: chunk_lo_mappingsGroupByArgs['orderBy'];
    } : {
        orderBy?: chunk_lo_mappingsGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, chunk_lo_mappingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChunk_lo_mappingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: chunk_lo_mappingsFieldRefs;
}
export interface Prisma__chunk_lo_mappingsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    chunks_metadata<T extends Prisma.chunks_metadataDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.chunks_metadataDefaultArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    learning_outcomes<T extends Prisma.learning_outcomesDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.learning_outcomesDefaultArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface chunk_lo_mappingsFieldRefs {
    readonly chunk_id: Prisma.FieldRef<"chunk_lo_mappings", 'String'>;
    readonly lo_id: Prisma.FieldRef<"chunk_lo_mappings", 'String'>;
    readonly confidence: Prisma.FieldRef<"chunk_lo_mappings", 'Float'>;
    readonly source: Prisma.FieldRef<"chunk_lo_mappings", 'String'>;
    readonly created_at: Prisma.FieldRef<"chunk_lo_mappings", 'DateTime'>;
}
export type chunk_lo_mappingsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    include?: Prisma.chunk_lo_mappingsInclude<ExtArgs> | null;
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
};
export type chunk_lo_mappingsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    include?: Prisma.chunk_lo_mappingsInclude<ExtArgs> | null;
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
};
export type chunk_lo_mappingsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    include?: Prisma.chunk_lo_mappingsInclude<ExtArgs> | null;
    where?: Prisma.chunk_lo_mappingsWhereInput;
    orderBy?: Prisma.chunk_lo_mappingsOrderByWithRelationInput | Prisma.chunk_lo_mappingsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_lo_mappingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunk_lo_mappingsScalarFieldEnum | Prisma.Chunk_lo_mappingsScalarFieldEnum[];
};
export type chunk_lo_mappingsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    include?: Prisma.chunk_lo_mappingsInclude<ExtArgs> | null;
    where?: Prisma.chunk_lo_mappingsWhereInput;
    orderBy?: Prisma.chunk_lo_mappingsOrderByWithRelationInput | Prisma.chunk_lo_mappingsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_lo_mappingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunk_lo_mappingsScalarFieldEnum | Prisma.Chunk_lo_mappingsScalarFieldEnum[];
};
export type chunk_lo_mappingsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    include?: Prisma.chunk_lo_mappingsInclude<ExtArgs> | null;
    where?: Prisma.chunk_lo_mappingsWhereInput;
    orderBy?: Prisma.chunk_lo_mappingsOrderByWithRelationInput | Prisma.chunk_lo_mappingsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_lo_mappingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunk_lo_mappingsScalarFieldEnum | Prisma.Chunk_lo_mappingsScalarFieldEnum[];
};
export type chunk_lo_mappingsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    include?: Prisma.chunk_lo_mappingsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunk_lo_mappingsCreateInput, Prisma.chunk_lo_mappingsUncheckedCreateInput>;
};
export type chunk_lo_mappingsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.chunk_lo_mappingsCreateManyInput | Prisma.chunk_lo_mappingsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type chunk_lo_mappingsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    data: Prisma.chunk_lo_mappingsCreateManyInput | Prisma.chunk_lo_mappingsCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.chunk_lo_mappingsIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type chunk_lo_mappingsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    include?: Prisma.chunk_lo_mappingsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunk_lo_mappingsUpdateInput, Prisma.chunk_lo_mappingsUncheckedUpdateInput>;
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
};
export type chunk_lo_mappingsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.chunk_lo_mappingsUpdateManyMutationInput, Prisma.chunk_lo_mappingsUncheckedUpdateManyInput>;
    where?: Prisma.chunk_lo_mappingsWhereInput;
    limit?: number;
};
export type chunk_lo_mappingsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunk_lo_mappingsUpdateManyMutationInput, Prisma.chunk_lo_mappingsUncheckedUpdateManyInput>;
    where?: Prisma.chunk_lo_mappingsWhereInput;
    limit?: number;
    include?: Prisma.chunk_lo_mappingsIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type chunk_lo_mappingsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    include?: Prisma.chunk_lo_mappingsInclude<ExtArgs> | null;
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunk_lo_mappingsCreateInput, Prisma.chunk_lo_mappingsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.chunk_lo_mappingsUpdateInput, Prisma.chunk_lo_mappingsUncheckedUpdateInput>;
};
export type chunk_lo_mappingsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    include?: Prisma.chunk_lo_mappingsInclude<ExtArgs> | null;
    where: Prisma.chunk_lo_mappingsWhereUniqueInput;
};
export type chunk_lo_mappingsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_lo_mappingsWhereInput;
    limit?: number;
};
export type chunk_lo_mappingsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_lo_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_lo_mappingsOmit<ExtArgs> | null;
    include?: Prisma.chunk_lo_mappingsInclude<ExtArgs> | null;
};
