import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type lesson_cardsModel = runtime.Types.Result.DefaultSelection<Prisma.$lesson_cardsPayload>;
export type AggregateLesson_cards = {
    _count: Lesson_cardsCountAggregateOutputType | null;
    _avg: Lesson_cardsAvgAggregateOutputType | null;
    _sum: Lesson_cardsSumAggregateOutputType | null;
    _min: Lesson_cardsMinAggregateOutputType | null;
    _max: Lesson_cardsMaxAggregateOutputType | null;
};
export type Lesson_cardsAvgAggregateOutputType = {
    card_index: number | null;
};
export type Lesson_cardsSumAggregateOutputType = {
    card_index: number | null;
};
export type Lesson_cardsMinAggregateOutputType = {
    id: string | null;
    document_id: string | null;
    primary_chunk_id: string | null;
    title: string | null;
    key_insight: string | null;
    card_index: number | null;
    model_id: string | null;
    created_at: Date | null;
};
export type Lesson_cardsMaxAggregateOutputType = {
    id: string | null;
    document_id: string | null;
    primary_chunk_id: string | null;
    title: string | null;
    key_insight: string | null;
    card_index: number | null;
    model_id: string | null;
    created_at: Date | null;
};
export type Lesson_cardsCountAggregateOutputType = {
    id: number;
    document_id: number;
    primary_chunk_id: number;
    source_chunk_ids: number;
    heading_path: number;
    title: number;
    bullets: number;
    key_insight: number;
    card_index: number;
    model_id: number;
    created_at: number;
    _all: number;
};
export type Lesson_cardsAvgAggregateInputType = {
    card_index?: true;
};
export type Lesson_cardsSumAggregateInputType = {
    card_index?: true;
};
export type Lesson_cardsMinAggregateInputType = {
    id?: true;
    document_id?: true;
    primary_chunk_id?: true;
    title?: true;
    key_insight?: true;
    card_index?: true;
    model_id?: true;
    created_at?: true;
};
export type Lesson_cardsMaxAggregateInputType = {
    id?: true;
    document_id?: true;
    primary_chunk_id?: true;
    title?: true;
    key_insight?: true;
    card_index?: true;
    model_id?: true;
    created_at?: true;
};
export type Lesson_cardsCountAggregateInputType = {
    id?: true;
    document_id?: true;
    primary_chunk_id?: true;
    source_chunk_ids?: true;
    heading_path?: true;
    title?: true;
    bullets?: true;
    key_insight?: true;
    card_index?: true;
    model_id?: true;
    created_at?: true;
    _all?: true;
};
export type Lesson_cardsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lesson_cardsWhereInput;
    orderBy?: Prisma.lesson_cardsOrderByWithRelationInput | Prisma.lesson_cardsOrderByWithRelationInput[];
    cursor?: Prisma.lesson_cardsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Lesson_cardsCountAggregateInputType;
    _avg?: Lesson_cardsAvgAggregateInputType;
    _sum?: Lesson_cardsSumAggregateInputType;
    _min?: Lesson_cardsMinAggregateInputType;
    _max?: Lesson_cardsMaxAggregateInputType;
};
export type GetLesson_cardsAggregateType<T extends Lesson_cardsAggregateArgs> = {
    [P in keyof T & keyof AggregateLesson_cards]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateLesson_cards[P]> : Prisma.GetScalarType<T[P], AggregateLesson_cards[P]>;
};
export type lesson_cardsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lesson_cardsWhereInput;
    orderBy?: Prisma.lesson_cardsOrderByWithAggregationInput | Prisma.lesson_cardsOrderByWithAggregationInput[];
    by: Prisma.Lesson_cardsScalarFieldEnum[] | Prisma.Lesson_cardsScalarFieldEnum;
    having?: Prisma.lesson_cardsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Lesson_cardsCountAggregateInputType | true;
    _avg?: Lesson_cardsAvgAggregateInputType;
    _sum?: Lesson_cardsSumAggregateInputType;
    _min?: Lesson_cardsMinAggregateInputType;
    _max?: Lesson_cardsMaxAggregateInputType;
};
export type Lesson_cardsGroupByOutputType = {
    id: string;
    document_id: string;
    primary_chunk_id: string;
    source_chunk_ids: string[];
    heading_path: string[];
    title: string;
    bullets: string[];
    key_insight: string | null;
    card_index: number;
    model_id: string | null;
    created_at: Date;
    _count: Lesson_cardsCountAggregateOutputType | null;
    _avg: Lesson_cardsAvgAggregateOutputType | null;
    _sum: Lesson_cardsSumAggregateOutputType | null;
    _min: Lesson_cardsMinAggregateOutputType | null;
    _max: Lesson_cardsMaxAggregateOutputType | null;
};
export type GetLesson_cardsGroupByPayload<T extends lesson_cardsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Lesson_cardsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Lesson_cardsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Lesson_cardsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Lesson_cardsGroupByOutputType[P]>;
}>>;
export type lesson_cardsWhereInput = {
    AND?: Prisma.lesson_cardsWhereInput | Prisma.lesson_cardsWhereInput[];
    OR?: Prisma.lesson_cardsWhereInput[];
    NOT?: Prisma.lesson_cardsWhereInput | Prisma.lesson_cardsWhereInput[];
    id?: Prisma.StringFilter<"lesson_cards"> | string;
    document_id?: Prisma.StringFilter<"lesson_cards"> | string;
    primary_chunk_id?: Prisma.StringFilter<"lesson_cards"> | string;
    source_chunk_ids?: Prisma.StringNullableListFilter<"lesson_cards">;
    heading_path?: Prisma.StringNullableListFilter<"lesson_cards">;
    title?: Prisma.StringFilter<"lesson_cards"> | string;
    bullets?: Prisma.StringNullableListFilter<"lesson_cards">;
    key_insight?: Prisma.StringNullableFilter<"lesson_cards"> | string | null;
    card_index?: Prisma.IntFilter<"lesson_cards"> | number;
    model_id?: Prisma.StringNullableFilter<"lesson_cards"> | string | null;
    created_at?: Prisma.DateTimeFilter<"lesson_cards"> | Date | string;
    documents_metadata?: Prisma.XOR<Prisma.Documents_metadataScalarRelationFilter, Prisma.documents_metadataWhereInput>;
    chunks_metadata?: Prisma.XOR<Prisma.Chunks_metadataScalarRelationFilter, Prisma.chunks_metadataWhereInput>;
};
export type lesson_cardsOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    primary_chunk_id?: Prisma.SortOrder;
    source_chunk_ids?: Prisma.SortOrder;
    heading_path?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    bullets?: Prisma.SortOrder;
    key_insight?: Prisma.SortOrderInput | Prisma.SortOrder;
    card_index?: Prisma.SortOrder;
    model_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    documents_metadata?: Prisma.documents_metadataOrderByWithRelationInput;
    chunks_metadata?: Prisma.chunks_metadataOrderByWithRelationInput;
};
export type lesson_cardsWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    document_id_primary_chunk_id_card_index?: Prisma.lesson_cardsDocument_idPrimary_chunk_idCard_indexCompoundUniqueInput;
    AND?: Prisma.lesson_cardsWhereInput | Prisma.lesson_cardsWhereInput[];
    OR?: Prisma.lesson_cardsWhereInput[];
    NOT?: Prisma.lesson_cardsWhereInput | Prisma.lesson_cardsWhereInput[];
    document_id?: Prisma.StringFilter<"lesson_cards"> | string;
    primary_chunk_id?: Prisma.StringFilter<"lesson_cards"> | string;
    source_chunk_ids?: Prisma.StringNullableListFilter<"lesson_cards">;
    heading_path?: Prisma.StringNullableListFilter<"lesson_cards">;
    title?: Prisma.StringFilter<"lesson_cards"> | string;
    bullets?: Prisma.StringNullableListFilter<"lesson_cards">;
    key_insight?: Prisma.StringNullableFilter<"lesson_cards"> | string | null;
    card_index?: Prisma.IntFilter<"lesson_cards"> | number;
    model_id?: Prisma.StringNullableFilter<"lesson_cards"> | string | null;
    created_at?: Prisma.DateTimeFilter<"lesson_cards"> | Date | string;
    documents_metadata?: Prisma.XOR<Prisma.Documents_metadataScalarRelationFilter, Prisma.documents_metadataWhereInput>;
    chunks_metadata?: Prisma.XOR<Prisma.Chunks_metadataScalarRelationFilter, Prisma.chunks_metadataWhereInput>;
}, "id" | "document_id_primary_chunk_id_card_index">;
export type lesson_cardsOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    primary_chunk_id?: Prisma.SortOrder;
    source_chunk_ids?: Prisma.SortOrder;
    heading_path?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    bullets?: Prisma.SortOrder;
    key_insight?: Prisma.SortOrderInput | Prisma.SortOrder;
    card_index?: Prisma.SortOrder;
    model_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    _count?: Prisma.lesson_cardsCountOrderByAggregateInput;
    _avg?: Prisma.lesson_cardsAvgOrderByAggregateInput;
    _max?: Prisma.lesson_cardsMaxOrderByAggregateInput;
    _min?: Prisma.lesson_cardsMinOrderByAggregateInput;
    _sum?: Prisma.lesson_cardsSumOrderByAggregateInput;
};
export type lesson_cardsScalarWhereWithAggregatesInput = {
    AND?: Prisma.lesson_cardsScalarWhereWithAggregatesInput | Prisma.lesson_cardsScalarWhereWithAggregatesInput[];
    OR?: Prisma.lesson_cardsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.lesson_cardsScalarWhereWithAggregatesInput | Prisma.lesson_cardsScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"lesson_cards"> | string;
    document_id?: Prisma.StringWithAggregatesFilter<"lesson_cards"> | string;
    primary_chunk_id?: Prisma.StringWithAggregatesFilter<"lesson_cards"> | string;
    source_chunk_ids?: Prisma.StringNullableListFilter<"lesson_cards">;
    heading_path?: Prisma.StringNullableListFilter<"lesson_cards">;
    title?: Prisma.StringWithAggregatesFilter<"lesson_cards"> | string;
    bullets?: Prisma.StringNullableListFilter<"lesson_cards">;
    key_insight?: Prisma.StringNullableWithAggregatesFilter<"lesson_cards"> | string | null;
    card_index?: Prisma.IntWithAggregatesFilter<"lesson_cards"> | number;
    model_id?: Prisma.StringNullableWithAggregatesFilter<"lesson_cards"> | string | null;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"lesson_cards"> | Date | string;
};
export type lesson_cardsCreateInput = {
    id: string;
    source_chunk_ids?: Prisma.lesson_cardsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsCreateheading_pathInput | string[];
    title: string;
    bullets?: Prisma.lesson_cardsCreatebulletsInput | string[];
    key_insight?: string | null;
    card_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    documents_metadata: Prisma.documents_metadataCreateNestedOneWithoutLesson_cardsInput;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutLesson_cardsInput;
};
export type lesson_cardsUncheckedCreateInput = {
    id: string;
    document_id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.lesson_cardsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsCreateheading_pathInput | string[];
    title: string;
    bullets?: Prisma.lesson_cardsCreatebulletsInput | string[];
    key_insight?: string | null;
    card_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
};
export type lesson_cardsUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.lesson_cardsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsUpdateheading_pathInput | string[];
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    bullets?: Prisma.lesson_cardsUpdatebulletsInput | string[];
    key_insight?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    card_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    documents_metadata?: Prisma.documents_metadataUpdateOneRequiredWithoutLesson_cardsNestedInput;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutLesson_cardsNestedInput;
};
export type lesson_cardsUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.lesson_cardsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsUpdateheading_pathInput | string[];
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    bullets?: Prisma.lesson_cardsUpdatebulletsInput | string[];
    key_insight?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    card_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lesson_cardsCreateManyInput = {
    id: string;
    document_id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.lesson_cardsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsCreateheading_pathInput | string[];
    title: string;
    bullets?: Prisma.lesson_cardsCreatebulletsInput | string[];
    key_insight?: string | null;
    card_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
};
export type lesson_cardsUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.lesson_cardsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsUpdateheading_pathInput | string[];
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    bullets?: Prisma.lesson_cardsUpdatebulletsInput | string[];
    key_insight?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    card_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lesson_cardsUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.lesson_cardsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsUpdateheading_pathInput | string[];
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    bullets?: Prisma.lesson_cardsUpdatebulletsInput | string[];
    key_insight?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    card_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type Lesson_cardsListRelationFilter = {
    every?: Prisma.lesson_cardsWhereInput;
    some?: Prisma.lesson_cardsWhereInput;
    none?: Prisma.lesson_cardsWhereInput;
};
export type lesson_cardsOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type lesson_cardsDocument_idPrimary_chunk_idCard_indexCompoundUniqueInput = {
    document_id: string;
    primary_chunk_id: string;
    card_index: number;
};
export type lesson_cardsCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    primary_chunk_id?: Prisma.SortOrder;
    source_chunk_ids?: Prisma.SortOrder;
    heading_path?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    bullets?: Prisma.SortOrder;
    key_insight?: Prisma.SortOrder;
    card_index?: Prisma.SortOrder;
    model_id?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
};
export type lesson_cardsAvgOrderByAggregateInput = {
    card_index?: Prisma.SortOrder;
};
export type lesson_cardsMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    primary_chunk_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    key_insight?: Prisma.SortOrder;
    card_index?: Prisma.SortOrder;
    model_id?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
};
export type lesson_cardsMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    primary_chunk_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    key_insight?: Prisma.SortOrder;
    card_index?: Prisma.SortOrder;
    model_id?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
};
export type lesson_cardsSumOrderByAggregateInput = {
    card_index?: Prisma.SortOrder;
};
export type lesson_cardsCreateNestedManyWithoutChunks_metadataInput = {
    create?: Prisma.XOR<Prisma.lesson_cardsCreateWithoutChunks_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutChunks_metadataInput> | Prisma.lesson_cardsCreateWithoutChunks_metadataInput[] | Prisma.lesson_cardsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.lesson_cardsCreateOrConnectWithoutChunks_metadataInput | Prisma.lesson_cardsCreateOrConnectWithoutChunks_metadataInput[];
    createMany?: Prisma.lesson_cardsCreateManyChunks_metadataInputEnvelope;
    connect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
};
export type lesson_cardsUncheckedCreateNestedManyWithoutChunks_metadataInput = {
    create?: Prisma.XOR<Prisma.lesson_cardsCreateWithoutChunks_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutChunks_metadataInput> | Prisma.lesson_cardsCreateWithoutChunks_metadataInput[] | Prisma.lesson_cardsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.lesson_cardsCreateOrConnectWithoutChunks_metadataInput | Prisma.lesson_cardsCreateOrConnectWithoutChunks_metadataInput[];
    createMany?: Prisma.lesson_cardsCreateManyChunks_metadataInputEnvelope;
    connect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
};
export type lesson_cardsUpdateManyWithoutChunks_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.lesson_cardsCreateWithoutChunks_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutChunks_metadataInput> | Prisma.lesson_cardsCreateWithoutChunks_metadataInput[] | Prisma.lesson_cardsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.lesson_cardsCreateOrConnectWithoutChunks_metadataInput | Prisma.lesson_cardsCreateOrConnectWithoutChunks_metadataInput[];
    upsert?: Prisma.lesson_cardsUpsertWithWhereUniqueWithoutChunks_metadataInput | Prisma.lesson_cardsUpsertWithWhereUniqueWithoutChunks_metadataInput[];
    createMany?: Prisma.lesson_cardsCreateManyChunks_metadataInputEnvelope;
    set?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    disconnect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    delete?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    connect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    update?: Prisma.lesson_cardsUpdateWithWhereUniqueWithoutChunks_metadataInput | Prisma.lesson_cardsUpdateWithWhereUniqueWithoutChunks_metadataInput[];
    updateMany?: Prisma.lesson_cardsUpdateManyWithWhereWithoutChunks_metadataInput | Prisma.lesson_cardsUpdateManyWithWhereWithoutChunks_metadataInput[];
    deleteMany?: Prisma.lesson_cardsScalarWhereInput | Prisma.lesson_cardsScalarWhereInput[];
};
export type lesson_cardsUncheckedUpdateManyWithoutChunks_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.lesson_cardsCreateWithoutChunks_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutChunks_metadataInput> | Prisma.lesson_cardsCreateWithoutChunks_metadataInput[] | Prisma.lesson_cardsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.lesson_cardsCreateOrConnectWithoutChunks_metadataInput | Prisma.lesson_cardsCreateOrConnectWithoutChunks_metadataInput[];
    upsert?: Prisma.lesson_cardsUpsertWithWhereUniqueWithoutChunks_metadataInput | Prisma.lesson_cardsUpsertWithWhereUniqueWithoutChunks_metadataInput[];
    createMany?: Prisma.lesson_cardsCreateManyChunks_metadataInputEnvelope;
    set?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    disconnect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    delete?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    connect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    update?: Prisma.lesson_cardsUpdateWithWhereUniqueWithoutChunks_metadataInput | Prisma.lesson_cardsUpdateWithWhereUniqueWithoutChunks_metadataInput[];
    updateMany?: Prisma.lesson_cardsUpdateManyWithWhereWithoutChunks_metadataInput | Prisma.lesson_cardsUpdateManyWithWhereWithoutChunks_metadataInput[];
    deleteMany?: Prisma.lesson_cardsScalarWhereInput | Prisma.lesson_cardsScalarWhereInput[];
};
export type lesson_cardsCreateNestedManyWithoutDocuments_metadataInput = {
    create?: Prisma.XOR<Prisma.lesson_cardsCreateWithoutDocuments_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutDocuments_metadataInput> | Prisma.lesson_cardsCreateWithoutDocuments_metadataInput[] | Prisma.lesson_cardsUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.lesson_cardsCreateOrConnectWithoutDocuments_metadataInput | Prisma.lesson_cardsCreateOrConnectWithoutDocuments_metadataInput[];
    createMany?: Prisma.lesson_cardsCreateManyDocuments_metadataInputEnvelope;
    connect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
};
export type lesson_cardsUncheckedCreateNestedManyWithoutDocuments_metadataInput = {
    create?: Prisma.XOR<Prisma.lesson_cardsCreateWithoutDocuments_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutDocuments_metadataInput> | Prisma.lesson_cardsCreateWithoutDocuments_metadataInput[] | Prisma.lesson_cardsUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.lesson_cardsCreateOrConnectWithoutDocuments_metadataInput | Prisma.lesson_cardsCreateOrConnectWithoutDocuments_metadataInput[];
    createMany?: Prisma.lesson_cardsCreateManyDocuments_metadataInputEnvelope;
    connect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
};
export type lesson_cardsUpdateManyWithoutDocuments_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.lesson_cardsCreateWithoutDocuments_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutDocuments_metadataInput> | Prisma.lesson_cardsCreateWithoutDocuments_metadataInput[] | Prisma.lesson_cardsUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.lesson_cardsCreateOrConnectWithoutDocuments_metadataInput | Prisma.lesson_cardsCreateOrConnectWithoutDocuments_metadataInput[];
    upsert?: Prisma.lesson_cardsUpsertWithWhereUniqueWithoutDocuments_metadataInput | Prisma.lesson_cardsUpsertWithWhereUniqueWithoutDocuments_metadataInput[];
    createMany?: Prisma.lesson_cardsCreateManyDocuments_metadataInputEnvelope;
    set?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    disconnect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    delete?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    connect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    update?: Prisma.lesson_cardsUpdateWithWhereUniqueWithoutDocuments_metadataInput | Prisma.lesson_cardsUpdateWithWhereUniqueWithoutDocuments_metadataInput[];
    updateMany?: Prisma.lesson_cardsUpdateManyWithWhereWithoutDocuments_metadataInput | Prisma.lesson_cardsUpdateManyWithWhereWithoutDocuments_metadataInput[];
    deleteMany?: Prisma.lesson_cardsScalarWhereInput | Prisma.lesson_cardsScalarWhereInput[];
};
export type lesson_cardsUncheckedUpdateManyWithoutDocuments_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.lesson_cardsCreateWithoutDocuments_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutDocuments_metadataInput> | Prisma.lesson_cardsCreateWithoutDocuments_metadataInput[] | Prisma.lesson_cardsUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.lesson_cardsCreateOrConnectWithoutDocuments_metadataInput | Prisma.lesson_cardsCreateOrConnectWithoutDocuments_metadataInput[];
    upsert?: Prisma.lesson_cardsUpsertWithWhereUniqueWithoutDocuments_metadataInput | Prisma.lesson_cardsUpsertWithWhereUniqueWithoutDocuments_metadataInput[];
    createMany?: Prisma.lesson_cardsCreateManyDocuments_metadataInputEnvelope;
    set?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    disconnect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    delete?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    connect?: Prisma.lesson_cardsWhereUniqueInput | Prisma.lesson_cardsWhereUniqueInput[];
    update?: Prisma.lesson_cardsUpdateWithWhereUniqueWithoutDocuments_metadataInput | Prisma.lesson_cardsUpdateWithWhereUniqueWithoutDocuments_metadataInput[];
    updateMany?: Prisma.lesson_cardsUpdateManyWithWhereWithoutDocuments_metadataInput | Prisma.lesson_cardsUpdateManyWithWhereWithoutDocuments_metadataInput[];
    deleteMany?: Prisma.lesson_cardsScalarWhereInput | Prisma.lesson_cardsScalarWhereInput[];
};
export type lesson_cardsCreatesource_chunk_idsInput = {
    set: string[];
};
export type lesson_cardsCreateheading_pathInput = {
    set: string[];
};
export type lesson_cardsCreatebulletsInput = {
    set: string[];
};
export type lesson_cardsUpdatesource_chunk_idsInput = {
    set?: string[];
    push?: string | string[];
};
export type lesson_cardsUpdateheading_pathInput = {
    set?: string[];
    push?: string | string[];
};
export type lesson_cardsUpdatebulletsInput = {
    set?: string[];
    push?: string | string[];
};
export type lesson_cardsCreateWithoutChunks_metadataInput = {
    id: string;
    source_chunk_ids?: Prisma.lesson_cardsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsCreateheading_pathInput | string[];
    title: string;
    bullets?: Prisma.lesson_cardsCreatebulletsInput | string[];
    key_insight?: string | null;
    card_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    documents_metadata: Prisma.documents_metadataCreateNestedOneWithoutLesson_cardsInput;
};
export type lesson_cardsUncheckedCreateWithoutChunks_metadataInput = {
    id: string;
    document_id: string;
    source_chunk_ids?: Prisma.lesson_cardsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsCreateheading_pathInput | string[];
    title: string;
    bullets?: Prisma.lesson_cardsCreatebulletsInput | string[];
    key_insight?: string | null;
    card_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
};
export type lesson_cardsCreateOrConnectWithoutChunks_metadataInput = {
    where: Prisma.lesson_cardsWhereUniqueInput;
    create: Prisma.XOR<Prisma.lesson_cardsCreateWithoutChunks_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutChunks_metadataInput>;
};
export type lesson_cardsCreateManyChunks_metadataInputEnvelope = {
    data: Prisma.lesson_cardsCreateManyChunks_metadataInput | Prisma.lesson_cardsCreateManyChunks_metadataInput[];
    skipDuplicates?: boolean;
};
export type lesson_cardsUpsertWithWhereUniqueWithoutChunks_metadataInput = {
    where: Prisma.lesson_cardsWhereUniqueInput;
    update: Prisma.XOR<Prisma.lesson_cardsUpdateWithoutChunks_metadataInput, Prisma.lesson_cardsUncheckedUpdateWithoutChunks_metadataInput>;
    create: Prisma.XOR<Prisma.lesson_cardsCreateWithoutChunks_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutChunks_metadataInput>;
};
export type lesson_cardsUpdateWithWhereUniqueWithoutChunks_metadataInput = {
    where: Prisma.lesson_cardsWhereUniqueInput;
    data: Prisma.XOR<Prisma.lesson_cardsUpdateWithoutChunks_metadataInput, Prisma.lesson_cardsUncheckedUpdateWithoutChunks_metadataInput>;
};
export type lesson_cardsUpdateManyWithWhereWithoutChunks_metadataInput = {
    where: Prisma.lesson_cardsScalarWhereInput;
    data: Prisma.XOR<Prisma.lesson_cardsUpdateManyMutationInput, Prisma.lesson_cardsUncheckedUpdateManyWithoutChunks_metadataInput>;
};
export type lesson_cardsScalarWhereInput = {
    AND?: Prisma.lesson_cardsScalarWhereInput | Prisma.lesson_cardsScalarWhereInput[];
    OR?: Prisma.lesson_cardsScalarWhereInput[];
    NOT?: Prisma.lesson_cardsScalarWhereInput | Prisma.lesson_cardsScalarWhereInput[];
    id?: Prisma.StringFilter<"lesson_cards"> | string;
    document_id?: Prisma.StringFilter<"lesson_cards"> | string;
    primary_chunk_id?: Prisma.StringFilter<"lesson_cards"> | string;
    source_chunk_ids?: Prisma.StringNullableListFilter<"lesson_cards">;
    heading_path?: Prisma.StringNullableListFilter<"lesson_cards">;
    title?: Prisma.StringFilter<"lesson_cards"> | string;
    bullets?: Prisma.StringNullableListFilter<"lesson_cards">;
    key_insight?: Prisma.StringNullableFilter<"lesson_cards"> | string | null;
    card_index?: Prisma.IntFilter<"lesson_cards"> | number;
    model_id?: Prisma.StringNullableFilter<"lesson_cards"> | string | null;
    created_at?: Prisma.DateTimeFilter<"lesson_cards"> | Date | string;
};
export type lesson_cardsCreateWithoutDocuments_metadataInput = {
    id: string;
    source_chunk_ids?: Prisma.lesson_cardsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsCreateheading_pathInput | string[];
    title: string;
    bullets?: Prisma.lesson_cardsCreatebulletsInput | string[];
    key_insight?: string | null;
    card_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutLesson_cardsInput;
};
export type lesson_cardsUncheckedCreateWithoutDocuments_metadataInput = {
    id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.lesson_cardsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsCreateheading_pathInput | string[];
    title: string;
    bullets?: Prisma.lesson_cardsCreatebulletsInput | string[];
    key_insight?: string | null;
    card_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
};
export type lesson_cardsCreateOrConnectWithoutDocuments_metadataInput = {
    where: Prisma.lesson_cardsWhereUniqueInput;
    create: Prisma.XOR<Prisma.lesson_cardsCreateWithoutDocuments_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutDocuments_metadataInput>;
};
export type lesson_cardsCreateManyDocuments_metadataInputEnvelope = {
    data: Prisma.lesson_cardsCreateManyDocuments_metadataInput | Prisma.lesson_cardsCreateManyDocuments_metadataInput[];
    skipDuplicates?: boolean;
};
export type lesson_cardsUpsertWithWhereUniqueWithoutDocuments_metadataInput = {
    where: Prisma.lesson_cardsWhereUniqueInput;
    update: Prisma.XOR<Prisma.lesson_cardsUpdateWithoutDocuments_metadataInput, Prisma.lesson_cardsUncheckedUpdateWithoutDocuments_metadataInput>;
    create: Prisma.XOR<Prisma.lesson_cardsCreateWithoutDocuments_metadataInput, Prisma.lesson_cardsUncheckedCreateWithoutDocuments_metadataInput>;
};
export type lesson_cardsUpdateWithWhereUniqueWithoutDocuments_metadataInput = {
    where: Prisma.lesson_cardsWhereUniqueInput;
    data: Prisma.XOR<Prisma.lesson_cardsUpdateWithoutDocuments_metadataInput, Prisma.lesson_cardsUncheckedUpdateWithoutDocuments_metadataInput>;
};
export type lesson_cardsUpdateManyWithWhereWithoutDocuments_metadataInput = {
    where: Prisma.lesson_cardsScalarWhereInput;
    data: Prisma.XOR<Prisma.lesson_cardsUpdateManyMutationInput, Prisma.lesson_cardsUncheckedUpdateManyWithoutDocuments_metadataInput>;
};
export type lesson_cardsCreateManyChunks_metadataInput = {
    id: string;
    document_id: string;
    source_chunk_ids?: Prisma.lesson_cardsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsCreateheading_pathInput | string[];
    title: string;
    bullets?: Prisma.lesson_cardsCreatebulletsInput | string[];
    key_insight?: string | null;
    card_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
};
export type lesson_cardsUpdateWithoutChunks_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.lesson_cardsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsUpdateheading_pathInput | string[];
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    bullets?: Prisma.lesson_cardsUpdatebulletsInput | string[];
    key_insight?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    card_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    documents_metadata?: Prisma.documents_metadataUpdateOneRequiredWithoutLesson_cardsNestedInput;
};
export type lesson_cardsUncheckedUpdateWithoutChunks_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.lesson_cardsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsUpdateheading_pathInput | string[];
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    bullets?: Prisma.lesson_cardsUpdatebulletsInput | string[];
    key_insight?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    card_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lesson_cardsUncheckedUpdateManyWithoutChunks_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.lesson_cardsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsUpdateheading_pathInput | string[];
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    bullets?: Prisma.lesson_cardsUpdatebulletsInput | string[];
    key_insight?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    card_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lesson_cardsCreateManyDocuments_metadataInput = {
    id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.lesson_cardsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsCreateheading_pathInput | string[];
    title: string;
    bullets?: Prisma.lesson_cardsCreatebulletsInput | string[];
    key_insight?: string | null;
    card_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
};
export type lesson_cardsUpdateWithoutDocuments_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.lesson_cardsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsUpdateheading_pathInput | string[];
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    bullets?: Prisma.lesson_cardsUpdatebulletsInput | string[];
    key_insight?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    card_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutLesson_cardsNestedInput;
};
export type lesson_cardsUncheckedUpdateWithoutDocuments_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.lesson_cardsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsUpdateheading_pathInput | string[];
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    bullets?: Prisma.lesson_cardsUpdatebulletsInput | string[];
    key_insight?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    card_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lesson_cardsUncheckedUpdateManyWithoutDocuments_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.lesson_cardsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.lesson_cardsUpdateheading_pathInput | string[];
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    bullets?: Prisma.lesson_cardsUpdatebulletsInput | string[];
    key_insight?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    card_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lesson_cardsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    document_id?: boolean;
    primary_chunk_id?: boolean;
    source_chunk_ids?: boolean;
    heading_path?: boolean;
    title?: boolean;
    bullets?: boolean;
    key_insight?: boolean;
    card_index?: boolean;
    model_id?: boolean;
    created_at?: boolean;
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["lesson_cards"]>;
export type lesson_cardsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    document_id?: boolean;
    primary_chunk_id?: boolean;
    source_chunk_ids?: boolean;
    heading_path?: boolean;
    title?: boolean;
    bullets?: boolean;
    key_insight?: boolean;
    card_index?: boolean;
    model_id?: boolean;
    created_at?: boolean;
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["lesson_cards"]>;
export type lesson_cardsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    document_id?: boolean;
    primary_chunk_id?: boolean;
    source_chunk_ids?: boolean;
    heading_path?: boolean;
    title?: boolean;
    bullets?: boolean;
    key_insight?: boolean;
    card_index?: boolean;
    model_id?: boolean;
    created_at?: boolean;
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["lesson_cards"]>;
export type lesson_cardsSelectScalar = {
    id?: boolean;
    document_id?: boolean;
    primary_chunk_id?: boolean;
    source_chunk_ids?: boolean;
    heading_path?: boolean;
    title?: boolean;
    bullets?: boolean;
    key_insight?: boolean;
    card_index?: boolean;
    model_id?: boolean;
    created_at?: boolean;
};
export type lesson_cardsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "document_id" | "primary_chunk_id" | "source_chunk_ids" | "heading_path" | "title" | "bullets" | "key_insight" | "card_index" | "model_id" | "created_at", ExtArgs["result"]["lesson_cards"]>;
export type lesson_cardsInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
};
export type lesson_cardsIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
};
export type lesson_cardsIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
};
export type $lesson_cardsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "lesson_cards";
    objects: {
        documents_metadata: Prisma.$documents_metadataPayload<ExtArgs>;
        chunks_metadata: Prisma.$chunks_metadataPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        document_id: string;
        primary_chunk_id: string;
        source_chunk_ids: string[];
        heading_path: string[];
        title: string;
        bullets: string[];
        key_insight: string | null;
        card_index: number;
        model_id: string | null;
        created_at: Date;
    }, ExtArgs["result"]["lesson_cards"]>;
    composites: {};
};
export type lesson_cardsGetPayload<S extends boolean | null | undefined | lesson_cardsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload, S>;
export type lesson_cardsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<lesson_cardsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Lesson_cardsCountAggregateInputType | true;
};
export interface lesson_cardsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['lesson_cards'];
        meta: {
            name: 'lesson_cards';
        };
    };
    findUnique<T extends lesson_cardsFindUniqueArgs>(args: Prisma.SelectSubset<T, lesson_cardsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__lesson_cardsClient<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends lesson_cardsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, lesson_cardsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__lesson_cardsClient<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends lesson_cardsFindFirstArgs>(args?: Prisma.SelectSubset<T, lesson_cardsFindFirstArgs<ExtArgs>>): Prisma.Prisma__lesson_cardsClient<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends lesson_cardsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, lesson_cardsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__lesson_cardsClient<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends lesson_cardsFindManyArgs>(args?: Prisma.SelectSubset<T, lesson_cardsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends lesson_cardsCreateArgs>(args: Prisma.SelectSubset<T, lesson_cardsCreateArgs<ExtArgs>>): Prisma.Prisma__lesson_cardsClient<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends lesson_cardsCreateManyArgs>(args?: Prisma.SelectSubset<T, lesson_cardsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends lesson_cardsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, lesson_cardsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends lesson_cardsDeleteArgs>(args: Prisma.SelectSubset<T, lesson_cardsDeleteArgs<ExtArgs>>): Prisma.Prisma__lesson_cardsClient<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends lesson_cardsUpdateArgs>(args: Prisma.SelectSubset<T, lesson_cardsUpdateArgs<ExtArgs>>): Prisma.Prisma__lesson_cardsClient<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends lesson_cardsDeleteManyArgs>(args?: Prisma.SelectSubset<T, lesson_cardsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends lesson_cardsUpdateManyArgs>(args: Prisma.SelectSubset<T, lesson_cardsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends lesson_cardsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, lesson_cardsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends lesson_cardsUpsertArgs>(args: Prisma.SelectSubset<T, lesson_cardsUpsertArgs<ExtArgs>>): Prisma.Prisma__lesson_cardsClient<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends lesson_cardsCountArgs>(args?: Prisma.Subset<T, lesson_cardsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Lesson_cardsCountAggregateOutputType> : number>;
    aggregate<T extends Lesson_cardsAggregateArgs>(args: Prisma.Subset<T, Lesson_cardsAggregateArgs>): Prisma.PrismaPromise<GetLesson_cardsAggregateType<T>>;
    groupBy<T extends lesson_cardsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: lesson_cardsGroupByArgs['orderBy'];
    } : {
        orderBy?: lesson_cardsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, lesson_cardsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLesson_cardsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: lesson_cardsFieldRefs;
}
export interface Prisma__lesson_cardsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    documents_metadata<T extends Prisma.documents_metadataDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.documents_metadataDefaultArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    chunks_metadata<T extends Prisma.chunks_metadataDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.chunks_metadataDefaultArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface lesson_cardsFieldRefs {
    readonly id: Prisma.FieldRef<"lesson_cards", 'String'>;
    readonly document_id: Prisma.FieldRef<"lesson_cards", 'String'>;
    readonly primary_chunk_id: Prisma.FieldRef<"lesson_cards", 'String'>;
    readonly source_chunk_ids: Prisma.FieldRef<"lesson_cards", 'String[]'>;
    readonly heading_path: Prisma.FieldRef<"lesson_cards", 'String[]'>;
    readonly title: Prisma.FieldRef<"lesson_cards", 'String'>;
    readonly bullets: Prisma.FieldRef<"lesson_cards", 'String[]'>;
    readonly key_insight: Prisma.FieldRef<"lesson_cards", 'String'>;
    readonly card_index: Prisma.FieldRef<"lesson_cards", 'Int'>;
    readonly model_id: Prisma.FieldRef<"lesson_cards", 'String'>;
    readonly created_at: Prisma.FieldRef<"lesson_cards", 'DateTime'>;
}
export type lesson_cardsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelect<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    include?: Prisma.lesson_cardsInclude<ExtArgs> | null;
    where: Prisma.lesson_cardsWhereUniqueInput;
};
export type lesson_cardsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelect<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    include?: Prisma.lesson_cardsInclude<ExtArgs> | null;
    where: Prisma.lesson_cardsWhereUniqueInput;
};
export type lesson_cardsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelect<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    include?: Prisma.lesson_cardsInclude<ExtArgs> | null;
    where?: Prisma.lesson_cardsWhereInput;
    orderBy?: Prisma.lesson_cardsOrderByWithRelationInput | Prisma.lesson_cardsOrderByWithRelationInput[];
    cursor?: Prisma.lesson_cardsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Lesson_cardsScalarFieldEnum | Prisma.Lesson_cardsScalarFieldEnum[];
};
export type lesson_cardsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelect<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    include?: Prisma.lesson_cardsInclude<ExtArgs> | null;
    where?: Prisma.lesson_cardsWhereInput;
    orderBy?: Prisma.lesson_cardsOrderByWithRelationInput | Prisma.lesson_cardsOrderByWithRelationInput[];
    cursor?: Prisma.lesson_cardsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Lesson_cardsScalarFieldEnum | Prisma.Lesson_cardsScalarFieldEnum[];
};
export type lesson_cardsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelect<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    include?: Prisma.lesson_cardsInclude<ExtArgs> | null;
    where?: Prisma.lesson_cardsWhereInput;
    orderBy?: Prisma.lesson_cardsOrderByWithRelationInput | Prisma.lesson_cardsOrderByWithRelationInput[];
    cursor?: Prisma.lesson_cardsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Lesson_cardsScalarFieldEnum | Prisma.Lesson_cardsScalarFieldEnum[];
};
export type lesson_cardsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelect<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    include?: Prisma.lesson_cardsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lesson_cardsCreateInput, Prisma.lesson_cardsUncheckedCreateInput>;
};
export type lesson_cardsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.lesson_cardsCreateManyInput | Prisma.lesson_cardsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type lesson_cardsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    data: Prisma.lesson_cardsCreateManyInput | Prisma.lesson_cardsCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.lesson_cardsIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type lesson_cardsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelect<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    include?: Prisma.lesson_cardsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lesson_cardsUpdateInput, Prisma.lesson_cardsUncheckedUpdateInput>;
    where: Prisma.lesson_cardsWhereUniqueInput;
};
export type lesson_cardsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.lesson_cardsUpdateManyMutationInput, Prisma.lesson_cardsUncheckedUpdateManyInput>;
    where?: Prisma.lesson_cardsWhereInput;
    limit?: number;
};
export type lesson_cardsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lesson_cardsUpdateManyMutationInput, Prisma.lesson_cardsUncheckedUpdateManyInput>;
    where?: Prisma.lesson_cardsWhereInput;
    limit?: number;
    include?: Prisma.lesson_cardsIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type lesson_cardsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelect<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    include?: Prisma.lesson_cardsInclude<ExtArgs> | null;
    where: Prisma.lesson_cardsWhereUniqueInput;
    create: Prisma.XOR<Prisma.lesson_cardsCreateInput, Prisma.lesson_cardsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.lesson_cardsUpdateInput, Prisma.lesson_cardsUncheckedUpdateInput>;
};
export type lesson_cardsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelect<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    include?: Prisma.lesson_cardsInclude<ExtArgs> | null;
    where: Prisma.lesson_cardsWhereUniqueInput;
};
export type lesson_cardsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lesson_cardsWhereInput;
    limit?: number;
};
export type lesson_cardsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lesson_cardsSelect<ExtArgs> | null;
    omit?: Prisma.lesson_cardsOmit<ExtArgs> | null;
    include?: Prisma.lesson_cardsInclude<ExtArgs> | null;
};
