import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type quiz_itemsModel = runtime.Types.Result.DefaultSelection<Prisma.$quiz_itemsPayload>;
export type AggregateQuiz_items = {
    _count: Quiz_itemsCountAggregateOutputType | null;
    _avg: Quiz_itemsAvgAggregateOutputType | null;
    _sum: Quiz_itemsSumAggregateOutputType | null;
    _min: Quiz_itemsMinAggregateOutputType | null;
    _max: Quiz_itemsMaxAggregateOutputType | null;
};
export type Quiz_itemsAvgAggregateOutputType = {
    correct_index: number | null;
    question_index: number | null;
};
export type Quiz_itemsSumAggregateOutputType = {
    correct_index: number | null;
    question_index: number | null;
};
export type Quiz_itemsMinAggregateOutputType = {
    id: string | null;
    document_id: string | null;
    primary_chunk_id: string | null;
    question: string | null;
    correct_index: number | null;
    explanation: string | null;
    difficulty: string | null;
    question_index: number | null;
    model_id: string | null;
    created_at: Date | null;
    lo_id: string | null;
    assessment_id: string | null;
    bloom_level: string | null;
};
export type Quiz_itemsMaxAggregateOutputType = {
    id: string | null;
    document_id: string | null;
    primary_chunk_id: string | null;
    question: string | null;
    correct_index: number | null;
    explanation: string | null;
    difficulty: string | null;
    question_index: number | null;
    model_id: string | null;
    created_at: Date | null;
    lo_id: string | null;
    assessment_id: string | null;
    bloom_level: string | null;
};
export type Quiz_itemsCountAggregateOutputType = {
    id: number;
    document_id: number;
    primary_chunk_id: number;
    source_chunk_ids: number;
    heading_path: number;
    question: number;
    choices: number;
    correct_index: number;
    explanation: number;
    difficulty: number;
    question_index: number;
    model_id: number;
    created_at: number;
    lo_id: number;
    assessment_id: number;
    bloom_level: number;
    _all: number;
};
export type Quiz_itemsAvgAggregateInputType = {
    correct_index?: true;
    question_index?: true;
};
export type Quiz_itemsSumAggregateInputType = {
    correct_index?: true;
    question_index?: true;
};
export type Quiz_itemsMinAggregateInputType = {
    id?: true;
    document_id?: true;
    primary_chunk_id?: true;
    question?: true;
    correct_index?: true;
    explanation?: true;
    difficulty?: true;
    question_index?: true;
    model_id?: true;
    created_at?: true;
    lo_id?: true;
    assessment_id?: true;
    bloom_level?: true;
};
export type Quiz_itemsMaxAggregateInputType = {
    id?: true;
    document_id?: true;
    primary_chunk_id?: true;
    question?: true;
    correct_index?: true;
    explanation?: true;
    difficulty?: true;
    question_index?: true;
    model_id?: true;
    created_at?: true;
    lo_id?: true;
    assessment_id?: true;
    bloom_level?: true;
};
export type Quiz_itemsCountAggregateInputType = {
    id?: true;
    document_id?: true;
    primary_chunk_id?: true;
    source_chunk_ids?: true;
    heading_path?: true;
    question?: true;
    choices?: true;
    correct_index?: true;
    explanation?: true;
    difficulty?: true;
    question_index?: true;
    model_id?: true;
    created_at?: true;
    lo_id?: true;
    assessment_id?: true;
    bloom_level?: true;
    _all?: true;
};
export type Quiz_itemsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.quiz_itemsWhereInput;
    orderBy?: Prisma.quiz_itemsOrderByWithRelationInput | Prisma.quiz_itemsOrderByWithRelationInput[];
    cursor?: Prisma.quiz_itemsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Quiz_itemsCountAggregateInputType;
    _avg?: Quiz_itemsAvgAggregateInputType;
    _sum?: Quiz_itemsSumAggregateInputType;
    _min?: Quiz_itemsMinAggregateInputType;
    _max?: Quiz_itemsMaxAggregateInputType;
};
export type GetQuiz_itemsAggregateType<T extends Quiz_itemsAggregateArgs> = {
    [P in keyof T & keyof AggregateQuiz_items]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateQuiz_items[P]> : Prisma.GetScalarType<T[P], AggregateQuiz_items[P]>;
};
export type quiz_itemsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.quiz_itemsWhereInput;
    orderBy?: Prisma.quiz_itemsOrderByWithAggregationInput | Prisma.quiz_itemsOrderByWithAggregationInput[];
    by: Prisma.Quiz_itemsScalarFieldEnum[] | Prisma.Quiz_itemsScalarFieldEnum;
    having?: Prisma.quiz_itemsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Quiz_itemsCountAggregateInputType | true;
    _avg?: Quiz_itemsAvgAggregateInputType;
    _sum?: Quiz_itemsSumAggregateInputType;
    _min?: Quiz_itemsMinAggregateInputType;
    _max?: Quiz_itemsMaxAggregateInputType;
};
export type Quiz_itemsGroupByOutputType = {
    id: string;
    document_id: string;
    primary_chunk_id: string;
    source_chunk_ids: string[];
    heading_path: string[];
    question: string;
    choices: string[];
    correct_index: number;
    explanation: string | null;
    difficulty: string;
    question_index: number;
    model_id: string | null;
    created_at: Date;
    lo_id: string | null;
    assessment_id: string | null;
    bloom_level: string | null;
    _count: Quiz_itemsCountAggregateOutputType | null;
    _avg: Quiz_itemsAvgAggregateOutputType | null;
    _sum: Quiz_itemsSumAggregateOutputType | null;
    _min: Quiz_itemsMinAggregateOutputType | null;
    _max: Quiz_itemsMaxAggregateOutputType | null;
};
export type GetQuiz_itemsGroupByPayload<T extends quiz_itemsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Quiz_itemsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Quiz_itemsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Quiz_itemsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Quiz_itemsGroupByOutputType[P]>;
}>>;
export type quiz_itemsWhereInput = {
    AND?: Prisma.quiz_itemsWhereInput | Prisma.quiz_itemsWhereInput[];
    OR?: Prisma.quiz_itemsWhereInput[];
    NOT?: Prisma.quiz_itemsWhereInput | Prisma.quiz_itemsWhereInput[];
    id?: Prisma.StringFilter<"quiz_items"> | string;
    document_id?: Prisma.StringFilter<"quiz_items"> | string;
    primary_chunk_id?: Prisma.StringFilter<"quiz_items"> | string;
    source_chunk_ids?: Prisma.StringNullableListFilter<"quiz_items">;
    heading_path?: Prisma.StringNullableListFilter<"quiz_items">;
    question?: Prisma.StringFilter<"quiz_items"> | string;
    choices?: Prisma.StringNullableListFilter<"quiz_items">;
    correct_index?: Prisma.IntFilter<"quiz_items"> | number;
    explanation?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    difficulty?: Prisma.StringFilter<"quiz_items"> | string;
    question_index?: Prisma.IntFilter<"quiz_items"> | number;
    model_id?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    created_at?: Prisma.DateTimeFilter<"quiz_items"> | Date | string;
    lo_id?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    assessment_id?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    bloom_level?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    assessments?: Prisma.XOR<Prisma.AssessmentsNullableScalarRelationFilter, Prisma.assessmentsWhereInput> | null;
    documents_metadata?: Prisma.XOR<Prisma.Documents_metadataScalarRelationFilter, Prisma.documents_metadataWhereInput>;
    learning_outcomes?: Prisma.XOR<Prisma.Learning_outcomesNullableScalarRelationFilter, Prisma.learning_outcomesWhereInput> | null;
    chunks_metadata?: Prisma.XOR<Prisma.Chunks_metadataScalarRelationFilter, Prisma.chunks_metadataWhereInput>;
};
export type quiz_itemsOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    primary_chunk_id?: Prisma.SortOrder;
    source_chunk_ids?: Prisma.SortOrder;
    heading_path?: Prisma.SortOrder;
    question?: Prisma.SortOrder;
    choices?: Prisma.SortOrder;
    correct_index?: Prisma.SortOrder;
    explanation?: Prisma.SortOrderInput | Prisma.SortOrder;
    difficulty?: Prisma.SortOrder;
    question_index?: Prisma.SortOrder;
    model_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    lo_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    assessment_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    bloom_level?: Prisma.SortOrderInput | Prisma.SortOrder;
    assessments?: Prisma.assessmentsOrderByWithRelationInput;
    documents_metadata?: Prisma.documents_metadataOrderByWithRelationInput;
    learning_outcomes?: Prisma.learning_outcomesOrderByWithRelationInput;
    chunks_metadata?: Prisma.chunks_metadataOrderByWithRelationInput;
};
export type quiz_itemsWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    document_id_primary_chunk_id_question_index?: Prisma.quiz_itemsDocument_idPrimary_chunk_idQuestion_indexCompoundUniqueInput;
    AND?: Prisma.quiz_itemsWhereInput | Prisma.quiz_itemsWhereInput[];
    OR?: Prisma.quiz_itemsWhereInput[];
    NOT?: Prisma.quiz_itemsWhereInput | Prisma.quiz_itemsWhereInput[];
    document_id?: Prisma.StringFilter<"quiz_items"> | string;
    primary_chunk_id?: Prisma.StringFilter<"quiz_items"> | string;
    source_chunk_ids?: Prisma.StringNullableListFilter<"quiz_items">;
    heading_path?: Prisma.StringNullableListFilter<"quiz_items">;
    question?: Prisma.StringFilter<"quiz_items"> | string;
    choices?: Prisma.StringNullableListFilter<"quiz_items">;
    correct_index?: Prisma.IntFilter<"quiz_items"> | number;
    explanation?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    difficulty?: Prisma.StringFilter<"quiz_items"> | string;
    question_index?: Prisma.IntFilter<"quiz_items"> | number;
    model_id?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    created_at?: Prisma.DateTimeFilter<"quiz_items"> | Date | string;
    lo_id?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    assessment_id?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    bloom_level?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    assessments?: Prisma.XOR<Prisma.AssessmentsNullableScalarRelationFilter, Prisma.assessmentsWhereInput> | null;
    documents_metadata?: Prisma.XOR<Prisma.Documents_metadataScalarRelationFilter, Prisma.documents_metadataWhereInput>;
    learning_outcomes?: Prisma.XOR<Prisma.Learning_outcomesNullableScalarRelationFilter, Prisma.learning_outcomesWhereInput> | null;
    chunks_metadata?: Prisma.XOR<Prisma.Chunks_metadataScalarRelationFilter, Prisma.chunks_metadataWhereInput>;
}, "id" | "document_id_primary_chunk_id_question_index">;
export type quiz_itemsOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    primary_chunk_id?: Prisma.SortOrder;
    source_chunk_ids?: Prisma.SortOrder;
    heading_path?: Prisma.SortOrder;
    question?: Prisma.SortOrder;
    choices?: Prisma.SortOrder;
    correct_index?: Prisma.SortOrder;
    explanation?: Prisma.SortOrderInput | Prisma.SortOrder;
    difficulty?: Prisma.SortOrder;
    question_index?: Prisma.SortOrder;
    model_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    lo_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    assessment_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    bloom_level?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.quiz_itemsCountOrderByAggregateInput;
    _avg?: Prisma.quiz_itemsAvgOrderByAggregateInput;
    _max?: Prisma.quiz_itemsMaxOrderByAggregateInput;
    _min?: Prisma.quiz_itemsMinOrderByAggregateInput;
    _sum?: Prisma.quiz_itemsSumOrderByAggregateInput;
};
export type quiz_itemsScalarWhereWithAggregatesInput = {
    AND?: Prisma.quiz_itemsScalarWhereWithAggregatesInput | Prisma.quiz_itemsScalarWhereWithAggregatesInput[];
    OR?: Prisma.quiz_itemsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.quiz_itemsScalarWhereWithAggregatesInput | Prisma.quiz_itemsScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"quiz_items"> | string;
    document_id?: Prisma.StringWithAggregatesFilter<"quiz_items"> | string;
    primary_chunk_id?: Prisma.StringWithAggregatesFilter<"quiz_items"> | string;
    source_chunk_ids?: Prisma.StringNullableListFilter<"quiz_items">;
    heading_path?: Prisma.StringNullableListFilter<"quiz_items">;
    question?: Prisma.StringWithAggregatesFilter<"quiz_items"> | string;
    choices?: Prisma.StringNullableListFilter<"quiz_items">;
    correct_index?: Prisma.IntWithAggregatesFilter<"quiz_items"> | number;
    explanation?: Prisma.StringNullableWithAggregatesFilter<"quiz_items"> | string | null;
    difficulty?: Prisma.StringWithAggregatesFilter<"quiz_items"> | string;
    question_index?: Prisma.IntWithAggregatesFilter<"quiz_items"> | number;
    model_id?: Prisma.StringNullableWithAggregatesFilter<"quiz_items"> | string | null;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"quiz_items"> | Date | string;
    lo_id?: Prisma.StringNullableWithAggregatesFilter<"quiz_items"> | string | null;
    assessment_id?: Prisma.StringNullableWithAggregatesFilter<"quiz_items"> | string | null;
    bloom_level?: Prisma.StringNullableWithAggregatesFilter<"quiz_items"> | string | null;
};
export type quiz_itemsCreateInput = {
    id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    bloom_level?: string | null;
    assessments?: Prisma.assessmentsCreateNestedOneWithoutQuiz_itemsInput;
    documents_metadata: Prisma.documents_metadataCreateNestedOneWithoutQuiz_itemsInput;
    learning_outcomes?: Prisma.learning_outcomesCreateNestedOneWithoutQuiz_itemsInput;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutQuiz_itemsInput;
};
export type quiz_itemsUncheckedCreateInput = {
    id: string;
    document_id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    lo_id?: string | null;
    assessment_id?: string | null;
    bloom_level?: string | null;
};
export type quiz_itemsUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    assessments?: Prisma.assessmentsUpdateOneWithoutQuiz_itemsNestedInput;
    documents_metadata?: Prisma.documents_metadataUpdateOneRequiredWithoutQuiz_itemsNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateOneWithoutQuiz_itemsNestedInput;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutQuiz_itemsNestedInput;
};
export type quiz_itemsUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lo_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    assessment_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type quiz_itemsCreateManyInput = {
    id: string;
    document_id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    lo_id?: string | null;
    assessment_id?: string | null;
    bloom_level?: string | null;
};
export type quiz_itemsUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type quiz_itemsUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lo_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    assessment_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type Quiz_itemsListRelationFilter = {
    every?: Prisma.quiz_itemsWhereInput;
    some?: Prisma.quiz_itemsWhereInput;
    none?: Prisma.quiz_itemsWhereInput;
};
export type quiz_itemsOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type quiz_itemsDocument_idPrimary_chunk_idQuestion_indexCompoundUniqueInput = {
    document_id: string;
    primary_chunk_id: string;
    question_index: number;
};
export type quiz_itemsCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    primary_chunk_id?: Prisma.SortOrder;
    source_chunk_ids?: Prisma.SortOrder;
    heading_path?: Prisma.SortOrder;
    question?: Prisma.SortOrder;
    choices?: Prisma.SortOrder;
    correct_index?: Prisma.SortOrder;
    explanation?: Prisma.SortOrder;
    difficulty?: Prisma.SortOrder;
    question_index?: Prisma.SortOrder;
    model_id?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    lo_id?: Prisma.SortOrder;
    assessment_id?: Prisma.SortOrder;
    bloom_level?: Prisma.SortOrder;
};
export type quiz_itemsAvgOrderByAggregateInput = {
    correct_index?: Prisma.SortOrder;
    question_index?: Prisma.SortOrder;
};
export type quiz_itemsMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    primary_chunk_id?: Prisma.SortOrder;
    question?: Prisma.SortOrder;
    correct_index?: Prisma.SortOrder;
    explanation?: Prisma.SortOrder;
    difficulty?: Prisma.SortOrder;
    question_index?: Prisma.SortOrder;
    model_id?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    lo_id?: Prisma.SortOrder;
    assessment_id?: Prisma.SortOrder;
    bloom_level?: Prisma.SortOrder;
};
export type quiz_itemsMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    primary_chunk_id?: Prisma.SortOrder;
    question?: Prisma.SortOrder;
    correct_index?: Prisma.SortOrder;
    explanation?: Prisma.SortOrder;
    difficulty?: Prisma.SortOrder;
    question_index?: Prisma.SortOrder;
    model_id?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    lo_id?: Prisma.SortOrder;
    assessment_id?: Prisma.SortOrder;
    bloom_level?: Prisma.SortOrder;
};
export type quiz_itemsSumOrderByAggregateInput = {
    correct_index?: Prisma.SortOrder;
    question_index?: Prisma.SortOrder;
};
export type quiz_itemsCreateNestedManyWithoutAssessmentsInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutAssessmentsInput, Prisma.quiz_itemsUncheckedCreateWithoutAssessmentsInput> | Prisma.quiz_itemsCreateWithoutAssessmentsInput[] | Prisma.quiz_itemsUncheckedCreateWithoutAssessmentsInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutAssessmentsInput | Prisma.quiz_itemsCreateOrConnectWithoutAssessmentsInput[];
    createMany?: Prisma.quiz_itemsCreateManyAssessmentsInputEnvelope;
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
};
export type quiz_itemsUncheckedCreateNestedManyWithoutAssessmentsInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutAssessmentsInput, Prisma.quiz_itemsUncheckedCreateWithoutAssessmentsInput> | Prisma.quiz_itemsCreateWithoutAssessmentsInput[] | Prisma.quiz_itemsUncheckedCreateWithoutAssessmentsInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutAssessmentsInput | Prisma.quiz_itemsCreateOrConnectWithoutAssessmentsInput[];
    createMany?: Prisma.quiz_itemsCreateManyAssessmentsInputEnvelope;
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
};
export type quiz_itemsUpdateManyWithoutAssessmentsNestedInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutAssessmentsInput, Prisma.quiz_itemsUncheckedCreateWithoutAssessmentsInput> | Prisma.quiz_itemsCreateWithoutAssessmentsInput[] | Prisma.quiz_itemsUncheckedCreateWithoutAssessmentsInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutAssessmentsInput | Prisma.quiz_itemsCreateOrConnectWithoutAssessmentsInput[];
    upsert?: Prisma.quiz_itemsUpsertWithWhereUniqueWithoutAssessmentsInput | Prisma.quiz_itemsUpsertWithWhereUniqueWithoutAssessmentsInput[];
    createMany?: Prisma.quiz_itemsCreateManyAssessmentsInputEnvelope;
    set?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    disconnect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    delete?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    update?: Prisma.quiz_itemsUpdateWithWhereUniqueWithoutAssessmentsInput | Prisma.quiz_itemsUpdateWithWhereUniqueWithoutAssessmentsInput[];
    updateMany?: Prisma.quiz_itemsUpdateManyWithWhereWithoutAssessmentsInput | Prisma.quiz_itemsUpdateManyWithWhereWithoutAssessmentsInput[];
    deleteMany?: Prisma.quiz_itemsScalarWhereInput | Prisma.quiz_itemsScalarWhereInput[];
};
export type quiz_itemsUncheckedUpdateManyWithoutAssessmentsNestedInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutAssessmentsInput, Prisma.quiz_itemsUncheckedCreateWithoutAssessmentsInput> | Prisma.quiz_itemsCreateWithoutAssessmentsInput[] | Prisma.quiz_itemsUncheckedCreateWithoutAssessmentsInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutAssessmentsInput | Prisma.quiz_itemsCreateOrConnectWithoutAssessmentsInput[];
    upsert?: Prisma.quiz_itemsUpsertWithWhereUniqueWithoutAssessmentsInput | Prisma.quiz_itemsUpsertWithWhereUniqueWithoutAssessmentsInput[];
    createMany?: Prisma.quiz_itemsCreateManyAssessmentsInputEnvelope;
    set?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    disconnect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    delete?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    update?: Prisma.quiz_itemsUpdateWithWhereUniqueWithoutAssessmentsInput | Prisma.quiz_itemsUpdateWithWhereUniqueWithoutAssessmentsInput[];
    updateMany?: Prisma.quiz_itemsUpdateManyWithWhereWithoutAssessmentsInput | Prisma.quiz_itemsUpdateManyWithWhereWithoutAssessmentsInput[];
    deleteMany?: Prisma.quiz_itemsScalarWhereInput | Prisma.quiz_itemsScalarWhereInput[];
};
export type quiz_itemsCreateNestedManyWithoutChunks_metadataInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutChunks_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutChunks_metadataInput> | Prisma.quiz_itemsCreateWithoutChunks_metadataInput[] | Prisma.quiz_itemsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutChunks_metadataInput | Prisma.quiz_itemsCreateOrConnectWithoutChunks_metadataInput[];
    createMany?: Prisma.quiz_itemsCreateManyChunks_metadataInputEnvelope;
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
};
export type quiz_itemsUncheckedCreateNestedManyWithoutChunks_metadataInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutChunks_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutChunks_metadataInput> | Prisma.quiz_itemsCreateWithoutChunks_metadataInput[] | Prisma.quiz_itemsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutChunks_metadataInput | Prisma.quiz_itemsCreateOrConnectWithoutChunks_metadataInput[];
    createMany?: Prisma.quiz_itemsCreateManyChunks_metadataInputEnvelope;
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
};
export type quiz_itemsUpdateManyWithoutChunks_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutChunks_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutChunks_metadataInput> | Prisma.quiz_itemsCreateWithoutChunks_metadataInput[] | Prisma.quiz_itemsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutChunks_metadataInput | Prisma.quiz_itemsCreateOrConnectWithoutChunks_metadataInput[];
    upsert?: Prisma.quiz_itemsUpsertWithWhereUniqueWithoutChunks_metadataInput | Prisma.quiz_itemsUpsertWithWhereUniqueWithoutChunks_metadataInput[];
    createMany?: Prisma.quiz_itemsCreateManyChunks_metadataInputEnvelope;
    set?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    disconnect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    delete?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    update?: Prisma.quiz_itemsUpdateWithWhereUniqueWithoutChunks_metadataInput | Prisma.quiz_itemsUpdateWithWhereUniqueWithoutChunks_metadataInput[];
    updateMany?: Prisma.quiz_itemsUpdateManyWithWhereWithoutChunks_metadataInput | Prisma.quiz_itemsUpdateManyWithWhereWithoutChunks_metadataInput[];
    deleteMany?: Prisma.quiz_itemsScalarWhereInput | Prisma.quiz_itemsScalarWhereInput[];
};
export type quiz_itemsUncheckedUpdateManyWithoutChunks_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutChunks_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutChunks_metadataInput> | Prisma.quiz_itemsCreateWithoutChunks_metadataInput[] | Prisma.quiz_itemsUncheckedCreateWithoutChunks_metadataInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutChunks_metadataInput | Prisma.quiz_itemsCreateOrConnectWithoutChunks_metadataInput[];
    upsert?: Prisma.quiz_itemsUpsertWithWhereUniqueWithoutChunks_metadataInput | Prisma.quiz_itemsUpsertWithWhereUniqueWithoutChunks_metadataInput[];
    createMany?: Prisma.quiz_itemsCreateManyChunks_metadataInputEnvelope;
    set?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    disconnect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    delete?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    update?: Prisma.quiz_itemsUpdateWithWhereUniqueWithoutChunks_metadataInput | Prisma.quiz_itemsUpdateWithWhereUniqueWithoutChunks_metadataInput[];
    updateMany?: Prisma.quiz_itemsUpdateManyWithWhereWithoutChunks_metadataInput | Prisma.quiz_itemsUpdateManyWithWhereWithoutChunks_metadataInput[];
    deleteMany?: Prisma.quiz_itemsScalarWhereInput | Prisma.quiz_itemsScalarWhereInput[];
};
export type quiz_itemsCreateNestedManyWithoutDocuments_metadataInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutDocuments_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutDocuments_metadataInput> | Prisma.quiz_itemsCreateWithoutDocuments_metadataInput[] | Prisma.quiz_itemsUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutDocuments_metadataInput | Prisma.quiz_itemsCreateOrConnectWithoutDocuments_metadataInput[];
    createMany?: Prisma.quiz_itemsCreateManyDocuments_metadataInputEnvelope;
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
};
export type quiz_itemsUncheckedCreateNestedManyWithoutDocuments_metadataInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutDocuments_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutDocuments_metadataInput> | Prisma.quiz_itemsCreateWithoutDocuments_metadataInput[] | Prisma.quiz_itemsUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutDocuments_metadataInput | Prisma.quiz_itemsCreateOrConnectWithoutDocuments_metadataInput[];
    createMany?: Prisma.quiz_itemsCreateManyDocuments_metadataInputEnvelope;
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
};
export type quiz_itemsUpdateManyWithoutDocuments_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutDocuments_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutDocuments_metadataInput> | Prisma.quiz_itemsCreateWithoutDocuments_metadataInput[] | Prisma.quiz_itemsUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutDocuments_metadataInput | Prisma.quiz_itemsCreateOrConnectWithoutDocuments_metadataInput[];
    upsert?: Prisma.quiz_itemsUpsertWithWhereUniqueWithoutDocuments_metadataInput | Prisma.quiz_itemsUpsertWithWhereUniqueWithoutDocuments_metadataInput[];
    createMany?: Prisma.quiz_itemsCreateManyDocuments_metadataInputEnvelope;
    set?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    disconnect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    delete?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    update?: Prisma.quiz_itemsUpdateWithWhereUniqueWithoutDocuments_metadataInput | Prisma.quiz_itemsUpdateWithWhereUniqueWithoutDocuments_metadataInput[];
    updateMany?: Prisma.quiz_itemsUpdateManyWithWhereWithoutDocuments_metadataInput | Prisma.quiz_itemsUpdateManyWithWhereWithoutDocuments_metadataInput[];
    deleteMany?: Prisma.quiz_itemsScalarWhereInput | Prisma.quiz_itemsScalarWhereInput[];
};
export type quiz_itemsUncheckedUpdateManyWithoutDocuments_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutDocuments_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutDocuments_metadataInput> | Prisma.quiz_itemsCreateWithoutDocuments_metadataInput[] | Prisma.quiz_itemsUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutDocuments_metadataInput | Prisma.quiz_itemsCreateOrConnectWithoutDocuments_metadataInput[];
    upsert?: Prisma.quiz_itemsUpsertWithWhereUniqueWithoutDocuments_metadataInput | Prisma.quiz_itemsUpsertWithWhereUniqueWithoutDocuments_metadataInput[];
    createMany?: Prisma.quiz_itemsCreateManyDocuments_metadataInputEnvelope;
    set?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    disconnect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    delete?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    update?: Prisma.quiz_itemsUpdateWithWhereUniqueWithoutDocuments_metadataInput | Prisma.quiz_itemsUpdateWithWhereUniqueWithoutDocuments_metadataInput[];
    updateMany?: Prisma.quiz_itemsUpdateManyWithWhereWithoutDocuments_metadataInput | Prisma.quiz_itemsUpdateManyWithWhereWithoutDocuments_metadataInput[];
    deleteMany?: Prisma.quiz_itemsScalarWhereInput | Prisma.quiz_itemsScalarWhereInput[];
};
export type quiz_itemsCreateNestedManyWithoutLearning_outcomesInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutLearning_outcomesInput, Prisma.quiz_itemsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.quiz_itemsCreateWithoutLearning_outcomesInput[] | Prisma.quiz_itemsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutLearning_outcomesInput | Prisma.quiz_itemsCreateOrConnectWithoutLearning_outcomesInput[];
    createMany?: Prisma.quiz_itemsCreateManyLearning_outcomesInputEnvelope;
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
};
export type quiz_itemsUncheckedCreateNestedManyWithoutLearning_outcomesInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutLearning_outcomesInput, Prisma.quiz_itemsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.quiz_itemsCreateWithoutLearning_outcomesInput[] | Prisma.quiz_itemsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutLearning_outcomesInput | Prisma.quiz_itemsCreateOrConnectWithoutLearning_outcomesInput[];
    createMany?: Prisma.quiz_itemsCreateManyLearning_outcomesInputEnvelope;
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
};
export type quiz_itemsUpdateManyWithoutLearning_outcomesNestedInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutLearning_outcomesInput, Prisma.quiz_itemsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.quiz_itemsCreateWithoutLearning_outcomesInput[] | Prisma.quiz_itemsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutLearning_outcomesInput | Prisma.quiz_itemsCreateOrConnectWithoutLearning_outcomesInput[];
    upsert?: Prisma.quiz_itemsUpsertWithWhereUniqueWithoutLearning_outcomesInput | Prisma.quiz_itemsUpsertWithWhereUniqueWithoutLearning_outcomesInput[];
    createMany?: Prisma.quiz_itemsCreateManyLearning_outcomesInputEnvelope;
    set?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    disconnect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    delete?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    update?: Prisma.quiz_itemsUpdateWithWhereUniqueWithoutLearning_outcomesInput | Prisma.quiz_itemsUpdateWithWhereUniqueWithoutLearning_outcomesInput[];
    updateMany?: Prisma.quiz_itemsUpdateManyWithWhereWithoutLearning_outcomesInput | Prisma.quiz_itemsUpdateManyWithWhereWithoutLearning_outcomesInput[];
    deleteMany?: Prisma.quiz_itemsScalarWhereInput | Prisma.quiz_itemsScalarWhereInput[];
};
export type quiz_itemsUncheckedUpdateManyWithoutLearning_outcomesNestedInput = {
    create?: Prisma.XOR<Prisma.quiz_itemsCreateWithoutLearning_outcomesInput, Prisma.quiz_itemsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.quiz_itemsCreateWithoutLearning_outcomesInput[] | Prisma.quiz_itemsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.quiz_itemsCreateOrConnectWithoutLearning_outcomesInput | Prisma.quiz_itemsCreateOrConnectWithoutLearning_outcomesInput[];
    upsert?: Prisma.quiz_itemsUpsertWithWhereUniqueWithoutLearning_outcomesInput | Prisma.quiz_itemsUpsertWithWhereUniqueWithoutLearning_outcomesInput[];
    createMany?: Prisma.quiz_itemsCreateManyLearning_outcomesInputEnvelope;
    set?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    disconnect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    delete?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    connect?: Prisma.quiz_itemsWhereUniqueInput | Prisma.quiz_itemsWhereUniqueInput[];
    update?: Prisma.quiz_itemsUpdateWithWhereUniqueWithoutLearning_outcomesInput | Prisma.quiz_itemsUpdateWithWhereUniqueWithoutLearning_outcomesInput[];
    updateMany?: Prisma.quiz_itemsUpdateManyWithWhereWithoutLearning_outcomesInput | Prisma.quiz_itemsUpdateManyWithWhereWithoutLearning_outcomesInput[];
    deleteMany?: Prisma.quiz_itemsScalarWhereInput | Prisma.quiz_itemsScalarWhereInput[];
};
export type quiz_itemsCreatesource_chunk_idsInput = {
    set: string[];
};
export type quiz_itemsCreateheading_pathInput = {
    set: string[];
};
export type quiz_itemsCreatechoicesInput = {
    set: string[];
};
export type quiz_itemsUpdatesource_chunk_idsInput = {
    set?: string[];
    push?: string | string[];
};
export type quiz_itemsUpdateheading_pathInput = {
    set?: string[];
    push?: string | string[];
};
export type quiz_itemsUpdatechoicesInput = {
    set?: string[];
    push?: string | string[];
};
export type quiz_itemsCreateWithoutAssessmentsInput = {
    id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    bloom_level?: string | null;
    documents_metadata: Prisma.documents_metadataCreateNestedOneWithoutQuiz_itemsInput;
    learning_outcomes?: Prisma.learning_outcomesCreateNestedOneWithoutQuiz_itemsInput;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutQuiz_itemsInput;
};
export type quiz_itemsUncheckedCreateWithoutAssessmentsInput = {
    id: string;
    document_id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    lo_id?: string | null;
    bloom_level?: string | null;
};
export type quiz_itemsCreateOrConnectWithoutAssessmentsInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    create: Prisma.XOR<Prisma.quiz_itemsCreateWithoutAssessmentsInput, Prisma.quiz_itemsUncheckedCreateWithoutAssessmentsInput>;
};
export type quiz_itemsCreateManyAssessmentsInputEnvelope = {
    data: Prisma.quiz_itemsCreateManyAssessmentsInput | Prisma.quiz_itemsCreateManyAssessmentsInput[];
    skipDuplicates?: boolean;
};
export type quiz_itemsUpsertWithWhereUniqueWithoutAssessmentsInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    update: Prisma.XOR<Prisma.quiz_itemsUpdateWithoutAssessmentsInput, Prisma.quiz_itemsUncheckedUpdateWithoutAssessmentsInput>;
    create: Prisma.XOR<Prisma.quiz_itemsCreateWithoutAssessmentsInput, Prisma.quiz_itemsUncheckedCreateWithoutAssessmentsInput>;
};
export type quiz_itemsUpdateWithWhereUniqueWithoutAssessmentsInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    data: Prisma.XOR<Prisma.quiz_itemsUpdateWithoutAssessmentsInput, Prisma.quiz_itemsUncheckedUpdateWithoutAssessmentsInput>;
};
export type quiz_itemsUpdateManyWithWhereWithoutAssessmentsInput = {
    where: Prisma.quiz_itemsScalarWhereInput;
    data: Prisma.XOR<Prisma.quiz_itemsUpdateManyMutationInput, Prisma.quiz_itemsUncheckedUpdateManyWithoutAssessmentsInput>;
};
export type quiz_itemsScalarWhereInput = {
    AND?: Prisma.quiz_itemsScalarWhereInput | Prisma.quiz_itemsScalarWhereInput[];
    OR?: Prisma.quiz_itemsScalarWhereInput[];
    NOT?: Prisma.quiz_itemsScalarWhereInput | Prisma.quiz_itemsScalarWhereInput[];
    id?: Prisma.StringFilter<"quiz_items"> | string;
    document_id?: Prisma.StringFilter<"quiz_items"> | string;
    primary_chunk_id?: Prisma.StringFilter<"quiz_items"> | string;
    source_chunk_ids?: Prisma.StringNullableListFilter<"quiz_items">;
    heading_path?: Prisma.StringNullableListFilter<"quiz_items">;
    question?: Prisma.StringFilter<"quiz_items"> | string;
    choices?: Prisma.StringNullableListFilter<"quiz_items">;
    correct_index?: Prisma.IntFilter<"quiz_items"> | number;
    explanation?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    difficulty?: Prisma.StringFilter<"quiz_items"> | string;
    question_index?: Prisma.IntFilter<"quiz_items"> | number;
    model_id?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    created_at?: Prisma.DateTimeFilter<"quiz_items"> | Date | string;
    lo_id?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    assessment_id?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
    bloom_level?: Prisma.StringNullableFilter<"quiz_items"> | string | null;
};
export type quiz_itemsCreateWithoutChunks_metadataInput = {
    id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    bloom_level?: string | null;
    assessments?: Prisma.assessmentsCreateNestedOneWithoutQuiz_itemsInput;
    documents_metadata: Prisma.documents_metadataCreateNestedOneWithoutQuiz_itemsInput;
    learning_outcomes?: Prisma.learning_outcomesCreateNestedOneWithoutQuiz_itemsInput;
};
export type quiz_itemsUncheckedCreateWithoutChunks_metadataInput = {
    id: string;
    document_id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    lo_id?: string | null;
    assessment_id?: string | null;
    bloom_level?: string | null;
};
export type quiz_itemsCreateOrConnectWithoutChunks_metadataInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    create: Prisma.XOR<Prisma.quiz_itemsCreateWithoutChunks_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutChunks_metadataInput>;
};
export type quiz_itemsCreateManyChunks_metadataInputEnvelope = {
    data: Prisma.quiz_itemsCreateManyChunks_metadataInput | Prisma.quiz_itemsCreateManyChunks_metadataInput[];
    skipDuplicates?: boolean;
};
export type quiz_itemsUpsertWithWhereUniqueWithoutChunks_metadataInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    update: Prisma.XOR<Prisma.quiz_itemsUpdateWithoutChunks_metadataInput, Prisma.quiz_itemsUncheckedUpdateWithoutChunks_metadataInput>;
    create: Prisma.XOR<Prisma.quiz_itemsCreateWithoutChunks_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutChunks_metadataInput>;
};
export type quiz_itemsUpdateWithWhereUniqueWithoutChunks_metadataInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    data: Prisma.XOR<Prisma.quiz_itemsUpdateWithoutChunks_metadataInput, Prisma.quiz_itemsUncheckedUpdateWithoutChunks_metadataInput>;
};
export type quiz_itemsUpdateManyWithWhereWithoutChunks_metadataInput = {
    where: Prisma.quiz_itemsScalarWhereInput;
    data: Prisma.XOR<Prisma.quiz_itemsUpdateManyMutationInput, Prisma.quiz_itemsUncheckedUpdateManyWithoutChunks_metadataInput>;
};
export type quiz_itemsCreateWithoutDocuments_metadataInput = {
    id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    bloom_level?: string | null;
    assessments?: Prisma.assessmentsCreateNestedOneWithoutQuiz_itemsInput;
    learning_outcomes?: Prisma.learning_outcomesCreateNestedOneWithoutQuiz_itemsInput;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutQuiz_itemsInput;
};
export type quiz_itemsUncheckedCreateWithoutDocuments_metadataInput = {
    id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    lo_id?: string | null;
    assessment_id?: string | null;
    bloom_level?: string | null;
};
export type quiz_itemsCreateOrConnectWithoutDocuments_metadataInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    create: Prisma.XOR<Prisma.quiz_itemsCreateWithoutDocuments_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutDocuments_metadataInput>;
};
export type quiz_itemsCreateManyDocuments_metadataInputEnvelope = {
    data: Prisma.quiz_itemsCreateManyDocuments_metadataInput | Prisma.quiz_itemsCreateManyDocuments_metadataInput[];
    skipDuplicates?: boolean;
};
export type quiz_itemsUpsertWithWhereUniqueWithoutDocuments_metadataInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    update: Prisma.XOR<Prisma.quiz_itemsUpdateWithoutDocuments_metadataInput, Prisma.quiz_itemsUncheckedUpdateWithoutDocuments_metadataInput>;
    create: Prisma.XOR<Prisma.quiz_itemsCreateWithoutDocuments_metadataInput, Prisma.quiz_itemsUncheckedCreateWithoutDocuments_metadataInput>;
};
export type quiz_itemsUpdateWithWhereUniqueWithoutDocuments_metadataInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    data: Prisma.XOR<Prisma.quiz_itemsUpdateWithoutDocuments_metadataInput, Prisma.quiz_itemsUncheckedUpdateWithoutDocuments_metadataInput>;
};
export type quiz_itemsUpdateManyWithWhereWithoutDocuments_metadataInput = {
    where: Prisma.quiz_itemsScalarWhereInput;
    data: Prisma.XOR<Prisma.quiz_itemsUpdateManyMutationInput, Prisma.quiz_itemsUncheckedUpdateManyWithoutDocuments_metadataInput>;
};
export type quiz_itemsCreateWithoutLearning_outcomesInput = {
    id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    bloom_level?: string | null;
    assessments?: Prisma.assessmentsCreateNestedOneWithoutQuiz_itemsInput;
    documents_metadata: Prisma.documents_metadataCreateNestedOneWithoutQuiz_itemsInput;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutQuiz_itemsInput;
};
export type quiz_itemsUncheckedCreateWithoutLearning_outcomesInput = {
    id: string;
    document_id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    assessment_id?: string | null;
    bloom_level?: string | null;
};
export type quiz_itemsCreateOrConnectWithoutLearning_outcomesInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    create: Prisma.XOR<Prisma.quiz_itemsCreateWithoutLearning_outcomesInput, Prisma.quiz_itemsUncheckedCreateWithoutLearning_outcomesInput>;
};
export type quiz_itemsCreateManyLearning_outcomesInputEnvelope = {
    data: Prisma.quiz_itemsCreateManyLearning_outcomesInput | Prisma.quiz_itemsCreateManyLearning_outcomesInput[];
    skipDuplicates?: boolean;
};
export type quiz_itemsUpsertWithWhereUniqueWithoutLearning_outcomesInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    update: Prisma.XOR<Prisma.quiz_itemsUpdateWithoutLearning_outcomesInput, Prisma.quiz_itemsUncheckedUpdateWithoutLearning_outcomesInput>;
    create: Prisma.XOR<Prisma.quiz_itemsCreateWithoutLearning_outcomesInput, Prisma.quiz_itemsUncheckedCreateWithoutLearning_outcomesInput>;
};
export type quiz_itemsUpdateWithWhereUniqueWithoutLearning_outcomesInput = {
    where: Prisma.quiz_itemsWhereUniqueInput;
    data: Prisma.XOR<Prisma.quiz_itemsUpdateWithoutLearning_outcomesInput, Prisma.quiz_itemsUncheckedUpdateWithoutLearning_outcomesInput>;
};
export type quiz_itemsUpdateManyWithWhereWithoutLearning_outcomesInput = {
    where: Prisma.quiz_itemsScalarWhereInput;
    data: Prisma.XOR<Prisma.quiz_itemsUpdateManyMutationInput, Prisma.quiz_itemsUncheckedUpdateManyWithoutLearning_outcomesInput>;
};
export type quiz_itemsCreateManyAssessmentsInput = {
    id: string;
    document_id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    lo_id?: string | null;
    bloom_level?: string | null;
};
export type quiz_itemsUpdateWithoutAssessmentsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    documents_metadata?: Prisma.documents_metadataUpdateOneRequiredWithoutQuiz_itemsNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateOneWithoutQuiz_itemsNestedInput;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutQuiz_itemsNestedInput;
};
export type quiz_itemsUncheckedUpdateWithoutAssessmentsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lo_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type quiz_itemsUncheckedUpdateManyWithoutAssessmentsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lo_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type quiz_itemsCreateManyChunks_metadataInput = {
    id: string;
    document_id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    lo_id?: string | null;
    assessment_id?: string | null;
    bloom_level?: string | null;
};
export type quiz_itemsUpdateWithoutChunks_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    assessments?: Prisma.assessmentsUpdateOneWithoutQuiz_itemsNestedInput;
    documents_metadata?: Prisma.documents_metadataUpdateOneRequiredWithoutQuiz_itemsNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateOneWithoutQuiz_itemsNestedInput;
};
export type quiz_itemsUncheckedUpdateWithoutChunks_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lo_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    assessment_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type quiz_itemsUncheckedUpdateManyWithoutChunks_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lo_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    assessment_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type quiz_itemsCreateManyDocuments_metadataInput = {
    id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    lo_id?: string | null;
    assessment_id?: string | null;
    bloom_level?: string | null;
};
export type quiz_itemsUpdateWithoutDocuments_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    assessments?: Prisma.assessmentsUpdateOneWithoutQuiz_itemsNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateOneWithoutQuiz_itemsNestedInput;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutQuiz_itemsNestedInput;
};
export type quiz_itemsUncheckedUpdateWithoutDocuments_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lo_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    assessment_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type quiz_itemsUncheckedUpdateManyWithoutDocuments_metadataInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lo_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    assessment_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type quiz_itemsCreateManyLearning_outcomesInput = {
    id: string;
    document_id: string;
    primary_chunk_id: string;
    source_chunk_ids?: Prisma.quiz_itemsCreatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsCreateheading_pathInput | string[];
    question: string;
    choices?: Prisma.quiz_itemsCreatechoicesInput | string[];
    correct_index: number;
    explanation?: string | null;
    difficulty?: string;
    question_index?: number;
    model_id?: string | null;
    created_at?: Date | string;
    assessment_id?: string | null;
    bloom_level?: string | null;
};
export type quiz_itemsUpdateWithoutLearning_outcomesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    assessments?: Prisma.assessmentsUpdateOneWithoutQuiz_itemsNestedInput;
    documents_metadata?: Prisma.documents_metadataUpdateOneRequiredWithoutQuiz_itemsNestedInput;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutQuiz_itemsNestedInput;
};
export type quiz_itemsUncheckedUpdateWithoutLearning_outcomesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessment_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type quiz_itemsUncheckedUpdateManyWithoutLearning_outcomesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    primary_chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    source_chunk_ids?: Prisma.quiz_itemsUpdatesource_chunk_idsInput | string[];
    heading_path?: Prisma.quiz_itemsUpdateheading_pathInput | string[];
    question?: Prisma.StringFieldUpdateOperationsInput | string;
    choices?: Prisma.quiz_itemsUpdatechoicesInput | string[];
    correct_index?: Prisma.IntFieldUpdateOperationsInput | number;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    difficulty?: Prisma.StringFieldUpdateOperationsInput | string;
    question_index?: Prisma.IntFieldUpdateOperationsInput | number;
    model_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessment_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type quiz_itemsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    document_id?: boolean;
    primary_chunk_id?: boolean;
    source_chunk_ids?: boolean;
    heading_path?: boolean;
    question?: boolean;
    choices?: boolean;
    correct_index?: boolean;
    explanation?: boolean;
    difficulty?: boolean;
    question_index?: boolean;
    model_id?: boolean;
    created_at?: boolean;
    lo_id?: boolean;
    assessment_id?: boolean;
    bloom_level?: boolean;
    assessments?: boolean | Prisma.quiz_items$assessmentsArgs<ExtArgs>;
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.quiz_items$learning_outcomesArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["quiz_items"]>;
export type quiz_itemsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    document_id?: boolean;
    primary_chunk_id?: boolean;
    source_chunk_ids?: boolean;
    heading_path?: boolean;
    question?: boolean;
    choices?: boolean;
    correct_index?: boolean;
    explanation?: boolean;
    difficulty?: boolean;
    question_index?: boolean;
    model_id?: boolean;
    created_at?: boolean;
    lo_id?: boolean;
    assessment_id?: boolean;
    bloom_level?: boolean;
    assessments?: boolean | Prisma.quiz_items$assessmentsArgs<ExtArgs>;
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.quiz_items$learning_outcomesArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["quiz_items"]>;
export type quiz_itemsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    document_id?: boolean;
    primary_chunk_id?: boolean;
    source_chunk_ids?: boolean;
    heading_path?: boolean;
    question?: boolean;
    choices?: boolean;
    correct_index?: boolean;
    explanation?: boolean;
    difficulty?: boolean;
    question_index?: boolean;
    model_id?: boolean;
    created_at?: boolean;
    lo_id?: boolean;
    assessment_id?: boolean;
    bloom_level?: boolean;
    assessments?: boolean | Prisma.quiz_items$assessmentsArgs<ExtArgs>;
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.quiz_items$learning_outcomesArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["quiz_items"]>;
export type quiz_itemsSelectScalar = {
    id?: boolean;
    document_id?: boolean;
    primary_chunk_id?: boolean;
    source_chunk_ids?: boolean;
    heading_path?: boolean;
    question?: boolean;
    choices?: boolean;
    correct_index?: boolean;
    explanation?: boolean;
    difficulty?: boolean;
    question_index?: boolean;
    model_id?: boolean;
    created_at?: boolean;
    lo_id?: boolean;
    assessment_id?: boolean;
    bloom_level?: boolean;
};
export type quiz_itemsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "document_id" | "primary_chunk_id" | "source_chunk_ids" | "heading_path" | "question" | "choices" | "correct_index" | "explanation" | "difficulty" | "question_index" | "model_id" | "created_at" | "lo_id" | "assessment_id" | "bloom_level", ExtArgs["result"]["quiz_items"]>;
export type quiz_itemsInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    assessments?: boolean | Prisma.quiz_items$assessmentsArgs<ExtArgs>;
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.quiz_items$learning_outcomesArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
};
export type quiz_itemsIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    assessments?: boolean | Prisma.quiz_items$assessmentsArgs<ExtArgs>;
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.quiz_items$learning_outcomesArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
};
export type quiz_itemsIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    assessments?: boolean | Prisma.quiz_items$assessmentsArgs<ExtArgs>;
    documents_metadata?: boolean | Prisma.documents_metadataDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.quiz_items$learning_outcomesArgs<ExtArgs>;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
};
export type $quiz_itemsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "quiz_items";
    objects: {
        assessments: Prisma.$assessmentsPayload<ExtArgs> | null;
        documents_metadata: Prisma.$documents_metadataPayload<ExtArgs>;
        learning_outcomes: Prisma.$learning_outcomesPayload<ExtArgs> | null;
        chunks_metadata: Prisma.$chunks_metadataPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        document_id: string;
        primary_chunk_id: string;
        source_chunk_ids: string[];
        heading_path: string[];
        question: string;
        choices: string[];
        correct_index: number;
        explanation: string | null;
        difficulty: string;
        question_index: number;
        model_id: string | null;
        created_at: Date;
        lo_id: string | null;
        assessment_id: string | null;
        bloom_level: string | null;
    }, ExtArgs["result"]["quiz_items"]>;
    composites: {};
};
export type quiz_itemsGetPayload<S extends boolean | null | undefined | quiz_itemsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload, S>;
export type quiz_itemsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<quiz_itemsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Quiz_itemsCountAggregateInputType | true;
};
export interface quiz_itemsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['quiz_items'];
        meta: {
            name: 'quiz_items';
        };
    };
    findUnique<T extends quiz_itemsFindUniqueArgs>(args: Prisma.SelectSubset<T, quiz_itemsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__quiz_itemsClient<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends quiz_itemsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, quiz_itemsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__quiz_itemsClient<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends quiz_itemsFindFirstArgs>(args?: Prisma.SelectSubset<T, quiz_itemsFindFirstArgs<ExtArgs>>): Prisma.Prisma__quiz_itemsClient<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends quiz_itemsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, quiz_itemsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__quiz_itemsClient<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends quiz_itemsFindManyArgs>(args?: Prisma.SelectSubset<T, quiz_itemsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends quiz_itemsCreateArgs>(args: Prisma.SelectSubset<T, quiz_itemsCreateArgs<ExtArgs>>): Prisma.Prisma__quiz_itemsClient<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends quiz_itemsCreateManyArgs>(args?: Prisma.SelectSubset<T, quiz_itemsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends quiz_itemsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, quiz_itemsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends quiz_itemsDeleteArgs>(args: Prisma.SelectSubset<T, quiz_itemsDeleteArgs<ExtArgs>>): Prisma.Prisma__quiz_itemsClient<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends quiz_itemsUpdateArgs>(args: Prisma.SelectSubset<T, quiz_itemsUpdateArgs<ExtArgs>>): Prisma.Prisma__quiz_itemsClient<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends quiz_itemsDeleteManyArgs>(args?: Prisma.SelectSubset<T, quiz_itemsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends quiz_itemsUpdateManyArgs>(args: Prisma.SelectSubset<T, quiz_itemsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends quiz_itemsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, quiz_itemsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends quiz_itemsUpsertArgs>(args: Prisma.SelectSubset<T, quiz_itemsUpsertArgs<ExtArgs>>): Prisma.Prisma__quiz_itemsClient<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends quiz_itemsCountArgs>(args?: Prisma.Subset<T, quiz_itemsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Quiz_itemsCountAggregateOutputType> : number>;
    aggregate<T extends Quiz_itemsAggregateArgs>(args: Prisma.Subset<T, Quiz_itemsAggregateArgs>): Prisma.PrismaPromise<GetQuiz_itemsAggregateType<T>>;
    groupBy<T extends quiz_itemsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: quiz_itemsGroupByArgs['orderBy'];
    } : {
        orderBy?: quiz_itemsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, quiz_itemsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuiz_itemsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: quiz_itemsFieldRefs;
}
export interface Prisma__quiz_itemsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    assessments<T extends Prisma.quiz_items$assessmentsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.quiz_items$assessmentsArgs<ExtArgs>>): Prisma.Prisma__assessmentsClient<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    documents_metadata<T extends Prisma.documents_metadataDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.documents_metadataDefaultArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    learning_outcomes<T extends Prisma.quiz_items$learning_outcomesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.quiz_items$learning_outcomesArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    chunks_metadata<T extends Prisma.chunks_metadataDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.chunks_metadataDefaultArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface quiz_itemsFieldRefs {
    readonly id: Prisma.FieldRef<"quiz_items", 'String'>;
    readonly document_id: Prisma.FieldRef<"quiz_items", 'String'>;
    readonly primary_chunk_id: Prisma.FieldRef<"quiz_items", 'String'>;
    readonly source_chunk_ids: Prisma.FieldRef<"quiz_items", 'String[]'>;
    readonly heading_path: Prisma.FieldRef<"quiz_items", 'String[]'>;
    readonly question: Prisma.FieldRef<"quiz_items", 'String'>;
    readonly choices: Prisma.FieldRef<"quiz_items", 'String[]'>;
    readonly correct_index: Prisma.FieldRef<"quiz_items", 'Int'>;
    readonly explanation: Prisma.FieldRef<"quiz_items", 'String'>;
    readonly difficulty: Prisma.FieldRef<"quiz_items", 'String'>;
    readonly question_index: Prisma.FieldRef<"quiz_items", 'Int'>;
    readonly model_id: Prisma.FieldRef<"quiz_items", 'String'>;
    readonly created_at: Prisma.FieldRef<"quiz_items", 'DateTime'>;
    readonly lo_id: Prisma.FieldRef<"quiz_items", 'String'>;
    readonly assessment_id: Prisma.FieldRef<"quiz_items", 'String'>;
    readonly bloom_level: Prisma.FieldRef<"quiz_items", 'String'>;
}
export type quiz_itemsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.quiz_itemsSelect<ExtArgs> | null;
    omit?: Prisma.quiz_itemsOmit<ExtArgs> | null;
    include?: Prisma.quiz_itemsInclude<ExtArgs> | null;
    where: Prisma.quiz_itemsWhereUniqueInput;
};
export type quiz_itemsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.quiz_itemsSelect<ExtArgs> | null;
    omit?: Prisma.quiz_itemsOmit<ExtArgs> | null;
    include?: Prisma.quiz_itemsInclude<ExtArgs> | null;
    where: Prisma.quiz_itemsWhereUniqueInput;
};
export type quiz_itemsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type quiz_itemsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type quiz_itemsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type quiz_itemsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.quiz_itemsSelect<ExtArgs> | null;
    omit?: Prisma.quiz_itemsOmit<ExtArgs> | null;
    include?: Prisma.quiz_itemsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.quiz_itemsCreateInput, Prisma.quiz_itemsUncheckedCreateInput>;
};
export type quiz_itemsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.quiz_itemsCreateManyInput | Prisma.quiz_itemsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type quiz_itemsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.quiz_itemsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.quiz_itemsOmit<ExtArgs> | null;
    data: Prisma.quiz_itemsCreateManyInput | Prisma.quiz_itemsCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.quiz_itemsIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type quiz_itemsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.quiz_itemsSelect<ExtArgs> | null;
    omit?: Prisma.quiz_itemsOmit<ExtArgs> | null;
    include?: Prisma.quiz_itemsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.quiz_itemsUpdateInput, Prisma.quiz_itemsUncheckedUpdateInput>;
    where: Prisma.quiz_itemsWhereUniqueInput;
};
export type quiz_itemsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.quiz_itemsUpdateManyMutationInput, Prisma.quiz_itemsUncheckedUpdateManyInput>;
    where?: Prisma.quiz_itemsWhereInput;
    limit?: number;
};
export type quiz_itemsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.quiz_itemsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.quiz_itemsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.quiz_itemsUpdateManyMutationInput, Prisma.quiz_itemsUncheckedUpdateManyInput>;
    where?: Prisma.quiz_itemsWhereInput;
    limit?: number;
    include?: Prisma.quiz_itemsIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type quiz_itemsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.quiz_itemsSelect<ExtArgs> | null;
    omit?: Prisma.quiz_itemsOmit<ExtArgs> | null;
    include?: Prisma.quiz_itemsInclude<ExtArgs> | null;
    where: Prisma.quiz_itemsWhereUniqueInput;
    create: Prisma.XOR<Prisma.quiz_itemsCreateInput, Prisma.quiz_itemsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.quiz_itemsUpdateInput, Prisma.quiz_itemsUncheckedUpdateInput>;
};
export type quiz_itemsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.quiz_itemsSelect<ExtArgs> | null;
    omit?: Prisma.quiz_itemsOmit<ExtArgs> | null;
    include?: Prisma.quiz_itemsInclude<ExtArgs> | null;
    where: Prisma.quiz_itemsWhereUniqueInput;
};
export type quiz_itemsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.quiz_itemsWhereInput;
    limit?: number;
};
export type quiz_items$assessmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
    where?: Prisma.assessmentsWhereInput;
};
export type quiz_items$learning_outcomesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
    where?: Prisma.learning_outcomesWhereInput;
};
export type quiz_itemsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.quiz_itemsSelect<ExtArgs> | null;
    omit?: Prisma.quiz_itemsOmit<ExtArgs> | null;
    include?: Prisma.quiz_itemsInclude<ExtArgs> | null;
};
