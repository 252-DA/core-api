import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type chunk_conceptsModel = runtime.Types.Result.DefaultSelection<Prisma.$chunk_conceptsPayload>;
export type AggregateChunk_concepts = {
    _count: Chunk_conceptsCountAggregateOutputType | null;
    _avg: Chunk_conceptsAvgAggregateOutputType | null;
    _sum: Chunk_conceptsSumAggregateOutputType | null;
    _min: Chunk_conceptsMinAggregateOutputType | null;
    _max: Chunk_conceptsMaxAggregateOutputType | null;
};
export type Chunk_conceptsAvgAggregateOutputType = {
    confidence: number | null;
};
export type Chunk_conceptsSumAggregateOutputType = {
    confidence: number | null;
};
export type Chunk_conceptsMinAggregateOutputType = {
    chunk_id: string | null;
    concept_id: string | null;
    confidence: number | null;
    source: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type Chunk_conceptsMaxAggregateOutputType = {
    chunk_id: string | null;
    concept_id: string | null;
    confidence: number | null;
    source: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type Chunk_conceptsCountAggregateOutputType = {
    chunk_id: number;
    concept_id: number;
    confidence: number;
    source: number;
    created_at: number;
    updated_at: number;
    _all: number;
};
export type Chunk_conceptsAvgAggregateInputType = {
    confidence?: true;
};
export type Chunk_conceptsSumAggregateInputType = {
    confidence?: true;
};
export type Chunk_conceptsMinAggregateInputType = {
    chunk_id?: true;
    concept_id?: true;
    confidence?: true;
    source?: true;
    created_at?: true;
    updated_at?: true;
};
export type Chunk_conceptsMaxAggregateInputType = {
    chunk_id?: true;
    concept_id?: true;
    confidence?: true;
    source?: true;
    created_at?: true;
    updated_at?: true;
};
export type Chunk_conceptsCountAggregateInputType = {
    chunk_id?: true;
    concept_id?: true;
    confidence?: true;
    source?: true;
    created_at?: true;
    updated_at?: true;
    _all?: true;
};
export type Chunk_conceptsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_conceptsWhereInput;
    orderBy?: Prisma.chunk_conceptsOrderByWithRelationInput | Prisma.chunk_conceptsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_conceptsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Chunk_conceptsCountAggregateInputType;
    _avg?: Chunk_conceptsAvgAggregateInputType;
    _sum?: Chunk_conceptsSumAggregateInputType;
    _min?: Chunk_conceptsMinAggregateInputType;
    _max?: Chunk_conceptsMaxAggregateInputType;
};
export type GetChunk_conceptsAggregateType<T extends Chunk_conceptsAggregateArgs> = {
    [P in keyof T & keyof AggregateChunk_concepts]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateChunk_concepts[P]> : Prisma.GetScalarType<T[P], AggregateChunk_concepts[P]>;
};
export type chunk_conceptsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_conceptsWhereInput;
    orderBy?: Prisma.chunk_conceptsOrderByWithAggregationInput | Prisma.chunk_conceptsOrderByWithAggregationInput[];
    by: Prisma.Chunk_conceptsScalarFieldEnum[] | Prisma.Chunk_conceptsScalarFieldEnum;
    having?: Prisma.chunk_conceptsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Chunk_conceptsCountAggregateInputType | true;
    _avg?: Chunk_conceptsAvgAggregateInputType;
    _sum?: Chunk_conceptsSumAggregateInputType;
    _min?: Chunk_conceptsMinAggregateInputType;
    _max?: Chunk_conceptsMaxAggregateInputType;
};
export type Chunk_conceptsGroupByOutputType = {
    chunk_id: string;
    concept_id: string;
    confidence: number;
    source: string;
    created_at: Date;
    updated_at: Date;
    _count: Chunk_conceptsCountAggregateOutputType | null;
    _avg: Chunk_conceptsAvgAggregateOutputType | null;
    _sum: Chunk_conceptsSumAggregateOutputType | null;
    _min: Chunk_conceptsMinAggregateOutputType | null;
    _max: Chunk_conceptsMaxAggregateOutputType | null;
};
export type GetChunk_conceptsGroupByPayload<T extends chunk_conceptsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Chunk_conceptsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Chunk_conceptsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Chunk_conceptsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Chunk_conceptsGroupByOutputType[P]>;
}>>;
export type chunk_conceptsWhereInput = {
    AND?: Prisma.chunk_conceptsWhereInput | Prisma.chunk_conceptsWhereInput[];
    OR?: Prisma.chunk_conceptsWhereInput[];
    NOT?: Prisma.chunk_conceptsWhereInput | Prisma.chunk_conceptsWhereInput[];
    chunk_id?: Prisma.StringFilter<"chunk_concepts"> | string;
    concept_id?: Prisma.StringFilter<"chunk_concepts"> | string;
    confidence?: Prisma.FloatFilter<"chunk_concepts"> | number;
    source?: Prisma.StringFilter<"chunk_concepts"> | string;
    created_at?: Prisma.DateTimeFilter<"chunk_concepts"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"chunk_concepts"> | Date | string;
    chunks_metadata?: Prisma.XOR<Prisma.Chunks_metadataScalarRelationFilter, Prisma.chunks_metadataWhereInput>;
    concepts?: Prisma.XOR<Prisma.ConceptsScalarRelationFilter, Prisma.conceptsWhereInput>;
};
export type chunk_conceptsOrderByWithRelationInput = {
    chunk_id?: Prisma.SortOrder;
    concept_id?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    chunks_metadata?: Prisma.chunks_metadataOrderByWithRelationInput;
    concepts?: Prisma.conceptsOrderByWithRelationInput;
};
export type chunk_conceptsWhereUniqueInput = Prisma.AtLeast<{
    chunk_id_concept_id?: Prisma.chunk_conceptsChunk_idConcept_idCompoundUniqueInput;
    AND?: Prisma.chunk_conceptsWhereInput | Prisma.chunk_conceptsWhereInput[];
    OR?: Prisma.chunk_conceptsWhereInput[];
    NOT?: Prisma.chunk_conceptsWhereInput | Prisma.chunk_conceptsWhereInput[];
    chunk_id?: Prisma.StringFilter<"chunk_concepts"> | string;
    concept_id?: Prisma.StringFilter<"chunk_concepts"> | string;
    confidence?: Prisma.FloatFilter<"chunk_concepts"> | number;
    source?: Prisma.StringFilter<"chunk_concepts"> | string;
    created_at?: Prisma.DateTimeFilter<"chunk_concepts"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"chunk_concepts"> | Date | string;
    chunks_metadata?: Prisma.XOR<Prisma.Chunks_metadataScalarRelationFilter, Prisma.chunks_metadataWhereInput>;
    concepts?: Prisma.XOR<Prisma.ConceptsScalarRelationFilter, Prisma.conceptsWhereInput>;
}, "chunk_id_concept_id">;
export type chunk_conceptsOrderByWithAggregationInput = {
    chunk_id?: Prisma.SortOrder;
    concept_id?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    _count?: Prisma.chunk_conceptsCountOrderByAggregateInput;
    _avg?: Prisma.chunk_conceptsAvgOrderByAggregateInput;
    _max?: Prisma.chunk_conceptsMaxOrderByAggregateInput;
    _min?: Prisma.chunk_conceptsMinOrderByAggregateInput;
    _sum?: Prisma.chunk_conceptsSumOrderByAggregateInput;
};
export type chunk_conceptsScalarWhereWithAggregatesInput = {
    AND?: Prisma.chunk_conceptsScalarWhereWithAggregatesInput | Prisma.chunk_conceptsScalarWhereWithAggregatesInput[];
    OR?: Prisma.chunk_conceptsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.chunk_conceptsScalarWhereWithAggregatesInput | Prisma.chunk_conceptsScalarWhereWithAggregatesInput[];
    chunk_id?: Prisma.StringWithAggregatesFilter<"chunk_concepts"> | string;
    concept_id?: Prisma.StringWithAggregatesFilter<"chunk_concepts"> | string;
    confidence?: Prisma.FloatWithAggregatesFilter<"chunk_concepts"> | number;
    source?: Prisma.StringWithAggregatesFilter<"chunk_concepts"> | string;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"chunk_concepts"> | Date | string;
    updated_at?: Prisma.DateTimeWithAggregatesFilter<"chunk_concepts"> | Date | string;
};
export type chunk_conceptsCreateInput = {
    confidence?: number;
    source?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutChunk_conceptsInput;
    concepts: Prisma.conceptsCreateNestedOneWithoutChunk_conceptsInput;
};
export type chunk_conceptsUncheckedCreateInput = {
    chunk_id: string;
    concept_id: string;
    confidence?: number;
    source?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type chunk_conceptsUpdateInput = {
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutChunk_conceptsNestedInput;
    concepts?: Prisma.conceptsUpdateOneRequiredWithoutChunk_conceptsNestedInput;
};
export type chunk_conceptsUncheckedUpdateInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    concept_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_conceptsCreateManyInput = {
    chunk_id: string;
    concept_id: string;
    confidence?: number;
    source?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type chunk_conceptsUpdateManyMutationInput = {
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_conceptsUncheckedUpdateManyInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    concept_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_conceptsChunk_idConcept_idCompoundUniqueInput = {
    chunk_id: string;
    concept_id: string;
};
export type chunk_conceptsCountOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    concept_id?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type chunk_conceptsAvgOrderByAggregateInput = {
    confidence?: Prisma.SortOrder;
};
export type chunk_conceptsMaxOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    concept_id?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type chunk_conceptsMinOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    concept_id?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type chunk_conceptsSumOrderByAggregateInput = {
    confidence?: Prisma.SortOrder;
};
export type Chunk_conceptsListRelationFilter = {
    every?: Prisma.chunk_conceptsWhereInput;
    some?: Prisma.chunk_conceptsWhereInput;
    none?: Prisma.chunk_conceptsWhereInput;
};
export type chunk_conceptsOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type FloatFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
};
export type chunk_conceptsCreateNestedManyWithoutChunks_metadataInput = {
    create?: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutChunks_metadataInput, Prisma.chunk_conceptsUncheckedCreateWithoutChunks_metadataInput> | Prisma.chunk_conceptsCreateWithoutChunks_metadataInput[] | Prisma.chunk_conceptsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.chunk_conceptsCreateOrConnectWithoutChunks_metadataInput | Prisma.chunk_conceptsCreateOrConnectWithoutChunks_metadataInput[];
    createMany?: Prisma.chunk_conceptsCreateManyChunks_metadataInputEnvelope;
    connect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
};
export type chunk_conceptsUncheckedCreateNestedManyWithoutChunks_metadataInput = {
    create?: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutChunks_metadataInput, Prisma.chunk_conceptsUncheckedCreateWithoutChunks_metadataInput> | Prisma.chunk_conceptsCreateWithoutChunks_metadataInput[] | Prisma.chunk_conceptsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.chunk_conceptsCreateOrConnectWithoutChunks_metadataInput | Prisma.chunk_conceptsCreateOrConnectWithoutChunks_metadataInput[];
    createMany?: Prisma.chunk_conceptsCreateManyChunks_metadataInputEnvelope;
    connect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
};
export type chunk_conceptsUpdateManyWithoutChunks_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutChunks_metadataInput, Prisma.chunk_conceptsUncheckedCreateWithoutChunks_metadataInput> | Prisma.chunk_conceptsCreateWithoutChunks_metadataInput[] | Prisma.chunk_conceptsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.chunk_conceptsCreateOrConnectWithoutChunks_metadataInput | Prisma.chunk_conceptsCreateOrConnectWithoutChunks_metadataInput[];
    upsert?: Prisma.chunk_conceptsUpsertWithWhereUniqueWithoutChunks_metadataInput | Prisma.chunk_conceptsUpsertWithWhereUniqueWithoutChunks_metadataInput[];
    createMany?: Prisma.chunk_conceptsCreateManyChunks_metadataInputEnvelope;
    set?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    disconnect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    delete?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    connect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    update?: Prisma.chunk_conceptsUpdateWithWhereUniqueWithoutChunks_metadataInput | Prisma.chunk_conceptsUpdateWithWhereUniqueWithoutChunks_metadataInput[];
    updateMany?: Prisma.chunk_conceptsUpdateManyWithWhereWithoutChunks_metadataInput | Prisma.chunk_conceptsUpdateManyWithWhereWithoutChunks_metadataInput[];
    deleteMany?: Prisma.chunk_conceptsScalarWhereInput | Prisma.chunk_conceptsScalarWhereInput[];
};
export type chunk_conceptsUncheckedUpdateManyWithoutChunks_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutChunks_metadataInput, Prisma.chunk_conceptsUncheckedCreateWithoutChunks_metadataInput> | Prisma.chunk_conceptsCreateWithoutChunks_metadataInput[] | Prisma.chunk_conceptsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.chunk_conceptsCreateOrConnectWithoutChunks_metadataInput | Prisma.chunk_conceptsCreateOrConnectWithoutChunks_metadataInput[];
    upsert?: Prisma.chunk_conceptsUpsertWithWhereUniqueWithoutChunks_metadataInput | Prisma.chunk_conceptsUpsertWithWhereUniqueWithoutChunks_metadataInput[];
    createMany?: Prisma.chunk_conceptsCreateManyChunks_metadataInputEnvelope;
    set?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    disconnect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    delete?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    connect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    update?: Prisma.chunk_conceptsUpdateWithWhereUniqueWithoutChunks_metadataInput | Prisma.chunk_conceptsUpdateWithWhereUniqueWithoutChunks_metadataInput[];
    updateMany?: Prisma.chunk_conceptsUpdateManyWithWhereWithoutChunks_metadataInput | Prisma.chunk_conceptsUpdateManyWithWhereWithoutChunks_metadataInput[];
    deleteMany?: Prisma.chunk_conceptsScalarWhereInput | Prisma.chunk_conceptsScalarWhereInput[];
};
export type chunk_conceptsCreateNestedManyWithoutConceptsInput = {
    create?: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutConceptsInput, Prisma.chunk_conceptsUncheckedCreateWithoutConceptsInput> | Prisma.chunk_conceptsCreateWithoutConceptsInput[] | Prisma.chunk_conceptsUncheckedCreateWithoutConceptsInput[];
    connectOrCreate?: Prisma.chunk_conceptsCreateOrConnectWithoutConceptsInput | Prisma.chunk_conceptsCreateOrConnectWithoutConceptsInput[];
    createMany?: Prisma.chunk_conceptsCreateManyConceptsInputEnvelope;
    connect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
};
export type chunk_conceptsUncheckedCreateNestedManyWithoutConceptsInput = {
    create?: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutConceptsInput, Prisma.chunk_conceptsUncheckedCreateWithoutConceptsInput> | Prisma.chunk_conceptsCreateWithoutConceptsInput[] | Prisma.chunk_conceptsUncheckedCreateWithoutConceptsInput[];
    connectOrCreate?: Prisma.chunk_conceptsCreateOrConnectWithoutConceptsInput | Prisma.chunk_conceptsCreateOrConnectWithoutConceptsInput[];
    createMany?: Prisma.chunk_conceptsCreateManyConceptsInputEnvelope;
    connect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
};
export type chunk_conceptsUpdateManyWithoutConceptsNestedInput = {
    create?: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutConceptsInput, Prisma.chunk_conceptsUncheckedCreateWithoutConceptsInput> | Prisma.chunk_conceptsCreateWithoutConceptsInput[] | Prisma.chunk_conceptsUncheckedCreateWithoutConceptsInput[];
    connectOrCreate?: Prisma.chunk_conceptsCreateOrConnectWithoutConceptsInput | Prisma.chunk_conceptsCreateOrConnectWithoutConceptsInput[];
    upsert?: Prisma.chunk_conceptsUpsertWithWhereUniqueWithoutConceptsInput | Prisma.chunk_conceptsUpsertWithWhereUniqueWithoutConceptsInput[];
    createMany?: Prisma.chunk_conceptsCreateManyConceptsInputEnvelope;
    set?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    disconnect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    delete?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    connect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    update?: Prisma.chunk_conceptsUpdateWithWhereUniqueWithoutConceptsInput | Prisma.chunk_conceptsUpdateWithWhereUniqueWithoutConceptsInput[];
    updateMany?: Prisma.chunk_conceptsUpdateManyWithWhereWithoutConceptsInput | Prisma.chunk_conceptsUpdateManyWithWhereWithoutConceptsInput[];
    deleteMany?: Prisma.chunk_conceptsScalarWhereInput | Prisma.chunk_conceptsScalarWhereInput[];
};
export type chunk_conceptsUncheckedUpdateManyWithoutConceptsNestedInput = {
    create?: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutConceptsInput, Prisma.chunk_conceptsUncheckedCreateWithoutConceptsInput> | Prisma.chunk_conceptsCreateWithoutConceptsInput[] | Prisma.chunk_conceptsUncheckedCreateWithoutConceptsInput[];
    connectOrCreate?: Prisma.chunk_conceptsCreateOrConnectWithoutConceptsInput | Prisma.chunk_conceptsCreateOrConnectWithoutConceptsInput[];
    upsert?: Prisma.chunk_conceptsUpsertWithWhereUniqueWithoutConceptsInput | Prisma.chunk_conceptsUpsertWithWhereUniqueWithoutConceptsInput[];
    createMany?: Prisma.chunk_conceptsCreateManyConceptsInputEnvelope;
    set?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    disconnect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    delete?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    connect?: Prisma.chunk_conceptsWhereUniqueInput | Prisma.chunk_conceptsWhereUniqueInput[];
    update?: Prisma.chunk_conceptsUpdateWithWhereUniqueWithoutConceptsInput | Prisma.chunk_conceptsUpdateWithWhereUniqueWithoutConceptsInput[];
    updateMany?: Prisma.chunk_conceptsUpdateManyWithWhereWithoutConceptsInput | Prisma.chunk_conceptsUpdateManyWithWhereWithoutConceptsInput[];
    deleteMany?: Prisma.chunk_conceptsScalarWhereInput | Prisma.chunk_conceptsScalarWhereInput[];
};
export type chunk_conceptsCreateWithoutChunks_metadataInput = {
    confidence?: number;
    source?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
    concepts: Prisma.conceptsCreateNestedOneWithoutChunk_conceptsInput;
};
export type chunk_conceptsUncheckedCreateWithoutChunks_metadataInput = {
    concept_id: string;
    confidence?: number;
    source?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type chunk_conceptsCreateOrConnectWithoutChunks_metadataInput = {
    where: Prisma.chunk_conceptsWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutChunks_metadataInput, Prisma.chunk_conceptsUncheckedCreateWithoutChunks_metadataInput>;
};
export type chunk_conceptsCreateManyChunks_metadataInputEnvelope = {
    data: Prisma.chunk_conceptsCreateManyChunks_metadataInput | Prisma.chunk_conceptsCreateManyChunks_metadataInput[];
    skipDuplicates?: boolean;
};
export type chunk_conceptsUpsertWithWhereUniqueWithoutChunks_metadataInput = {
    where: Prisma.chunk_conceptsWhereUniqueInput;
    update: Prisma.XOR<Prisma.chunk_conceptsUpdateWithoutChunks_metadataInput, Prisma.chunk_conceptsUncheckedUpdateWithoutChunks_metadataInput>;
    create: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutChunks_metadataInput, Prisma.chunk_conceptsUncheckedCreateWithoutChunks_metadataInput>;
};
export type chunk_conceptsUpdateWithWhereUniqueWithoutChunks_metadataInput = {
    where: Prisma.chunk_conceptsWhereUniqueInput;
    data: Prisma.XOR<Prisma.chunk_conceptsUpdateWithoutChunks_metadataInput, Prisma.chunk_conceptsUncheckedUpdateWithoutChunks_metadataInput>;
};
export type chunk_conceptsUpdateManyWithWhereWithoutChunks_metadataInput = {
    where: Prisma.chunk_conceptsScalarWhereInput;
    data: Prisma.XOR<Prisma.chunk_conceptsUpdateManyMutationInput, Prisma.chunk_conceptsUncheckedUpdateManyWithoutChunks_metadataInput>;
};
export type chunk_conceptsScalarWhereInput = {
    AND?: Prisma.chunk_conceptsScalarWhereInput | Prisma.chunk_conceptsScalarWhereInput[];
    OR?: Prisma.chunk_conceptsScalarWhereInput[];
    NOT?: Prisma.chunk_conceptsScalarWhereInput | Prisma.chunk_conceptsScalarWhereInput[];
    chunk_id?: Prisma.StringFilter<"chunk_concepts"> | string;
    concept_id?: Prisma.StringFilter<"chunk_concepts"> | string;
    confidence?: Prisma.FloatFilter<"chunk_concepts"> | number;
    source?: Prisma.StringFilter<"chunk_concepts"> | string;
    created_at?: Prisma.DateTimeFilter<"chunk_concepts"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"chunk_concepts"> | Date | string;
};
export type chunk_conceptsCreateWithoutConceptsInput = {
    confidence?: number;
    source?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutChunk_conceptsInput;
};
export type chunk_conceptsUncheckedCreateWithoutConceptsInput = {
    chunk_id: string;
    confidence?: number;
    source?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type chunk_conceptsCreateOrConnectWithoutConceptsInput = {
    where: Prisma.chunk_conceptsWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutConceptsInput, Prisma.chunk_conceptsUncheckedCreateWithoutConceptsInput>;
};
export type chunk_conceptsCreateManyConceptsInputEnvelope = {
    data: Prisma.chunk_conceptsCreateManyConceptsInput | Prisma.chunk_conceptsCreateManyConceptsInput[];
    skipDuplicates?: boolean;
};
export type chunk_conceptsUpsertWithWhereUniqueWithoutConceptsInput = {
    where: Prisma.chunk_conceptsWhereUniqueInput;
    update: Prisma.XOR<Prisma.chunk_conceptsUpdateWithoutConceptsInput, Prisma.chunk_conceptsUncheckedUpdateWithoutConceptsInput>;
    create: Prisma.XOR<Prisma.chunk_conceptsCreateWithoutConceptsInput, Prisma.chunk_conceptsUncheckedCreateWithoutConceptsInput>;
};
export type chunk_conceptsUpdateWithWhereUniqueWithoutConceptsInput = {
    where: Prisma.chunk_conceptsWhereUniqueInput;
    data: Prisma.XOR<Prisma.chunk_conceptsUpdateWithoutConceptsInput, Prisma.chunk_conceptsUncheckedUpdateWithoutConceptsInput>;
};
export type chunk_conceptsUpdateManyWithWhereWithoutConceptsInput = {
    where: Prisma.chunk_conceptsScalarWhereInput;
    data: Prisma.XOR<Prisma.chunk_conceptsUpdateManyMutationInput, Prisma.chunk_conceptsUncheckedUpdateManyWithoutConceptsInput>;
};
export type chunk_conceptsCreateManyChunks_metadataInput = {
    concept_id: string;
    confidence?: number;
    source?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type chunk_conceptsUpdateWithoutChunks_metadataInput = {
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    concepts?: Prisma.conceptsUpdateOneRequiredWithoutChunk_conceptsNestedInput;
};
export type chunk_conceptsUncheckedUpdateWithoutChunks_metadataInput = {
    concept_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_conceptsUncheckedUpdateManyWithoutChunks_metadataInput = {
    concept_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_conceptsCreateManyConceptsInput = {
    chunk_id: string;
    confidence?: number;
    source?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type chunk_conceptsUpdateWithoutConceptsInput = {
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutChunk_conceptsNestedInput;
};
export type chunk_conceptsUncheckedUpdateWithoutConceptsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_conceptsUncheckedUpdateManyWithoutConceptsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    source?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_conceptsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    concept_id?: boolean;
    confidence?: boolean;
    source?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    concepts?: boolean | Prisma.conceptsDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chunk_concepts"]>;
export type chunk_conceptsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    concept_id?: boolean;
    confidence?: boolean;
    source?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    concepts?: boolean | Prisma.conceptsDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chunk_concepts"]>;
export type chunk_conceptsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    concept_id?: boolean;
    confidence?: boolean;
    source?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    concepts?: boolean | Prisma.conceptsDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chunk_concepts"]>;
export type chunk_conceptsSelectScalar = {
    chunk_id?: boolean;
    concept_id?: boolean;
    confidence?: boolean;
    source?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
};
export type chunk_conceptsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"chunk_id" | "concept_id" | "confidence" | "source" | "created_at" | "updated_at", ExtArgs["result"]["chunk_concepts"]>;
export type chunk_conceptsInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    concepts?: boolean | Prisma.conceptsDefaultArgs<ExtArgs>;
};
export type chunk_conceptsIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    concepts?: boolean | Prisma.conceptsDefaultArgs<ExtArgs>;
};
export type chunk_conceptsIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
    concepts?: boolean | Prisma.conceptsDefaultArgs<ExtArgs>;
};
export type $chunk_conceptsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "chunk_concepts";
    objects: {
        chunks_metadata: Prisma.$chunks_metadataPayload<ExtArgs>;
        concepts: Prisma.$conceptsPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        chunk_id: string;
        concept_id: string;
        confidence: number;
        source: string;
        created_at: Date;
        updated_at: Date;
    }, ExtArgs["result"]["chunk_concepts"]>;
    composites: {};
};
export type chunk_conceptsGetPayload<S extends boolean | null | undefined | chunk_conceptsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload, S>;
export type chunk_conceptsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<chunk_conceptsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Chunk_conceptsCountAggregateInputType | true;
};
export interface chunk_conceptsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['chunk_concepts'];
        meta: {
            name: 'chunk_concepts';
        };
    };
    findUnique<T extends chunk_conceptsFindUniqueArgs>(args: Prisma.SelectSubset<T, chunk_conceptsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__chunk_conceptsClient<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends chunk_conceptsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, chunk_conceptsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__chunk_conceptsClient<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends chunk_conceptsFindFirstArgs>(args?: Prisma.SelectSubset<T, chunk_conceptsFindFirstArgs<ExtArgs>>): Prisma.Prisma__chunk_conceptsClient<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends chunk_conceptsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, chunk_conceptsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__chunk_conceptsClient<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends chunk_conceptsFindManyArgs>(args?: Prisma.SelectSubset<T, chunk_conceptsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends chunk_conceptsCreateArgs>(args: Prisma.SelectSubset<T, chunk_conceptsCreateArgs<ExtArgs>>): Prisma.Prisma__chunk_conceptsClient<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends chunk_conceptsCreateManyArgs>(args?: Prisma.SelectSubset<T, chunk_conceptsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends chunk_conceptsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, chunk_conceptsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends chunk_conceptsDeleteArgs>(args: Prisma.SelectSubset<T, chunk_conceptsDeleteArgs<ExtArgs>>): Prisma.Prisma__chunk_conceptsClient<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends chunk_conceptsUpdateArgs>(args: Prisma.SelectSubset<T, chunk_conceptsUpdateArgs<ExtArgs>>): Prisma.Prisma__chunk_conceptsClient<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends chunk_conceptsDeleteManyArgs>(args?: Prisma.SelectSubset<T, chunk_conceptsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends chunk_conceptsUpdateManyArgs>(args: Prisma.SelectSubset<T, chunk_conceptsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends chunk_conceptsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, chunk_conceptsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends chunk_conceptsUpsertArgs>(args: Prisma.SelectSubset<T, chunk_conceptsUpsertArgs<ExtArgs>>): Prisma.Prisma__chunk_conceptsClient<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends chunk_conceptsCountArgs>(args?: Prisma.Subset<T, chunk_conceptsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Chunk_conceptsCountAggregateOutputType> : number>;
    aggregate<T extends Chunk_conceptsAggregateArgs>(args: Prisma.Subset<T, Chunk_conceptsAggregateArgs>): Prisma.PrismaPromise<GetChunk_conceptsAggregateType<T>>;
    groupBy<T extends chunk_conceptsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: chunk_conceptsGroupByArgs['orderBy'];
    } : {
        orderBy?: chunk_conceptsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, chunk_conceptsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChunk_conceptsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: chunk_conceptsFieldRefs;
}
export interface Prisma__chunk_conceptsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    chunks_metadata<T extends Prisma.chunks_metadataDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.chunks_metadataDefaultArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    concepts<T extends Prisma.conceptsDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.conceptsDefaultArgs<ExtArgs>>): Prisma.Prisma__conceptsClient<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface chunk_conceptsFieldRefs {
    readonly chunk_id: Prisma.FieldRef<"chunk_concepts", 'String'>;
    readonly concept_id: Prisma.FieldRef<"chunk_concepts", 'String'>;
    readonly confidence: Prisma.FieldRef<"chunk_concepts", 'Float'>;
    readonly source: Prisma.FieldRef<"chunk_concepts", 'String'>;
    readonly created_at: Prisma.FieldRef<"chunk_concepts", 'DateTime'>;
    readonly updated_at: Prisma.FieldRef<"chunk_concepts", 'DateTime'>;
}
export type chunk_conceptsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    include?: Prisma.chunk_conceptsInclude<ExtArgs> | null;
    where: Prisma.chunk_conceptsWhereUniqueInput;
};
export type chunk_conceptsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    include?: Prisma.chunk_conceptsInclude<ExtArgs> | null;
    where: Prisma.chunk_conceptsWhereUniqueInput;
};
export type chunk_conceptsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    include?: Prisma.chunk_conceptsInclude<ExtArgs> | null;
    where?: Prisma.chunk_conceptsWhereInput;
    orderBy?: Prisma.chunk_conceptsOrderByWithRelationInput | Prisma.chunk_conceptsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_conceptsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunk_conceptsScalarFieldEnum | Prisma.Chunk_conceptsScalarFieldEnum[];
};
export type chunk_conceptsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    include?: Prisma.chunk_conceptsInclude<ExtArgs> | null;
    where?: Prisma.chunk_conceptsWhereInput;
    orderBy?: Prisma.chunk_conceptsOrderByWithRelationInput | Prisma.chunk_conceptsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_conceptsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunk_conceptsScalarFieldEnum | Prisma.Chunk_conceptsScalarFieldEnum[];
};
export type chunk_conceptsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    include?: Prisma.chunk_conceptsInclude<ExtArgs> | null;
    where?: Prisma.chunk_conceptsWhereInput;
    orderBy?: Prisma.chunk_conceptsOrderByWithRelationInput | Prisma.chunk_conceptsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_conceptsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunk_conceptsScalarFieldEnum | Prisma.Chunk_conceptsScalarFieldEnum[];
};
export type chunk_conceptsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    include?: Prisma.chunk_conceptsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunk_conceptsCreateInput, Prisma.chunk_conceptsUncheckedCreateInput>;
};
export type chunk_conceptsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.chunk_conceptsCreateManyInput | Prisma.chunk_conceptsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type chunk_conceptsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    data: Prisma.chunk_conceptsCreateManyInput | Prisma.chunk_conceptsCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.chunk_conceptsIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type chunk_conceptsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    include?: Prisma.chunk_conceptsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunk_conceptsUpdateInput, Prisma.chunk_conceptsUncheckedUpdateInput>;
    where: Prisma.chunk_conceptsWhereUniqueInput;
};
export type chunk_conceptsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.chunk_conceptsUpdateManyMutationInput, Prisma.chunk_conceptsUncheckedUpdateManyInput>;
    where?: Prisma.chunk_conceptsWhereInput;
    limit?: number;
};
export type chunk_conceptsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunk_conceptsUpdateManyMutationInput, Prisma.chunk_conceptsUncheckedUpdateManyInput>;
    where?: Prisma.chunk_conceptsWhereInput;
    limit?: number;
    include?: Prisma.chunk_conceptsIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type chunk_conceptsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    include?: Prisma.chunk_conceptsInclude<ExtArgs> | null;
    where: Prisma.chunk_conceptsWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunk_conceptsCreateInput, Prisma.chunk_conceptsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.chunk_conceptsUpdateInput, Prisma.chunk_conceptsUncheckedUpdateInput>;
};
export type chunk_conceptsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    include?: Prisma.chunk_conceptsInclude<ExtArgs> | null;
    where: Prisma.chunk_conceptsWhereUniqueInput;
};
export type chunk_conceptsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_conceptsWhereInput;
    limit?: number;
};
export type chunk_conceptsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_conceptsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_conceptsOmit<ExtArgs> | null;
    include?: Prisma.chunk_conceptsInclude<ExtArgs> | null;
};
