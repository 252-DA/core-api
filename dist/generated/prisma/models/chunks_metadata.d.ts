import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type chunks_metadataModel = runtime.Types.Result.DefaultSelection<Prisma.$chunks_metadataPayload>;
export type AggregateChunks_metadata = {
    _count: Chunks_metadataCountAggregateOutputType | null;
    _avg: Chunks_metadataAvgAggregateOutputType | null;
    _sum: Chunks_metadataSumAggregateOutputType | null;
    _min: Chunks_metadataMinAggregateOutputType | null;
    _max: Chunks_metadataMaxAggregateOutputType | null;
};
export type Chunks_metadataAvgAggregateOutputType = {
    chunk_index: number | null;
    heading_level: number | null;
    page_number: number | null;
    content_length: number | null;
};
export type Chunks_metadataSumAggregateOutputType = {
    chunk_index: number | null;
    heading_level: number | null;
    page_number: number | null;
    content_length: number | null;
};
export type Chunks_metadataMinAggregateOutputType = {
    chunk_id: string | null;
    document_id: string | null;
    chunk_index: number | null;
    heading_level: number | null;
    page_number: number | null;
    content_length: number | null;
    language: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type Chunks_metadataMaxAggregateOutputType = {
    chunk_id: string | null;
    document_id: string | null;
    chunk_index: number | null;
    heading_level: number | null;
    page_number: number | null;
    content_length: number | null;
    language: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type Chunks_metadataCountAggregateOutputType = {
    chunk_id: number;
    document_id: number;
    chunk_index: number;
    heading_path: number;
    heading_level: number;
    page_number: number;
    content_length: number;
    language: number;
    created_at: number;
    updated_at: number;
    _all: number;
};
export type Chunks_metadataAvgAggregateInputType = {
    chunk_index?: true;
    heading_level?: true;
    page_number?: true;
    content_length?: true;
};
export type Chunks_metadataSumAggregateInputType = {
    chunk_index?: true;
    heading_level?: true;
    page_number?: true;
    content_length?: true;
};
export type Chunks_metadataMinAggregateInputType = {
    chunk_id?: true;
    document_id?: true;
    chunk_index?: true;
    heading_level?: true;
    page_number?: true;
    content_length?: true;
    language?: true;
    created_at?: true;
    updated_at?: true;
};
export type Chunks_metadataMaxAggregateInputType = {
    chunk_id?: true;
    document_id?: true;
    chunk_index?: true;
    heading_level?: true;
    page_number?: true;
    content_length?: true;
    language?: true;
    created_at?: true;
    updated_at?: true;
};
export type Chunks_metadataCountAggregateInputType = {
    chunk_id?: true;
    document_id?: true;
    chunk_index?: true;
    heading_path?: true;
    heading_level?: true;
    page_number?: true;
    content_length?: true;
    language?: true;
    created_at?: true;
    updated_at?: true;
    _all?: true;
};
export type Chunks_metadataAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunks_metadataWhereInput;
    orderBy?: Prisma.chunks_metadataOrderByWithRelationInput | Prisma.chunks_metadataOrderByWithRelationInput[];
    cursor?: Prisma.chunks_metadataWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Chunks_metadataCountAggregateInputType;
    _avg?: Chunks_metadataAvgAggregateInputType;
    _sum?: Chunks_metadataSumAggregateInputType;
    _min?: Chunks_metadataMinAggregateInputType;
    _max?: Chunks_metadataMaxAggregateInputType;
};
export type GetChunks_metadataAggregateType<T extends Chunks_metadataAggregateArgs> = {
    [P in keyof T & keyof AggregateChunks_metadata]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateChunks_metadata[P]> : Prisma.GetScalarType<T[P], AggregateChunks_metadata[P]>;
};
export type chunks_metadataGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunks_metadataWhereInput;
    orderBy?: Prisma.chunks_metadataOrderByWithAggregationInput | Prisma.chunks_metadataOrderByWithAggregationInput[];
    by: Prisma.Chunks_metadataScalarFieldEnum[] | Prisma.Chunks_metadataScalarFieldEnum;
    having?: Prisma.chunks_metadataScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Chunks_metadataCountAggregateInputType | true;
    _avg?: Chunks_metadataAvgAggregateInputType;
    _sum?: Chunks_metadataSumAggregateInputType;
    _min?: Chunks_metadataMinAggregateInputType;
    _max?: Chunks_metadataMaxAggregateInputType;
};
export type Chunks_metadataGroupByOutputType = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path: string[];
    heading_level: number;
    page_number: number | null;
    content_length: number;
    language: string | null;
    created_at: Date;
    updated_at: Date;
    _count: Chunks_metadataCountAggregateOutputType | null;
    _avg: Chunks_metadataAvgAggregateOutputType | null;
    _sum: Chunks_metadataSumAggregateOutputType | null;
    _min: Chunks_metadataMinAggregateOutputType | null;
    _max: Chunks_metadataMaxAggregateOutputType | null;
};
export type GetChunks_metadataGroupByPayload<T extends chunks_metadataGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Chunks_metadataGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Chunks_metadataGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Chunks_metadataGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Chunks_metadataGroupByOutputType[P]>;
}>>;
export type chunks_metadataWhereInput = {
    AND?: Prisma.chunks_metadataWhereInput | Prisma.chunks_metadataWhereInput[];
    OR?: Prisma.chunks_metadataWhereInput[];
    NOT?: Prisma.chunks_metadataWhereInput | Prisma.chunks_metadataWhereInput[];
    chunk_id?: Prisma.StringFilter<"chunks_metadata"> | string;
    document_id?: Prisma.StringFilter<"chunks_metadata"> | string;
    chunk_index?: Prisma.IntFilter<"chunks_metadata"> | number;
    heading_path?: Prisma.StringNullableListFilter<"chunks_metadata">;
    heading_level?: Prisma.IntFilter<"chunks_metadata"> | number;
    page_number?: Prisma.IntNullableFilter<"chunks_metadata"> | number | null;
    content_length?: Prisma.IntFilter<"chunks_metadata"> | number;
    language?: Prisma.StringNullableFilter<"chunks_metadata"> | string | null;
    created_at?: Prisma.DateTimeFilter<"chunks_metadata"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"chunks_metadata"> | Date | string;
    chunk_concepts?: Prisma.Chunk_conceptsListRelationFilter;
    chunk_contents?: Prisma.XOR<Prisma.Chunk_contentsNullableScalarRelationFilter, Prisma.chunk_contentsWhereInput> | null;
    chunk_lo_mappings?: Prisma.Chunk_lo_mappingsListRelationFilter;
    lesson_cards?: Prisma.Lesson_cardsListRelationFilter;
    quiz_items?: Prisma.Quiz_itemsListRelationFilter;
};
export type chunks_metadataOrderByWithRelationInput = {
    chunk_id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    chunk_index?: Prisma.SortOrder;
    heading_path?: Prisma.SortOrder;
    heading_level?: Prisma.SortOrder;
    page_number?: Prisma.SortOrderInput | Prisma.SortOrder;
    content_length?: Prisma.SortOrder;
    language?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    chunk_concepts?: Prisma.chunk_conceptsOrderByRelationAggregateInput;
    chunk_contents?: Prisma.chunk_contentsOrderByWithRelationInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsOrderByRelationAggregateInput;
    lesson_cards?: Prisma.lesson_cardsOrderByRelationAggregateInput;
    quiz_items?: Prisma.quiz_itemsOrderByRelationAggregateInput;
};
export type chunks_metadataWhereUniqueInput = Prisma.AtLeast<{
    chunk_id?: string;
    AND?: Prisma.chunks_metadataWhereInput | Prisma.chunks_metadataWhereInput[];
    OR?: Prisma.chunks_metadataWhereInput[];
    NOT?: Prisma.chunks_metadataWhereInput | Prisma.chunks_metadataWhereInput[];
    document_id?: Prisma.StringFilter<"chunks_metadata"> | string;
    chunk_index?: Prisma.IntFilter<"chunks_metadata"> | number;
    heading_path?: Prisma.StringNullableListFilter<"chunks_metadata">;
    heading_level?: Prisma.IntFilter<"chunks_metadata"> | number;
    page_number?: Prisma.IntNullableFilter<"chunks_metadata"> | number | null;
    content_length?: Prisma.IntFilter<"chunks_metadata"> | number;
    language?: Prisma.StringNullableFilter<"chunks_metadata"> | string | null;
    created_at?: Prisma.DateTimeFilter<"chunks_metadata"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"chunks_metadata"> | Date | string;
    chunk_concepts?: Prisma.Chunk_conceptsListRelationFilter;
    chunk_contents?: Prisma.XOR<Prisma.Chunk_contentsNullableScalarRelationFilter, Prisma.chunk_contentsWhereInput> | null;
    chunk_lo_mappings?: Prisma.Chunk_lo_mappingsListRelationFilter;
    lesson_cards?: Prisma.Lesson_cardsListRelationFilter;
    quiz_items?: Prisma.Quiz_itemsListRelationFilter;
}, "chunk_id">;
export type chunks_metadataOrderByWithAggregationInput = {
    chunk_id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    chunk_index?: Prisma.SortOrder;
    heading_path?: Prisma.SortOrder;
    heading_level?: Prisma.SortOrder;
    page_number?: Prisma.SortOrderInput | Prisma.SortOrder;
    content_length?: Prisma.SortOrder;
    language?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    _count?: Prisma.chunks_metadataCountOrderByAggregateInput;
    _avg?: Prisma.chunks_metadataAvgOrderByAggregateInput;
    _max?: Prisma.chunks_metadataMaxOrderByAggregateInput;
    _min?: Prisma.chunks_metadataMinOrderByAggregateInput;
    _sum?: Prisma.chunks_metadataSumOrderByAggregateInput;
};
export type chunks_metadataScalarWhereWithAggregatesInput = {
    AND?: Prisma.chunks_metadataScalarWhereWithAggregatesInput | Prisma.chunks_metadataScalarWhereWithAggregatesInput[];
    OR?: Prisma.chunks_metadataScalarWhereWithAggregatesInput[];
    NOT?: Prisma.chunks_metadataScalarWhereWithAggregatesInput | Prisma.chunks_metadataScalarWhereWithAggregatesInput[];
    chunk_id?: Prisma.StringWithAggregatesFilter<"chunks_metadata"> | string;
    document_id?: Prisma.StringWithAggregatesFilter<"chunks_metadata"> | string;
    chunk_index?: Prisma.IntWithAggregatesFilter<"chunks_metadata"> | number;
    heading_path?: Prisma.StringNullableListFilter<"chunks_metadata">;
    heading_level?: Prisma.IntWithAggregatesFilter<"chunks_metadata"> | number;
    page_number?: Prisma.IntNullableWithAggregatesFilter<"chunks_metadata"> | number | null;
    content_length?: Prisma.IntWithAggregatesFilter<"chunks_metadata"> | number;
    language?: Prisma.StringNullableWithAggregatesFilter<"chunks_metadata"> | string | null;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"chunks_metadata"> | Date | string;
    updated_at?: Prisma.DateTimeWithAggregatesFilter<"chunks_metadata"> | Date | string;
};
export type chunks_metadataCreateInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsCreateNestedManyWithoutChunks_metadataInput;
    chunk_contents?: Prisma.chunk_contentsCreateNestedOneWithoutChunks_metadataInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsCreateNestedManyWithoutChunks_metadataInput;
    lesson_cards?: Prisma.lesson_cardsCreateNestedManyWithoutChunks_metadataInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataUncheckedCreateInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    chunk_contents?: Prisma.chunk_contentsUncheckedCreateNestedOneWithoutChunks_metadataInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataUpdateInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUpdateManyWithoutChunks_metadataNestedInput;
    chunk_contents?: Prisma.chunk_contentsUpdateOneWithoutChunks_metadataNestedInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUpdateManyWithoutChunks_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUpdateManyWithoutChunks_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataUncheckedUpdateInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    chunk_contents?: Prisma.chunk_contentsUncheckedUpdateOneWithoutChunks_metadataNestedInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataCreateManyInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type chunks_metadataUpdateManyMutationInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunks_metadataUncheckedUpdateManyInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type Chunks_metadataScalarRelationFilter = {
    is?: Prisma.chunks_metadataWhereInput;
    isNot?: Prisma.chunks_metadataWhereInput;
};
export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    has?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    hasEvery?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    hasSome?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    isEmpty?: boolean;
};
export type chunks_metadataCountOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    chunk_index?: Prisma.SortOrder;
    heading_path?: Prisma.SortOrder;
    heading_level?: Prisma.SortOrder;
    page_number?: Prisma.SortOrder;
    content_length?: Prisma.SortOrder;
    language?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type chunks_metadataAvgOrderByAggregateInput = {
    chunk_index?: Prisma.SortOrder;
    heading_level?: Prisma.SortOrder;
    page_number?: Prisma.SortOrder;
    content_length?: Prisma.SortOrder;
};
export type chunks_metadataMaxOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    chunk_index?: Prisma.SortOrder;
    heading_level?: Prisma.SortOrder;
    page_number?: Prisma.SortOrder;
    content_length?: Prisma.SortOrder;
    language?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type chunks_metadataMinOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    chunk_index?: Prisma.SortOrder;
    heading_level?: Prisma.SortOrder;
    page_number?: Prisma.SortOrder;
    content_length?: Prisma.SortOrder;
    language?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type chunks_metadataSumOrderByAggregateInput = {
    chunk_index?: Prisma.SortOrder;
    heading_level?: Prisma.SortOrder;
    page_number?: Prisma.SortOrder;
    content_length?: Prisma.SortOrder;
};
export type chunks_metadataCreateNestedOneWithoutChunk_conceptsInput = {
    create?: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_conceptsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_conceptsInput>;
    connectOrCreate?: Prisma.chunks_metadataCreateOrConnectWithoutChunk_conceptsInput;
    connect?: Prisma.chunks_metadataWhereUniqueInput;
};
export type chunks_metadataUpdateOneRequiredWithoutChunk_conceptsNestedInput = {
    create?: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_conceptsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_conceptsInput>;
    connectOrCreate?: Prisma.chunks_metadataCreateOrConnectWithoutChunk_conceptsInput;
    upsert?: Prisma.chunks_metadataUpsertWithoutChunk_conceptsInput;
    connect?: Prisma.chunks_metadataWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.chunks_metadataUpdateToOneWithWhereWithoutChunk_conceptsInput, Prisma.chunks_metadataUpdateWithoutChunk_conceptsInput>, Prisma.chunks_metadataUncheckedUpdateWithoutChunk_conceptsInput>;
};
export type chunks_metadataCreateNestedOneWithoutChunk_contentsInput = {
    create?: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_contentsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_contentsInput>;
    connectOrCreate?: Prisma.chunks_metadataCreateOrConnectWithoutChunk_contentsInput;
    connect?: Prisma.chunks_metadataWhereUniqueInput;
};
export type chunks_metadataUpdateOneRequiredWithoutChunk_contentsNestedInput = {
    create?: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_contentsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_contentsInput>;
    connectOrCreate?: Prisma.chunks_metadataCreateOrConnectWithoutChunk_contentsInput;
    upsert?: Prisma.chunks_metadataUpsertWithoutChunk_contentsInput;
    connect?: Prisma.chunks_metadataWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.chunks_metadataUpdateToOneWithWhereWithoutChunk_contentsInput, Prisma.chunks_metadataUpdateWithoutChunk_contentsInput>, Prisma.chunks_metadataUncheckedUpdateWithoutChunk_contentsInput>;
};
export type chunks_metadataCreateNestedOneWithoutChunk_lo_mappingsInput = {
    create?: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_lo_mappingsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_lo_mappingsInput>;
    connectOrCreate?: Prisma.chunks_metadataCreateOrConnectWithoutChunk_lo_mappingsInput;
    connect?: Prisma.chunks_metadataWhereUniqueInput;
};
export type chunks_metadataUpdateOneRequiredWithoutChunk_lo_mappingsNestedInput = {
    create?: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_lo_mappingsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_lo_mappingsInput>;
    connectOrCreate?: Prisma.chunks_metadataCreateOrConnectWithoutChunk_lo_mappingsInput;
    upsert?: Prisma.chunks_metadataUpsertWithoutChunk_lo_mappingsInput;
    connect?: Prisma.chunks_metadataWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.chunks_metadataUpdateToOneWithWhereWithoutChunk_lo_mappingsInput, Prisma.chunks_metadataUpdateWithoutChunk_lo_mappingsInput>, Prisma.chunks_metadataUncheckedUpdateWithoutChunk_lo_mappingsInput>;
};
export type chunks_metadataCreateheading_pathInput = {
    set: string[];
};
export type chunks_metadataUpdateheading_pathInput = {
    set?: string[];
    push?: string | string[];
};
export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type chunks_metadataCreateNestedOneWithoutLesson_cardsInput = {
    create?: Prisma.XOR<Prisma.chunks_metadataCreateWithoutLesson_cardsInput, Prisma.chunks_metadataUncheckedCreateWithoutLesson_cardsInput>;
    connectOrCreate?: Prisma.chunks_metadataCreateOrConnectWithoutLesson_cardsInput;
    connect?: Prisma.chunks_metadataWhereUniqueInput;
};
export type chunks_metadataUpdateOneRequiredWithoutLesson_cardsNestedInput = {
    create?: Prisma.XOR<Prisma.chunks_metadataCreateWithoutLesson_cardsInput, Prisma.chunks_metadataUncheckedCreateWithoutLesson_cardsInput>;
    connectOrCreate?: Prisma.chunks_metadataCreateOrConnectWithoutLesson_cardsInput;
    upsert?: Prisma.chunks_metadataUpsertWithoutLesson_cardsInput;
    connect?: Prisma.chunks_metadataWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.chunks_metadataUpdateToOneWithWhereWithoutLesson_cardsInput, Prisma.chunks_metadataUpdateWithoutLesson_cardsInput>, Prisma.chunks_metadataUncheckedUpdateWithoutLesson_cardsInput>;
};
export type chunks_metadataCreateNestedOneWithoutQuiz_itemsInput = {
    create?: Prisma.XOR<Prisma.chunks_metadataCreateWithoutQuiz_itemsInput, Prisma.chunks_metadataUncheckedCreateWithoutQuiz_itemsInput>;
    connectOrCreate?: Prisma.chunks_metadataCreateOrConnectWithoutQuiz_itemsInput;
    connect?: Prisma.chunks_metadataWhereUniqueInput;
};
export type chunks_metadataUpdateOneRequiredWithoutQuiz_itemsNestedInput = {
    create?: Prisma.XOR<Prisma.chunks_metadataCreateWithoutQuiz_itemsInput, Prisma.chunks_metadataUncheckedCreateWithoutQuiz_itemsInput>;
    connectOrCreate?: Prisma.chunks_metadataCreateOrConnectWithoutQuiz_itemsInput;
    upsert?: Prisma.chunks_metadataUpsertWithoutQuiz_itemsInput;
    connect?: Prisma.chunks_metadataWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.chunks_metadataUpdateToOneWithWhereWithoutQuiz_itemsInput, Prisma.chunks_metadataUpdateWithoutQuiz_itemsInput>, Prisma.chunks_metadataUncheckedUpdateWithoutQuiz_itemsInput>;
};
export type chunks_metadataCreateWithoutChunk_conceptsInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_contents?: Prisma.chunk_contentsCreateNestedOneWithoutChunks_metadataInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsCreateNestedManyWithoutChunks_metadataInput;
    lesson_cards?: Prisma.lesson_cardsCreateNestedManyWithoutChunks_metadataInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataUncheckedCreateWithoutChunk_conceptsInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_contents?: Prisma.chunk_contentsUncheckedCreateNestedOneWithoutChunks_metadataInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataCreateOrConnectWithoutChunk_conceptsInput = {
    where: Prisma.chunks_metadataWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_conceptsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_conceptsInput>;
};
export type chunks_metadataUpsertWithoutChunk_conceptsInput = {
    update: Prisma.XOR<Prisma.chunks_metadataUpdateWithoutChunk_conceptsInput, Prisma.chunks_metadataUncheckedUpdateWithoutChunk_conceptsInput>;
    create: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_conceptsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_conceptsInput>;
    where?: Prisma.chunks_metadataWhereInput;
};
export type chunks_metadataUpdateToOneWithWhereWithoutChunk_conceptsInput = {
    where?: Prisma.chunks_metadataWhereInput;
    data: Prisma.XOR<Prisma.chunks_metadataUpdateWithoutChunk_conceptsInput, Prisma.chunks_metadataUncheckedUpdateWithoutChunk_conceptsInput>;
};
export type chunks_metadataUpdateWithoutChunk_conceptsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_contents?: Prisma.chunk_contentsUpdateOneWithoutChunks_metadataNestedInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUpdateManyWithoutChunks_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUpdateManyWithoutChunks_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataUncheckedUpdateWithoutChunk_conceptsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_contents?: Prisma.chunk_contentsUncheckedUpdateOneWithoutChunks_metadataNestedInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataCreateWithoutChunk_contentsInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsCreateNestedManyWithoutChunks_metadataInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsCreateNestedManyWithoutChunks_metadataInput;
    lesson_cards?: Prisma.lesson_cardsCreateNestedManyWithoutChunks_metadataInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataUncheckedCreateWithoutChunk_contentsInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataCreateOrConnectWithoutChunk_contentsInput = {
    where: Prisma.chunks_metadataWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_contentsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_contentsInput>;
};
export type chunks_metadataUpsertWithoutChunk_contentsInput = {
    update: Prisma.XOR<Prisma.chunks_metadataUpdateWithoutChunk_contentsInput, Prisma.chunks_metadataUncheckedUpdateWithoutChunk_contentsInput>;
    create: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_contentsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_contentsInput>;
    where?: Prisma.chunks_metadataWhereInput;
};
export type chunks_metadataUpdateToOneWithWhereWithoutChunk_contentsInput = {
    where?: Prisma.chunks_metadataWhereInput;
    data: Prisma.XOR<Prisma.chunks_metadataUpdateWithoutChunk_contentsInput, Prisma.chunks_metadataUncheckedUpdateWithoutChunk_contentsInput>;
};
export type chunks_metadataUpdateWithoutChunk_contentsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUpdateManyWithoutChunks_metadataNestedInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUpdateManyWithoutChunks_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUpdateManyWithoutChunks_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataUncheckedUpdateWithoutChunk_contentsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataCreateWithoutChunk_lo_mappingsInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsCreateNestedManyWithoutChunks_metadataInput;
    chunk_contents?: Prisma.chunk_contentsCreateNestedOneWithoutChunks_metadataInput;
    lesson_cards?: Prisma.lesson_cardsCreateNestedManyWithoutChunks_metadataInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataUncheckedCreateWithoutChunk_lo_mappingsInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    chunk_contents?: Prisma.chunk_contentsUncheckedCreateNestedOneWithoutChunks_metadataInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataCreateOrConnectWithoutChunk_lo_mappingsInput = {
    where: Prisma.chunks_metadataWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_lo_mappingsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_lo_mappingsInput>;
};
export type chunks_metadataUpsertWithoutChunk_lo_mappingsInput = {
    update: Prisma.XOR<Prisma.chunks_metadataUpdateWithoutChunk_lo_mappingsInput, Prisma.chunks_metadataUncheckedUpdateWithoutChunk_lo_mappingsInput>;
    create: Prisma.XOR<Prisma.chunks_metadataCreateWithoutChunk_lo_mappingsInput, Prisma.chunks_metadataUncheckedCreateWithoutChunk_lo_mappingsInput>;
    where?: Prisma.chunks_metadataWhereInput;
};
export type chunks_metadataUpdateToOneWithWhereWithoutChunk_lo_mappingsInput = {
    where?: Prisma.chunks_metadataWhereInput;
    data: Prisma.XOR<Prisma.chunks_metadataUpdateWithoutChunk_lo_mappingsInput, Prisma.chunks_metadataUncheckedUpdateWithoutChunk_lo_mappingsInput>;
};
export type chunks_metadataUpdateWithoutChunk_lo_mappingsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUpdateManyWithoutChunks_metadataNestedInput;
    chunk_contents?: Prisma.chunk_contentsUpdateOneWithoutChunks_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUpdateManyWithoutChunks_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataUncheckedUpdateWithoutChunk_lo_mappingsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    chunk_contents?: Prisma.chunk_contentsUncheckedUpdateOneWithoutChunks_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataCreateWithoutLesson_cardsInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsCreateNestedManyWithoutChunks_metadataInput;
    chunk_contents?: Prisma.chunk_contentsCreateNestedOneWithoutChunks_metadataInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsCreateNestedManyWithoutChunks_metadataInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataUncheckedCreateWithoutLesson_cardsInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    chunk_contents?: Prisma.chunk_contentsUncheckedCreateNestedOneWithoutChunks_metadataInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataCreateOrConnectWithoutLesson_cardsInput = {
    where: Prisma.chunks_metadataWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunks_metadataCreateWithoutLesson_cardsInput, Prisma.chunks_metadataUncheckedCreateWithoutLesson_cardsInput>;
};
export type chunks_metadataUpsertWithoutLesson_cardsInput = {
    update: Prisma.XOR<Prisma.chunks_metadataUpdateWithoutLesson_cardsInput, Prisma.chunks_metadataUncheckedUpdateWithoutLesson_cardsInput>;
    create: Prisma.XOR<Prisma.chunks_metadataCreateWithoutLesson_cardsInput, Prisma.chunks_metadataUncheckedCreateWithoutLesson_cardsInput>;
    where?: Prisma.chunks_metadataWhereInput;
};
export type chunks_metadataUpdateToOneWithWhereWithoutLesson_cardsInput = {
    where?: Prisma.chunks_metadataWhereInput;
    data: Prisma.XOR<Prisma.chunks_metadataUpdateWithoutLesson_cardsInput, Prisma.chunks_metadataUncheckedUpdateWithoutLesson_cardsInput>;
};
export type chunks_metadataUpdateWithoutLesson_cardsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUpdateManyWithoutChunks_metadataNestedInput;
    chunk_contents?: Prisma.chunk_contentsUpdateOneWithoutChunks_metadataNestedInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUpdateManyWithoutChunks_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataUncheckedUpdateWithoutLesson_cardsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    chunk_contents?: Prisma.chunk_contentsUncheckedUpdateOneWithoutChunks_metadataNestedInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataCreateWithoutQuiz_itemsInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsCreateNestedManyWithoutChunks_metadataInput;
    chunk_contents?: Prisma.chunk_contentsCreateNestedOneWithoutChunks_metadataInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsCreateNestedManyWithoutChunks_metadataInput;
    lesson_cards?: Prisma.lesson_cardsCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataUncheckedCreateWithoutQuiz_itemsInput = {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    heading_path?: Prisma.chunks_metadataCreateheading_pathInput | string[];
    heading_level?: number;
    page_number?: number | null;
    content_length?: number;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    chunk_contents?: Prisma.chunk_contentsUncheckedCreateNestedOneWithoutChunks_metadataInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedCreateNestedManyWithoutChunks_metadataInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedCreateNestedManyWithoutChunks_metadataInput;
};
export type chunks_metadataCreateOrConnectWithoutQuiz_itemsInput = {
    where: Prisma.chunks_metadataWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunks_metadataCreateWithoutQuiz_itemsInput, Prisma.chunks_metadataUncheckedCreateWithoutQuiz_itemsInput>;
};
export type chunks_metadataUpsertWithoutQuiz_itemsInput = {
    update: Prisma.XOR<Prisma.chunks_metadataUpdateWithoutQuiz_itemsInput, Prisma.chunks_metadataUncheckedUpdateWithoutQuiz_itemsInput>;
    create: Prisma.XOR<Prisma.chunks_metadataCreateWithoutQuiz_itemsInput, Prisma.chunks_metadataUncheckedCreateWithoutQuiz_itemsInput>;
    where?: Prisma.chunks_metadataWhereInput;
};
export type chunks_metadataUpdateToOneWithWhereWithoutQuiz_itemsInput = {
    where?: Prisma.chunks_metadataWhereInput;
    data: Prisma.XOR<Prisma.chunks_metadataUpdateWithoutQuiz_itemsInput, Prisma.chunks_metadataUncheckedUpdateWithoutQuiz_itemsInput>;
};
export type chunks_metadataUpdateWithoutQuiz_itemsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUpdateManyWithoutChunks_metadataNestedInput;
    chunk_contents?: Prisma.chunk_contentsUpdateOneWithoutChunks_metadataNestedInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUpdateManyWithoutChunks_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUpdateManyWithoutChunks_metadataNestedInput;
};
export type chunks_metadataUncheckedUpdateWithoutQuiz_itemsInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    chunk_index?: Prisma.IntFieldUpdateOperationsInput | number;
    heading_path?: Prisma.chunks_metadataUpdateheading_pathInput | string[];
    heading_level?: Prisma.IntFieldUpdateOperationsInput | number;
    page_number?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    content_length?: Prisma.IntFieldUpdateOperationsInput | number;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    chunk_contents?: Prisma.chunk_contentsUncheckedUpdateOneWithoutChunks_metadataNestedInput;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedUpdateManyWithoutChunks_metadataNestedInput;
};
export type Chunks_metadataCountOutputType = {
    chunk_concepts: number;
    chunk_lo_mappings: number;
    lesson_cards: number;
    quiz_items: number;
};
export type Chunks_metadataCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunk_concepts?: boolean | Chunks_metadataCountOutputTypeCountChunk_conceptsArgs;
    chunk_lo_mappings?: boolean | Chunks_metadataCountOutputTypeCountChunk_lo_mappingsArgs;
    lesson_cards?: boolean | Chunks_metadataCountOutputTypeCountLesson_cardsArgs;
    quiz_items?: boolean | Chunks_metadataCountOutputTypeCountQuiz_itemsArgs;
};
export type Chunks_metadataCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.Chunks_metadataCountOutputTypeSelect<ExtArgs> | null;
};
export type Chunks_metadataCountOutputTypeCountChunk_conceptsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_conceptsWhereInput;
};
export type Chunks_metadataCountOutputTypeCountChunk_lo_mappingsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_lo_mappingsWhereInput;
};
export type Chunks_metadataCountOutputTypeCountLesson_cardsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lesson_cardsWhereInput;
};
export type Chunks_metadataCountOutputTypeCountQuiz_itemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.quiz_itemsWhereInput;
};
export type chunks_metadataSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    document_id?: boolean;
    chunk_index?: boolean;
    heading_path?: boolean;
    heading_level?: boolean;
    page_number?: boolean;
    content_length?: boolean;
    language?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
    chunk_concepts?: boolean | Prisma.chunks_metadata$chunk_conceptsArgs<ExtArgs>;
    chunk_contents?: boolean | Prisma.chunks_metadata$chunk_contentsArgs<ExtArgs>;
    chunk_lo_mappings?: boolean | Prisma.chunks_metadata$chunk_lo_mappingsArgs<ExtArgs>;
    lesson_cards?: boolean | Prisma.chunks_metadata$lesson_cardsArgs<ExtArgs>;
    quiz_items?: boolean | Prisma.chunks_metadata$quiz_itemsArgs<ExtArgs>;
    _count?: boolean | Prisma.Chunks_metadataCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chunks_metadata"]>;
export type chunks_metadataSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    document_id?: boolean;
    chunk_index?: boolean;
    heading_path?: boolean;
    heading_level?: boolean;
    page_number?: boolean;
    content_length?: boolean;
    language?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["chunks_metadata"]>;
export type chunks_metadataSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    document_id?: boolean;
    chunk_index?: boolean;
    heading_path?: boolean;
    heading_level?: boolean;
    page_number?: boolean;
    content_length?: boolean;
    language?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["chunks_metadata"]>;
export type chunks_metadataSelectScalar = {
    chunk_id?: boolean;
    document_id?: boolean;
    chunk_index?: boolean;
    heading_path?: boolean;
    heading_level?: boolean;
    page_number?: boolean;
    content_length?: boolean;
    language?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
};
export type chunks_metadataOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"chunk_id" | "document_id" | "chunk_index" | "heading_path" | "heading_level" | "page_number" | "content_length" | "language" | "created_at" | "updated_at", ExtArgs["result"]["chunks_metadata"]>;
export type chunks_metadataInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunk_concepts?: boolean | Prisma.chunks_metadata$chunk_conceptsArgs<ExtArgs>;
    chunk_contents?: boolean | Prisma.chunks_metadata$chunk_contentsArgs<ExtArgs>;
    chunk_lo_mappings?: boolean | Prisma.chunks_metadata$chunk_lo_mappingsArgs<ExtArgs>;
    lesson_cards?: boolean | Prisma.chunks_metadata$lesson_cardsArgs<ExtArgs>;
    quiz_items?: boolean | Prisma.chunks_metadata$quiz_itemsArgs<ExtArgs>;
    _count?: boolean | Prisma.Chunks_metadataCountOutputTypeDefaultArgs<ExtArgs>;
};
export type chunks_metadataIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type chunks_metadataIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $chunks_metadataPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "chunks_metadata";
    objects: {
        chunk_concepts: Prisma.$chunk_conceptsPayload<ExtArgs>[];
        chunk_contents: Prisma.$chunk_contentsPayload<ExtArgs> | null;
        chunk_lo_mappings: Prisma.$chunk_lo_mappingsPayload<ExtArgs>[];
        lesson_cards: Prisma.$lesson_cardsPayload<ExtArgs>[];
        quiz_items: Prisma.$quiz_itemsPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        chunk_id: string;
        document_id: string;
        chunk_index: number;
        heading_path: string[];
        heading_level: number;
        page_number: number | null;
        content_length: number;
        language: string | null;
        created_at: Date;
        updated_at: Date;
    }, ExtArgs["result"]["chunks_metadata"]>;
    composites: {};
};
export type chunks_metadataGetPayload<S extends boolean | null | undefined | chunks_metadataDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload, S>;
export type chunks_metadataCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<chunks_metadataFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Chunks_metadataCountAggregateInputType | true;
};
export interface chunks_metadataDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['chunks_metadata'];
        meta: {
            name: 'chunks_metadata';
        };
    };
    findUnique<T extends chunks_metadataFindUniqueArgs>(args: Prisma.SelectSubset<T, chunks_metadataFindUniqueArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends chunks_metadataFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, chunks_metadataFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends chunks_metadataFindFirstArgs>(args?: Prisma.SelectSubset<T, chunks_metadataFindFirstArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends chunks_metadataFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, chunks_metadataFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends chunks_metadataFindManyArgs>(args?: Prisma.SelectSubset<T, chunks_metadataFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends chunks_metadataCreateArgs>(args: Prisma.SelectSubset<T, chunks_metadataCreateArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends chunks_metadataCreateManyArgs>(args?: Prisma.SelectSubset<T, chunks_metadataCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends chunks_metadataCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, chunks_metadataCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends chunks_metadataDeleteArgs>(args: Prisma.SelectSubset<T, chunks_metadataDeleteArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends chunks_metadataUpdateArgs>(args: Prisma.SelectSubset<T, chunks_metadataUpdateArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends chunks_metadataDeleteManyArgs>(args?: Prisma.SelectSubset<T, chunks_metadataDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends chunks_metadataUpdateManyArgs>(args: Prisma.SelectSubset<T, chunks_metadataUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends chunks_metadataUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, chunks_metadataUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends chunks_metadataUpsertArgs>(args: Prisma.SelectSubset<T, chunks_metadataUpsertArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends chunks_metadataCountArgs>(args?: Prisma.Subset<T, chunks_metadataCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Chunks_metadataCountAggregateOutputType> : number>;
    aggregate<T extends Chunks_metadataAggregateArgs>(args: Prisma.Subset<T, Chunks_metadataAggregateArgs>): Prisma.PrismaPromise<GetChunks_metadataAggregateType<T>>;
    groupBy<T extends chunks_metadataGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: chunks_metadataGroupByArgs['orderBy'];
    } : {
        orderBy?: chunks_metadataGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, chunks_metadataGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChunks_metadataGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: chunks_metadataFieldRefs;
}
export interface Prisma__chunks_metadataClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    chunk_concepts<T extends Prisma.chunks_metadata$chunk_conceptsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.chunks_metadata$chunk_conceptsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    chunk_contents<T extends Prisma.chunks_metadata$chunk_contentsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.chunks_metadata$chunk_contentsArgs<ExtArgs>>): Prisma.Prisma__chunk_contentsClient<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    chunk_lo_mappings<T extends Prisma.chunks_metadata$chunk_lo_mappingsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.chunks_metadata$chunk_lo_mappingsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    lesson_cards<T extends Prisma.chunks_metadata$lesson_cardsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.chunks_metadata$lesson_cardsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    quiz_items<T extends Prisma.chunks_metadata$quiz_itemsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.chunks_metadata$quiz_itemsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface chunks_metadataFieldRefs {
    readonly chunk_id: Prisma.FieldRef<"chunks_metadata", 'String'>;
    readonly document_id: Prisma.FieldRef<"chunks_metadata", 'String'>;
    readonly chunk_index: Prisma.FieldRef<"chunks_metadata", 'Int'>;
    readonly heading_path: Prisma.FieldRef<"chunks_metadata", 'String[]'>;
    readonly heading_level: Prisma.FieldRef<"chunks_metadata", 'Int'>;
    readonly page_number: Prisma.FieldRef<"chunks_metadata", 'Int'>;
    readonly content_length: Prisma.FieldRef<"chunks_metadata", 'Int'>;
    readonly language: Prisma.FieldRef<"chunks_metadata", 'String'>;
    readonly created_at: Prisma.FieldRef<"chunks_metadata", 'DateTime'>;
    readonly updated_at: Prisma.FieldRef<"chunks_metadata", 'DateTime'>;
}
export type chunks_metadataFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelect<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    include?: Prisma.chunks_metadataInclude<ExtArgs> | null;
    where: Prisma.chunks_metadataWhereUniqueInput;
};
export type chunks_metadataFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelect<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    include?: Prisma.chunks_metadataInclude<ExtArgs> | null;
    where: Prisma.chunks_metadataWhereUniqueInput;
};
export type chunks_metadataFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelect<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    include?: Prisma.chunks_metadataInclude<ExtArgs> | null;
    where?: Prisma.chunks_metadataWhereInput;
    orderBy?: Prisma.chunks_metadataOrderByWithRelationInput | Prisma.chunks_metadataOrderByWithRelationInput[];
    cursor?: Prisma.chunks_metadataWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunks_metadataScalarFieldEnum | Prisma.Chunks_metadataScalarFieldEnum[];
};
export type chunks_metadataFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelect<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    include?: Prisma.chunks_metadataInclude<ExtArgs> | null;
    where?: Prisma.chunks_metadataWhereInput;
    orderBy?: Prisma.chunks_metadataOrderByWithRelationInput | Prisma.chunks_metadataOrderByWithRelationInput[];
    cursor?: Prisma.chunks_metadataWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunks_metadataScalarFieldEnum | Prisma.Chunks_metadataScalarFieldEnum[];
};
export type chunks_metadataFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelect<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    include?: Prisma.chunks_metadataInclude<ExtArgs> | null;
    where?: Prisma.chunks_metadataWhereInput;
    orderBy?: Prisma.chunks_metadataOrderByWithRelationInput | Prisma.chunks_metadataOrderByWithRelationInput[];
    cursor?: Prisma.chunks_metadataWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunks_metadataScalarFieldEnum | Prisma.Chunks_metadataScalarFieldEnum[];
};
export type chunks_metadataCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelect<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    include?: Prisma.chunks_metadataInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunks_metadataCreateInput, Prisma.chunks_metadataUncheckedCreateInput>;
};
export type chunks_metadataCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.chunks_metadataCreateManyInput | Prisma.chunks_metadataCreateManyInput[];
    skipDuplicates?: boolean;
};
export type chunks_metadataCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    data: Prisma.chunks_metadataCreateManyInput | Prisma.chunks_metadataCreateManyInput[];
    skipDuplicates?: boolean;
};
export type chunks_metadataUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelect<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    include?: Prisma.chunks_metadataInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunks_metadataUpdateInput, Prisma.chunks_metadataUncheckedUpdateInput>;
    where: Prisma.chunks_metadataWhereUniqueInput;
};
export type chunks_metadataUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.chunks_metadataUpdateManyMutationInput, Prisma.chunks_metadataUncheckedUpdateManyInput>;
    where?: Prisma.chunks_metadataWhereInput;
    limit?: number;
};
export type chunks_metadataUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunks_metadataUpdateManyMutationInput, Prisma.chunks_metadataUncheckedUpdateManyInput>;
    where?: Prisma.chunks_metadataWhereInput;
    limit?: number;
};
export type chunks_metadataUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelect<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    include?: Prisma.chunks_metadataInclude<ExtArgs> | null;
    where: Prisma.chunks_metadataWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunks_metadataCreateInput, Prisma.chunks_metadataUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.chunks_metadataUpdateInput, Prisma.chunks_metadataUncheckedUpdateInput>;
};
export type chunks_metadataDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelect<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    include?: Prisma.chunks_metadataInclude<ExtArgs> | null;
    where: Prisma.chunks_metadataWhereUniqueInput;
};
export type chunks_metadataDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunks_metadataWhereInput;
    limit?: number;
};
export type chunks_metadata$chunk_conceptsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type chunks_metadata$chunk_contentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
    where?: Prisma.chunk_contentsWhereInput;
};
export type chunks_metadata$chunk_lo_mappingsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type chunks_metadata$lesson_cardsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type chunks_metadata$quiz_itemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.quiz_itemsSelect<ExtArgs> | null;
    omit?: Prisma.quiz_itemsOmit<ExtArgs> | null;
    include?: Prisma.quiz_itemsInclude<ExtArgs> | null;
    where?: Prisma.quiz_itemsWhereInput;
    orderBy?: Prisma.quiz_itemsOrderByWithRelationInput | Prisma.quiz_itemsOrderByWithRelationInput[];
    cursor?: Prisma.quiz_itemsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Quiz_itemsScalarFieldEnum | Prisma.Quiz_itemsScalarFieldEnum[];
};
export type chunks_metadataDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunks_metadataSelect<ExtArgs> | null;
    omit?: Prisma.chunks_metadataOmit<ExtArgs> | null;
    include?: Prisma.chunks_metadataInclude<ExtArgs> | null;
};
