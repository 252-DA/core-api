import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type learning_outcomesModel = runtime.Types.Result.DefaultSelection<Prisma.$learning_outcomesPayload>;
export type AggregateLearning_outcomes = {
    _count: Learning_outcomesCountAggregateOutputType | null;
    _avg: Learning_outcomesAvgAggregateOutputType | null;
    _sum: Learning_outcomesSumAggregateOutputType | null;
    _min: Learning_outcomesMinAggregateOutputType | null;
    _max: Learning_outcomesMaxAggregateOutputType | null;
};
export type Learning_outcomesAvgAggregateOutputType = {
    cdio_level: number | null;
};
export type Learning_outcomesSumAggregateOutputType = {
    cdio_level: number | null;
};
export type Learning_outcomesMinAggregateOutputType = {
    lo_id: string | null;
    course_id: string | null;
    code: string | null;
    parent_code: string | null;
    statement_vi: string | null;
    statement_en: string | null;
    bloom_level: string | null;
    cdio_level: number | null;
};
export type Learning_outcomesMaxAggregateOutputType = {
    lo_id: string | null;
    course_id: string | null;
    code: string | null;
    parent_code: string | null;
    statement_vi: string | null;
    statement_en: string | null;
    bloom_level: string | null;
    cdio_level: number | null;
};
export type Learning_outcomesCountAggregateOutputType = {
    lo_id: number;
    course_id: number;
    code: number;
    parent_code: number;
    statement_vi: number;
    statement_en: number;
    bloom_level: number;
    cdio_level: number;
    _all: number;
};
export type Learning_outcomesAvgAggregateInputType = {
    cdio_level?: true;
};
export type Learning_outcomesSumAggregateInputType = {
    cdio_level?: true;
};
export type Learning_outcomesMinAggregateInputType = {
    lo_id?: true;
    course_id?: true;
    code?: true;
    parent_code?: true;
    statement_vi?: true;
    statement_en?: true;
    bloom_level?: true;
    cdio_level?: true;
};
export type Learning_outcomesMaxAggregateInputType = {
    lo_id?: true;
    course_id?: true;
    code?: true;
    parent_code?: true;
    statement_vi?: true;
    statement_en?: true;
    bloom_level?: true;
    cdio_level?: true;
};
export type Learning_outcomesCountAggregateInputType = {
    lo_id?: true;
    course_id?: true;
    code?: true;
    parent_code?: true;
    statement_vi?: true;
    statement_en?: true;
    bloom_level?: true;
    cdio_level?: true;
    _all?: true;
};
export type Learning_outcomesAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.learning_outcomesWhereInput;
    orderBy?: Prisma.learning_outcomesOrderByWithRelationInput | Prisma.learning_outcomesOrderByWithRelationInput[];
    cursor?: Prisma.learning_outcomesWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Learning_outcomesCountAggregateInputType;
    _avg?: Learning_outcomesAvgAggregateInputType;
    _sum?: Learning_outcomesSumAggregateInputType;
    _min?: Learning_outcomesMinAggregateInputType;
    _max?: Learning_outcomesMaxAggregateInputType;
};
export type GetLearning_outcomesAggregateType<T extends Learning_outcomesAggregateArgs> = {
    [P in keyof T & keyof AggregateLearning_outcomes]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateLearning_outcomes[P]> : Prisma.GetScalarType<T[P], AggregateLearning_outcomes[P]>;
};
export type learning_outcomesGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.learning_outcomesWhereInput;
    orderBy?: Prisma.learning_outcomesOrderByWithAggregationInput | Prisma.learning_outcomesOrderByWithAggregationInput[];
    by: Prisma.Learning_outcomesScalarFieldEnum[] | Prisma.Learning_outcomesScalarFieldEnum;
    having?: Prisma.learning_outcomesScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Learning_outcomesCountAggregateInputType | true;
    _avg?: Learning_outcomesAvgAggregateInputType;
    _sum?: Learning_outcomesSumAggregateInputType;
    _min?: Learning_outcomesMinAggregateInputType;
    _max?: Learning_outcomesMaxAggregateInputType;
};
export type Learning_outcomesGroupByOutputType = {
    lo_id: string;
    course_id: string;
    code: string;
    parent_code: string | null;
    statement_vi: string;
    statement_en: string | null;
    bloom_level: string | null;
    cdio_level: number | null;
    _count: Learning_outcomesCountAggregateOutputType | null;
    _avg: Learning_outcomesAvgAggregateOutputType | null;
    _sum: Learning_outcomesSumAggregateOutputType | null;
    _min: Learning_outcomesMinAggregateOutputType | null;
    _max: Learning_outcomesMaxAggregateOutputType | null;
};
export type GetLearning_outcomesGroupByPayload<T extends learning_outcomesGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Learning_outcomesGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Learning_outcomesGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Learning_outcomesGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Learning_outcomesGroupByOutputType[P]>;
}>>;
export type learning_outcomesWhereInput = {
    AND?: Prisma.learning_outcomesWhereInput | Prisma.learning_outcomesWhereInput[];
    OR?: Prisma.learning_outcomesWhereInput[];
    NOT?: Prisma.learning_outcomesWhereInput | Prisma.learning_outcomesWhereInput[];
    lo_id?: Prisma.StringFilter<"learning_outcomes"> | string;
    course_id?: Prisma.StringFilter<"learning_outcomes"> | string;
    code?: Prisma.StringFilter<"learning_outcomes"> | string;
    parent_code?: Prisma.StringNullableFilter<"learning_outcomes"> | string | null;
    statement_vi?: Prisma.StringFilter<"learning_outcomes"> | string;
    statement_en?: Prisma.StringNullableFilter<"learning_outcomes"> | string | null;
    bloom_level?: Prisma.StringNullableFilter<"learning_outcomes"> | string | null;
    cdio_level?: Prisma.IntNullableFilter<"learning_outcomes"> | number | null;
    chunk_lo_mappings?: Prisma.Chunk_lo_mappingsListRelationFilter;
    courses?: Prisma.XOR<Prisma.CoursesScalarRelationFilter, Prisma.coursesWhereInput>;
    lo_assessments?: Prisma.Lo_assessmentsListRelationFilter;
    quiz_items?: Prisma.Quiz_itemsListRelationFilter;
};
export type learning_outcomesOrderByWithRelationInput = {
    lo_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    parent_code?: Prisma.SortOrderInput | Prisma.SortOrder;
    statement_vi?: Prisma.SortOrder;
    statement_en?: Prisma.SortOrderInput | Prisma.SortOrder;
    bloom_level?: Prisma.SortOrderInput | Prisma.SortOrder;
    cdio_level?: Prisma.SortOrderInput | Prisma.SortOrder;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsOrderByRelationAggregateInput;
    courses?: Prisma.coursesOrderByWithRelationInput;
    lo_assessments?: Prisma.lo_assessmentsOrderByRelationAggregateInput;
    quiz_items?: Prisma.quiz_itemsOrderByRelationAggregateInput;
};
export type learning_outcomesWhereUniqueInput = Prisma.AtLeast<{
    lo_id?: string;
    course_id_code?: Prisma.learning_outcomesCourse_idCodeCompoundUniqueInput;
    AND?: Prisma.learning_outcomesWhereInput | Prisma.learning_outcomesWhereInput[];
    OR?: Prisma.learning_outcomesWhereInput[];
    NOT?: Prisma.learning_outcomesWhereInput | Prisma.learning_outcomesWhereInput[];
    course_id?: Prisma.StringFilter<"learning_outcomes"> | string;
    code?: Prisma.StringFilter<"learning_outcomes"> | string;
    parent_code?: Prisma.StringNullableFilter<"learning_outcomes"> | string | null;
    statement_vi?: Prisma.StringFilter<"learning_outcomes"> | string;
    statement_en?: Prisma.StringNullableFilter<"learning_outcomes"> | string | null;
    bloom_level?: Prisma.StringNullableFilter<"learning_outcomes"> | string | null;
    cdio_level?: Prisma.IntNullableFilter<"learning_outcomes"> | number | null;
    chunk_lo_mappings?: Prisma.Chunk_lo_mappingsListRelationFilter;
    courses?: Prisma.XOR<Prisma.CoursesScalarRelationFilter, Prisma.coursesWhereInput>;
    lo_assessments?: Prisma.Lo_assessmentsListRelationFilter;
    quiz_items?: Prisma.Quiz_itemsListRelationFilter;
}, "lo_id" | "course_id_code">;
export type learning_outcomesOrderByWithAggregationInput = {
    lo_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    parent_code?: Prisma.SortOrderInput | Prisma.SortOrder;
    statement_vi?: Prisma.SortOrder;
    statement_en?: Prisma.SortOrderInput | Prisma.SortOrder;
    bloom_level?: Prisma.SortOrderInput | Prisma.SortOrder;
    cdio_level?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.learning_outcomesCountOrderByAggregateInput;
    _avg?: Prisma.learning_outcomesAvgOrderByAggregateInput;
    _max?: Prisma.learning_outcomesMaxOrderByAggregateInput;
    _min?: Prisma.learning_outcomesMinOrderByAggregateInput;
    _sum?: Prisma.learning_outcomesSumOrderByAggregateInput;
};
export type learning_outcomesScalarWhereWithAggregatesInput = {
    AND?: Prisma.learning_outcomesScalarWhereWithAggregatesInput | Prisma.learning_outcomesScalarWhereWithAggregatesInput[];
    OR?: Prisma.learning_outcomesScalarWhereWithAggregatesInput[];
    NOT?: Prisma.learning_outcomesScalarWhereWithAggregatesInput | Prisma.learning_outcomesScalarWhereWithAggregatesInput[];
    lo_id?: Prisma.StringWithAggregatesFilter<"learning_outcomes"> | string;
    course_id?: Prisma.StringWithAggregatesFilter<"learning_outcomes"> | string;
    code?: Prisma.StringWithAggregatesFilter<"learning_outcomes"> | string;
    parent_code?: Prisma.StringNullableWithAggregatesFilter<"learning_outcomes"> | string | null;
    statement_vi?: Prisma.StringWithAggregatesFilter<"learning_outcomes"> | string;
    statement_en?: Prisma.StringNullableWithAggregatesFilter<"learning_outcomes"> | string | null;
    bloom_level?: Prisma.StringNullableWithAggregatesFilter<"learning_outcomes"> | string | null;
    cdio_level?: Prisma.IntNullableWithAggregatesFilter<"learning_outcomes"> | number | null;
};
export type learning_outcomesCreateInput = {
    lo_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsCreateNestedManyWithoutLearning_outcomesInput;
    courses: Prisma.coursesCreateNestedOneWithoutLearning_outcomesInput;
    lo_assessments?: Prisma.lo_assessmentsCreateNestedManyWithoutLearning_outcomesInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutLearning_outcomesInput;
};
export type learning_outcomesUncheckedCreateInput = {
    lo_id: string;
    course_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
    lo_assessments?: Prisma.lo_assessmentsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
};
export type learning_outcomesUpdateInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUpdateManyWithoutLearning_outcomesNestedInput;
    courses?: Prisma.coursesUpdateOneRequiredWithoutLearning_outcomesNestedInput;
    lo_assessments?: Prisma.lo_assessmentsUpdateManyWithoutLearning_outcomesNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutLearning_outcomesNestedInput;
};
export type learning_outcomesUncheckedUpdateInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
    lo_assessments?: Prisma.lo_assessmentsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
};
export type learning_outcomesCreateManyInput = {
    lo_id: string;
    course_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
};
export type learning_outcomesUpdateManyMutationInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
};
export type learning_outcomesUncheckedUpdateManyInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
};
export type Learning_outcomesScalarRelationFilter = {
    is?: Prisma.learning_outcomesWhereInput;
    isNot?: Prisma.learning_outcomesWhereInput;
};
export type Learning_outcomesListRelationFilter = {
    every?: Prisma.learning_outcomesWhereInput;
    some?: Prisma.learning_outcomesWhereInput;
    none?: Prisma.learning_outcomesWhereInput;
};
export type learning_outcomesOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type learning_outcomesCourse_idCodeCompoundUniqueInput = {
    course_id: string;
    code: string;
};
export type learning_outcomesCountOrderByAggregateInput = {
    lo_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    parent_code?: Prisma.SortOrder;
    statement_vi?: Prisma.SortOrder;
    statement_en?: Prisma.SortOrder;
    bloom_level?: Prisma.SortOrder;
    cdio_level?: Prisma.SortOrder;
};
export type learning_outcomesAvgOrderByAggregateInput = {
    cdio_level?: Prisma.SortOrder;
};
export type learning_outcomesMaxOrderByAggregateInput = {
    lo_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    parent_code?: Prisma.SortOrder;
    statement_vi?: Prisma.SortOrder;
    statement_en?: Prisma.SortOrder;
    bloom_level?: Prisma.SortOrder;
    cdio_level?: Prisma.SortOrder;
};
export type learning_outcomesMinOrderByAggregateInput = {
    lo_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    parent_code?: Prisma.SortOrder;
    statement_vi?: Prisma.SortOrder;
    statement_en?: Prisma.SortOrder;
    bloom_level?: Prisma.SortOrder;
    cdio_level?: Prisma.SortOrder;
};
export type learning_outcomesSumOrderByAggregateInput = {
    cdio_level?: Prisma.SortOrder;
};
export type Learning_outcomesNullableScalarRelationFilter = {
    is?: Prisma.learning_outcomesWhereInput | null;
    isNot?: Prisma.learning_outcomesWhereInput | null;
};
export type learning_outcomesCreateNestedOneWithoutChunk_lo_mappingsInput = {
    create?: Prisma.XOR<Prisma.learning_outcomesCreateWithoutChunk_lo_mappingsInput, Prisma.learning_outcomesUncheckedCreateWithoutChunk_lo_mappingsInput>;
    connectOrCreate?: Prisma.learning_outcomesCreateOrConnectWithoutChunk_lo_mappingsInput;
    connect?: Prisma.learning_outcomesWhereUniqueInput;
};
export type learning_outcomesUpdateOneRequiredWithoutChunk_lo_mappingsNestedInput = {
    create?: Prisma.XOR<Prisma.learning_outcomesCreateWithoutChunk_lo_mappingsInput, Prisma.learning_outcomesUncheckedCreateWithoutChunk_lo_mappingsInput>;
    connectOrCreate?: Prisma.learning_outcomesCreateOrConnectWithoutChunk_lo_mappingsInput;
    upsert?: Prisma.learning_outcomesUpsertWithoutChunk_lo_mappingsInput;
    connect?: Prisma.learning_outcomesWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.learning_outcomesUpdateToOneWithWhereWithoutChunk_lo_mappingsInput, Prisma.learning_outcomesUpdateWithoutChunk_lo_mappingsInput>, Prisma.learning_outcomesUncheckedUpdateWithoutChunk_lo_mappingsInput>;
};
export type learning_outcomesCreateNestedManyWithoutCoursesInput = {
    create?: Prisma.XOR<Prisma.learning_outcomesCreateWithoutCoursesInput, Prisma.learning_outcomesUncheckedCreateWithoutCoursesInput> | Prisma.learning_outcomesCreateWithoutCoursesInput[] | Prisma.learning_outcomesUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.learning_outcomesCreateOrConnectWithoutCoursesInput | Prisma.learning_outcomesCreateOrConnectWithoutCoursesInput[];
    createMany?: Prisma.learning_outcomesCreateManyCoursesInputEnvelope;
    connect?: Prisma.learning_outcomesWhereUniqueInput | Prisma.learning_outcomesWhereUniqueInput[];
};
export type learning_outcomesUncheckedCreateNestedManyWithoutCoursesInput = {
    create?: Prisma.XOR<Prisma.learning_outcomesCreateWithoutCoursesInput, Prisma.learning_outcomesUncheckedCreateWithoutCoursesInput> | Prisma.learning_outcomesCreateWithoutCoursesInput[] | Prisma.learning_outcomesUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.learning_outcomesCreateOrConnectWithoutCoursesInput | Prisma.learning_outcomesCreateOrConnectWithoutCoursesInput[];
    createMany?: Prisma.learning_outcomesCreateManyCoursesInputEnvelope;
    connect?: Prisma.learning_outcomesWhereUniqueInput | Prisma.learning_outcomesWhereUniqueInput[];
};
export type learning_outcomesUpdateManyWithoutCoursesNestedInput = {
    create?: Prisma.XOR<Prisma.learning_outcomesCreateWithoutCoursesInput, Prisma.learning_outcomesUncheckedCreateWithoutCoursesInput> | Prisma.learning_outcomesCreateWithoutCoursesInput[] | Prisma.learning_outcomesUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.learning_outcomesCreateOrConnectWithoutCoursesInput | Prisma.learning_outcomesCreateOrConnectWithoutCoursesInput[];
    upsert?: Prisma.learning_outcomesUpsertWithWhereUniqueWithoutCoursesInput | Prisma.learning_outcomesUpsertWithWhereUniqueWithoutCoursesInput[];
    createMany?: Prisma.learning_outcomesCreateManyCoursesInputEnvelope;
    set?: Prisma.learning_outcomesWhereUniqueInput | Prisma.learning_outcomesWhereUniqueInput[];
    disconnect?: Prisma.learning_outcomesWhereUniqueInput | Prisma.learning_outcomesWhereUniqueInput[];
    delete?: Prisma.learning_outcomesWhereUniqueInput | Prisma.learning_outcomesWhereUniqueInput[];
    connect?: Prisma.learning_outcomesWhereUniqueInput | Prisma.learning_outcomesWhereUniqueInput[];
    update?: Prisma.learning_outcomesUpdateWithWhereUniqueWithoutCoursesInput | Prisma.learning_outcomesUpdateWithWhereUniqueWithoutCoursesInput[];
    updateMany?: Prisma.learning_outcomesUpdateManyWithWhereWithoutCoursesInput | Prisma.learning_outcomesUpdateManyWithWhereWithoutCoursesInput[];
    deleteMany?: Prisma.learning_outcomesScalarWhereInput | Prisma.learning_outcomesScalarWhereInput[];
};
export type learning_outcomesUncheckedUpdateManyWithoutCoursesNestedInput = {
    create?: Prisma.XOR<Prisma.learning_outcomesCreateWithoutCoursesInput, Prisma.learning_outcomesUncheckedCreateWithoutCoursesInput> | Prisma.learning_outcomesCreateWithoutCoursesInput[] | Prisma.learning_outcomesUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.learning_outcomesCreateOrConnectWithoutCoursesInput | Prisma.learning_outcomesCreateOrConnectWithoutCoursesInput[];
    upsert?: Prisma.learning_outcomesUpsertWithWhereUniqueWithoutCoursesInput | Prisma.learning_outcomesUpsertWithWhereUniqueWithoutCoursesInput[];
    createMany?: Prisma.learning_outcomesCreateManyCoursesInputEnvelope;
    set?: Prisma.learning_outcomesWhereUniqueInput | Prisma.learning_outcomesWhereUniqueInput[];
    disconnect?: Prisma.learning_outcomesWhereUniqueInput | Prisma.learning_outcomesWhereUniqueInput[];
    delete?: Prisma.learning_outcomesWhereUniqueInput | Prisma.learning_outcomesWhereUniqueInput[];
    connect?: Prisma.learning_outcomesWhereUniqueInput | Prisma.learning_outcomesWhereUniqueInput[];
    update?: Prisma.learning_outcomesUpdateWithWhereUniqueWithoutCoursesInput | Prisma.learning_outcomesUpdateWithWhereUniqueWithoutCoursesInput[];
    updateMany?: Prisma.learning_outcomesUpdateManyWithWhereWithoutCoursesInput | Prisma.learning_outcomesUpdateManyWithWhereWithoutCoursesInput[];
    deleteMany?: Prisma.learning_outcomesScalarWhereInput | Prisma.learning_outcomesScalarWhereInput[];
};
export type learning_outcomesCreateNestedOneWithoutLo_assessmentsInput = {
    create?: Prisma.XOR<Prisma.learning_outcomesCreateWithoutLo_assessmentsInput, Prisma.learning_outcomesUncheckedCreateWithoutLo_assessmentsInput>;
    connectOrCreate?: Prisma.learning_outcomesCreateOrConnectWithoutLo_assessmentsInput;
    connect?: Prisma.learning_outcomesWhereUniqueInput;
};
export type learning_outcomesUpdateOneRequiredWithoutLo_assessmentsNestedInput = {
    create?: Prisma.XOR<Prisma.learning_outcomesCreateWithoutLo_assessmentsInput, Prisma.learning_outcomesUncheckedCreateWithoutLo_assessmentsInput>;
    connectOrCreate?: Prisma.learning_outcomesCreateOrConnectWithoutLo_assessmentsInput;
    upsert?: Prisma.learning_outcomesUpsertWithoutLo_assessmentsInput;
    connect?: Prisma.learning_outcomesWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.learning_outcomesUpdateToOneWithWhereWithoutLo_assessmentsInput, Prisma.learning_outcomesUpdateWithoutLo_assessmentsInput>, Prisma.learning_outcomesUncheckedUpdateWithoutLo_assessmentsInput>;
};
export type learning_outcomesCreateNestedOneWithoutQuiz_itemsInput = {
    create?: Prisma.XOR<Prisma.learning_outcomesCreateWithoutQuiz_itemsInput, Prisma.learning_outcomesUncheckedCreateWithoutQuiz_itemsInput>;
    connectOrCreate?: Prisma.learning_outcomesCreateOrConnectWithoutQuiz_itemsInput;
    connect?: Prisma.learning_outcomesWhereUniqueInput;
};
export type learning_outcomesUpdateOneWithoutQuiz_itemsNestedInput = {
    create?: Prisma.XOR<Prisma.learning_outcomesCreateWithoutQuiz_itemsInput, Prisma.learning_outcomesUncheckedCreateWithoutQuiz_itemsInput>;
    connectOrCreate?: Prisma.learning_outcomesCreateOrConnectWithoutQuiz_itemsInput;
    upsert?: Prisma.learning_outcomesUpsertWithoutQuiz_itemsInput;
    disconnect?: Prisma.learning_outcomesWhereInput | boolean;
    delete?: Prisma.learning_outcomesWhereInput | boolean;
    connect?: Prisma.learning_outcomesWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.learning_outcomesUpdateToOneWithWhereWithoutQuiz_itemsInput, Prisma.learning_outcomesUpdateWithoutQuiz_itemsInput>, Prisma.learning_outcomesUncheckedUpdateWithoutQuiz_itemsInput>;
};
export type learning_outcomesCreateWithoutChunk_lo_mappingsInput = {
    lo_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
    courses: Prisma.coursesCreateNestedOneWithoutLearning_outcomesInput;
    lo_assessments?: Prisma.lo_assessmentsCreateNestedManyWithoutLearning_outcomesInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutLearning_outcomesInput;
};
export type learning_outcomesUncheckedCreateWithoutChunk_lo_mappingsInput = {
    lo_id: string;
    course_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
    lo_assessments?: Prisma.lo_assessmentsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
};
export type learning_outcomesCreateOrConnectWithoutChunk_lo_mappingsInput = {
    where: Prisma.learning_outcomesWhereUniqueInput;
    create: Prisma.XOR<Prisma.learning_outcomesCreateWithoutChunk_lo_mappingsInput, Prisma.learning_outcomesUncheckedCreateWithoutChunk_lo_mappingsInput>;
};
export type learning_outcomesUpsertWithoutChunk_lo_mappingsInput = {
    update: Prisma.XOR<Prisma.learning_outcomesUpdateWithoutChunk_lo_mappingsInput, Prisma.learning_outcomesUncheckedUpdateWithoutChunk_lo_mappingsInput>;
    create: Prisma.XOR<Prisma.learning_outcomesCreateWithoutChunk_lo_mappingsInput, Prisma.learning_outcomesUncheckedCreateWithoutChunk_lo_mappingsInput>;
    where?: Prisma.learning_outcomesWhereInput;
};
export type learning_outcomesUpdateToOneWithWhereWithoutChunk_lo_mappingsInput = {
    where?: Prisma.learning_outcomesWhereInput;
    data: Prisma.XOR<Prisma.learning_outcomesUpdateWithoutChunk_lo_mappingsInput, Prisma.learning_outcomesUncheckedUpdateWithoutChunk_lo_mappingsInput>;
};
export type learning_outcomesUpdateWithoutChunk_lo_mappingsInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    courses?: Prisma.coursesUpdateOneRequiredWithoutLearning_outcomesNestedInput;
    lo_assessments?: Prisma.lo_assessmentsUpdateManyWithoutLearning_outcomesNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutLearning_outcomesNestedInput;
};
export type learning_outcomesUncheckedUpdateWithoutChunk_lo_mappingsInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    lo_assessments?: Prisma.lo_assessmentsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
};
export type learning_outcomesCreateWithoutCoursesInput = {
    lo_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsCreateNestedManyWithoutLearning_outcomesInput;
    lo_assessments?: Prisma.lo_assessmentsCreateNestedManyWithoutLearning_outcomesInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutLearning_outcomesInput;
};
export type learning_outcomesUncheckedCreateWithoutCoursesInput = {
    lo_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
    lo_assessments?: Prisma.lo_assessmentsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
};
export type learning_outcomesCreateOrConnectWithoutCoursesInput = {
    where: Prisma.learning_outcomesWhereUniqueInput;
    create: Prisma.XOR<Prisma.learning_outcomesCreateWithoutCoursesInput, Prisma.learning_outcomesUncheckedCreateWithoutCoursesInput>;
};
export type learning_outcomesCreateManyCoursesInputEnvelope = {
    data: Prisma.learning_outcomesCreateManyCoursesInput | Prisma.learning_outcomesCreateManyCoursesInput[];
    skipDuplicates?: boolean;
};
export type learning_outcomesUpsertWithWhereUniqueWithoutCoursesInput = {
    where: Prisma.learning_outcomesWhereUniqueInput;
    update: Prisma.XOR<Prisma.learning_outcomesUpdateWithoutCoursesInput, Prisma.learning_outcomesUncheckedUpdateWithoutCoursesInput>;
    create: Prisma.XOR<Prisma.learning_outcomesCreateWithoutCoursesInput, Prisma.learning_outcomesUncheckedCreateWithoutCoursesInput>;
};
export type learning_outcomesUpdateWithWhereUniqueWithoutCoursesInput = {
    where: Prisma.learning_outcomesWhereUniqueInput;
    data: Prisma.XOR<Prisma.learning_outcomesUpdateWithoutCoursesInput, Prisma.learning_outcomesUncheckedUpdateWithoutCoursesInput>;
};
export type learning_outcomesUpdateManyWithWhereWithoutCoursesInput = {
    where: Prisma.learning_outcomesScalarWhereInput;
    data: Prisma.XOR<Prisma.learning_outcomesUpdateManyMutationInput, Prisma.learning_outcomesUncheckedUpdateManyWithoutCoursesInput>;
};
export type learning_outcomesScalarWhereInput = {
    AND?: Prisma.learning_outcomesScalarWhereInput | Prisma.learning_outcomesScalarWhereInput[];
    OR?: Prisma.learning_outcomesScalarWhereInput[];
    NOT?: Prisma.learning_outcomesScalarWhereInput | Prisma.learning_outcomesScalarWhereInput[];
    lo_id?: Prisma.StringFilter<"learning_outcomes"> | string;
    course_id?: Prisma.StringFilter<"learning_outcomes"> | string;
    code?: Prisma.StringFilter<"learning_outcomes"> | string;
    parent_code?: Prisma.StringNullableFilter<"learning_outcomes"> | string | null;
    statement_vi?: Prisma.StringFilter<"learning_outcomes"> | string;
    statement_en?: Prisma.StringNullableFilter<"learning_outcomes"> | string | null;
    bloom_level?: Prisma.StringNullableFilter<"learning_outcomes"> | string | null;
    cdio_level?: Prisma.IntNullableFilter<"learning_outcomes"> | number | null;
};
export type learning_outcomesCreateWithoutLo_assessmentsInput = {
    lo_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsCreateNestedManyWithoutLearning_outcomesInput;
    courses: Prisma.coursesCreateNestedOneWithoutLearning_outcomesInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutLearning_outcomesInput;
};
export type learning_outcomesUncheckedCreateWithoutLo_assessmentsInput = {
    lo_id: string;
    course_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
};
export type learning_outcomesCreateOrConnectWithoutLo_assessmentsInput = {
    where: Prisma.learning_outcomesWhereUniqueInput;
    create: Prisma.XOR<Prisma.learning_outcomesCreateWithoutLo_assessmentsInput, Prisma.learning_outcomesUncheckedCreateWithoutLo_assessmentsInput>;
};
export type learning_outcomesUpsertWithoutLo_assessmentsInput = {
    update: Prisma.XOR<Prisma.learning_outcomesUpdateWithoutLo_assessmentsInput, Prisma.learning_outcomesUncheckedUpdateWithoutLo_assessmentsInput>;
    create: Prisma.XOR<Prisma.learning_outcomesCreateWithoutLo_assessmentsInput, Prisma.learning_outcomesUncheckedCreateWithoutLo_assessmentsInput>;
    where?: Prisma.learning_outcomesWhereInput;
};
export type learning_outcomesUpdateToOneWithWhereWithoutLo_assessmentsInput = {
    where?: Prisma.learning_outcomesWhereInput;
    data: Prisma.XOR<Prisma.learning_outcomesUpdateWithoutLo_assessmentsInput, Prisma.learning_outcomesUncheckedUpdateWithoutLo_assessmentsInput>;
};
export type learning_outcomesUpdateWithoutLo_assessmentsInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUpdateManyWithoutLearning_outcomesNestedInput;
    courses?: Prisma.coursesUpdateOneRequiredWithoutLearning_outcomesNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutLearning_outcomesNestedInput;
};
export type learning_outcomesUncheckedUpdateWithoutLo_assessmentsInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
};
export type learning_outcomesCreateWithoutQuiz_itemsInput = {
    lo_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsCreateNestedManyWithoutLearning_outcomesInput;
    courses: Prisma.coursesCreateNestedOneWithoutLearning_outcomesInput;
    lo_assessments?: Prisma.lo_assessmentsCreateNestedManyWithoutLearning_outcomesInput;
};
export type learning_outcomesUncheckedCreateWithoutQuiz_itemsInput = {
    lo_id: string;
    course_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
    lo_assessments?: Prisma.lo_assessmentsUncheckedCreateNestedManyWithoutLearning_outcomesInput;
};
export type learning_outcomesCreateOrConnectWithoutQuiz_itemsInput = {
    where: Prisma.learning_outcomesWhereUniqueInput;
    create: Prisma.XOR<Prisma.learning_outcomesCreateWithoutQuiz_itemsInput, Prisma.learning_outcomesUncheckedCreateWithoutQuiz_itemsInput>;
};
export type learning_outcomesUpsertWithoutQuiz_itemsInput = {
    update: Prisma.XOR<Prisma.learning_outcomesUpdateWithoutQuiz_itemsInput, Prisma.learning_outcomesUncheckedUpdateWithoutQuiz_itemsInput>;
    create: Prisma.XOR<Prisma.learning_outcomesCreateWithoutQuiz_itemsInput, Prisma.learning_outcomesUncheckedCreateWithoutQuiz_itemsInput>;
    where?: Prisma.learning_outcomesWhereInput;
};
export type learning_outcomesUpdateToOneWithWhereWithoutQuiz_itemsInput = {
    where?: Prisma.learning_outcomesWhereInput;
    data: Prisma.XOR<Prisma.learning_outcomesUpdateWithoutQuiz_itemsInput, Prisma.learning_outcomesUncheckedUpdateWithoutQuiz_itemsInput>;
};
export type learning_outcomesUpdateWithoutQuiz_itemsInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUpdateManyWithoutLearning_outcomesNestedInput;
    courses?: Prisma.coursesUpdateOneRequiredWithoutLearning_outcomesNestedInput;
    lo_assessments?: Prisma.lo_assessmentsUpdateManyWithoutLearning_outcomesNestedInput;
};
export type learning_outcomesUncheckedUpdateWithoutQuiz_itemsInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
    lo_assessments?: Prisma.lo_assessmentsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
};
export type learning_outcomesCreateManyCoursesInput = {
    lo_id: string;
    code: string;
    parent_code?: string | null;
    statement_vi: string;
    statement_en?: string | null;
    bloom_level?: string | null;
    cdio_level?: number | null;
};
export type learning_outcomesUpdateWithoutCoursesInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUpdateManyWithoutLearning_outcomesNestedInput;
    lo_assessments?: Prisma.lo_assessmentsUpdateManyWithoutLearning_outcomesNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutLearning_outcomesNestedInput;
};
export type learning_outcomesUncheckedUpdateWithoutCoursesInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
    lo_assessments?: Prisma.lo_assessmentsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutLearning_outcomesNestedInput;
};
export type learning_outcomesUncheckedUpdateManyWithoutCoursesInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    parent_code?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    statement_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    statement_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bloom_level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    cdio_level?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
};
export type Learning_outcomesCountOutputType = {
    chunk_lo_mappings: number;
    lo_assessments: number;
    quiz_items: number;
};
export type Learning_outcomesCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunk_lo_mappings?: boolean | Learning_outcomesCountOutputTypeCountChunk_lo_mappingsArgs;
    lo_assessments?: boolean | Learning_outcomesCountOutputTypeCountLo_assessmentsArgs;
    quiz_items?: boolean | Learning_outcomesCountOutputTypeCountQuiz_itemsArgs;
};
export type Learning_outcomesCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.Learning_outcomesCountOutputTypeSelect<ExtArgs> | null;
};
export type Learning_outcomesCountOutputTypeCountChunk_lo_mappingsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_lo_mappingsWhereInput;
};
export type Learning_outcomesCountOutputTypeCountLo_assessmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lo_assessmentsWhereInput;
};
export type Learning_outcomesCountOutputTypeCountQuiz_itemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.quiz_itemsWhereInput;
};
export type learning_outcomesSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    lo_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    parent_code?: boolean;
    statement_vi?: boolean;
    statement_en?: boolean;
    bloom_level?: boolean;
    cdio_level?: boolean;
    chunk_lo_mappings?: boolean | Prisma.learning_outcomes$chunk_lo_mappingsArgs<ExtArgs>;
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
    lo_assessments?: boolean | Prisma.learning_outcomes$lo_assessmentsArgs<ExtArgs>;
    quiz_items?: boolean | Prisma.learning_outcomes$quiz_itemsArgs<ExtArgs>;
    _count?: boolean | Prisma.Learning_outcomesCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["learning_outcomes"]>;
export type learning_outcomesSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    lo_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    parent_code?: boolean;
    statement_vi?: boolean;
    statement_en?: boolean;
    bloom_level?: boolean;
    cdio_level?: boolean;
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["learning_outcomes"]>;
export type learning_outcomesSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    lo_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    parent_code?: boolean;
    statement_vi?: boolean;
    statement_en?: boolean;
    bloom_level?: boolean;
    cdio_level?: boolean;
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["learning_outcomes"]>;
export type learning_outcomesSelectScalar = {
    lo_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    parent_code?: boolean;
    statement_vi?: boolean;
    statement_en?: boolean;
    bloom_level?: boolean;
    cdio_level?: boolean;
};
export type learning_outcomesOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"lo_id" | "course_id" | "code" | "parent_code" | "statement_vi" | "statement_en" | "bloom_level" | "cdio_level", ExtArgs["result"]["learning_outcomes"]>;
export type learning_outcomesInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunk_lo_mappings?: boolean | Prisma.learning_outcomes$chunk_lo_mappingsArgs<ExtArgs>;
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
    lo_assessments?: boolean | Prisma.learning_outcomes$lo_assessmentsArgs<ExtArgs>;
    quiz_items?: boolean | Prisma.learning_outcomes$quiz_itemsArgs<ExtArgs>;
    _count?: boolean | Prisma.Learning_outcomesCountOutputTypeDefaultArgs<ExtArgs>;
};
export type learning_outcomesIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
};
export type learning_outcomesIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
};
export type $learning_outcomesPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "learning_outcomes";
    objects: {
        chunk_lo_mappings: Prisma.$chunk_lo_mappingsPayload<ExtArgs>[];
        courses: Prisma.$coursesPayload<ExtArgs>;
        lo_assessments: Prisma.$lo_assessmentsPayload<ExtArgs>[];
        quiz_items: Prisma.$quiz_itemsPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        lo_id: string;
        course_id: string;
        code: string;
        parent_code: string | null;
        statement_vi: string;
        statement_en: string | null;
        bloom_level: string | null;
        cdio_level: number | null;
    }, ExtArgs["result"]["learning_outcomes"]>;
    composites: {};
};
export type learning_outcomesGetPayload<S extends boolean | null | undefined | learning_outcomesDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload, S>;
export type learning_outcomesCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<learning_outcomesFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Learning_outcomesCountAggregateInputType | true;
};
export interface learning_outcomesDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['learning_outcomes'];
        meta: {
            name: 'learning_outcomes';
        };
    };
    findUnique<T extends learning_outcomesFindUniqueArgs>(args: Prisma.SelectSubset<T, learning_outcomesFindUniqueArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends learning_outcomesFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, learning_outcomesFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends learning_outcomesFindFirstArgs>(args?: Prisma.SelectSubset<T, learning_outcomesFindFirstArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends learning_outcomesFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, learning_outcomesFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends learning_outcomesFindManyArgs>(args?: Prisma.SelectSubset<T, learning_outcomesFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends learning_outcomesCreateArgs>(args: Prisma.SelectSubset<T, learning_outcomesCreateArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends learning_outcomesCreateManyArgs>(args?: Prisma.SelectSubset<T, learning_outcomesCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends learning_outcomesCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, learning_outcomesCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends learning_outcomesDeleteArgs>(args: Prisma.SelectSubset<T, learning_outcomesDeleteArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends learning_outcomesUpdateArgs>(args: Prisma.SelectSubset<T, learning_outcomesUpdateArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends learning_outcomesDeleteManyArgs>(args?: Prisma.SelectSubset<T, learning_outcomesDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends learning_outcomesUpdateManyArgs>(args: Prisma.SelectSubset<T, learning_outcomesUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends learning_outcomesUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, learning_outcomesUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends learning_outcomesUpsertArgs>(args: Prisma.SelectSubset<T, learning_outcomesUpsertArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends learning_outcomesCountArgs>(args?: Prisma.Subset<T, learning_outcomesCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Learning_outcomesCountAggregateOutputType> : number>;
    aggregate<T extends Learning_outcomesAggregateArgs>(args: Prisma.Subset<T, Learning_outcomesAggregateArgs>): Prisma.PrismaPromise<GetLearning_outcomesAggregateType<T>>;
    groupBy<T extends learning_outcomesGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: learning_outcomesGroupByArgs['orderBy'];
    } : {
        orderBy?: learning_outcomesGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, learning_outcomesGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLearning_outcomesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: learning_outcomesFieldRefs;
}
export interface Prisma__learning_outcomesClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    chunk_lo_mappings<T extends Prisma.learning_outcomes$chunk_lo_mappingsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.learning_outcomes$chunk_lo_mappingsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_lo_mappingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    courses<T extends Prisma.coursesDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.coursesDefaultArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    lo_assessments<T extends Prisma.learning_outcomes$lo_assessmentsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.learning_outcomes$lo_assessmentsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    quiz_items<T extends Prisma.learning_outcomes$quiz_itemsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.learning_outcomes$quiz_itemsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface learning_outcomesFieldRefs {
    readonly lo_id: Prisma.FieldRef<"learning_outcomes", 'String'>;
    readonly course_id: Prisma.FieldRef<"learning_outcomes", 'String'>;
    readonly code: Prisma.FieldRef<"learning_outcomes", 'String'>;
    readonly parent_code: Prisma.FieldRef<"learning_outcomes", 'String'>;
    readonly statement_vi: Prisma.FieldRef<"learning_outcomes", 'String'>;
    readonly statement_en: Prisma.FieldRef<"learning_outcomes", 'String'>;
    readonly bloom_level: Prisma.FieldRef<"learning_outcomes", 'String'>;
    readonly cdio_level: Prisma.FieldRef<"learning_outcomes", 'Int'>;
}
export type learning_outcomesFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
    where: Prisma.learning_outcomesWhereUniqueInput;
};
export type learning_outcomesFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
    where: Prisma.learning_outcomesWhereUniqueInput;
};
export type learning_outcomesFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
    where?: Prisma.learning_outcomesWhereInput;
    orderBy?: Prisma.learning_outcomesOrderByWithRelationInput | Prisma.learning_outcomesOrderByWithRelationInput[];
    cursor?: Prisma.learning_outcomesWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Learning_outcomesScalarFieldEnum | Prisma.Learning_outcomesScalarFieldEnum[];
};
export type learning_outcomesFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
    where?: Prisma.learning_outcomesWhereInput;
    orderBy?: Prisma.learning_outcomesOrderByWithRelationInput | Prisma.learning_outcomesOrderByWithRelationInput[];
    cursor?: Prisma.learning_outcomesWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Learning_outcomesScalarFieldEnum | Prisma.Learning_outcomesScalarFieldEnum[];
};
export type learning_outcomesFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
    where?: Prisma.learning_outcomesWhereInput;
    orderBy?: Prisma.learning_outcomesOrderByWithRelationInput | Prisma.learning_outcomesOrderByWithRelationInput[];
    cursor?: Prisma.learning_outcomesWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Learning_outcomesScalarFieldEnum | Prisma.Learning_outcomesScalarFieldEnum[];
};
export type learning_outcomesCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.learning_outcomesCreateInput, Prisma.learning_outcomesUncheckedCreateInput>;
};
export type learning_outcomesCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.learning_outcomesCreateManyInput | Prisma.learning_outcomesCreateManyInput[];
    skipDuplicates?: boolean;
};
export type learning_outcomesCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    data: Prisma.learning_outcomesCreateManyInput | Prisma.learning_outcomesCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.learning_outcomesIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type learning_outcomesUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.learning_outcomesUpdateInput, Prisma.learning_outcomesUncheckedUpdateInput>;
    where: Prisma.learning_outcomesWhereUniqueInput;
};
export type learning_outcomesUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.learning_outcomesUpdateManyMutationInput, Prisma.learning_outcomesUncheckedUpdateManyInput>;
    where?: Prisma.learning_outcomesWhereInput;
    limit?: number;
};
export type learning_outcomesUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.learning_outcomesUpdateManyMutationInput, Prisma.learning_outcomesUncheckedUpdateManyInput>;
    where?: Prisma.learning_outcomesWhereInput;
    limit?: number;
    include?: Prisma.learning_outcomesIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type learning_outcomesUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
    where: Prisma.learning_outcomesWhereUniqueInput;
    create: Prisma.XOR<Prisma.learning_outcomesCreateInput, Prisma.learning_outcomesUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.learning_outcomesUpdateInput, Prisma.learning_outcomesUncheckedUpdateInput>;
};
export type learning_outcomesDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
    where: Prisma.learning_outcomesWhereUniqueInput;
};
export type learning_outcomesDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.learning_outcomesWhereInput;
    limit?: number;
};
export type learning_outcomes$chunk_lo_mappingsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type learning_outcomes$lo_assessmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lo_assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.lo_assessmentsOmit<ExtArgs> | null;
    include?: Prisma.lo_assessmentsInclude<ExtArgs> | null;
    where?: Prisma.lo_assessmentsWhereInput;
    orderBy?: Prisma.lo_assessmentsOrderByWithRelationInput | Prisma.lo_assessmentsOrderByWithRelationInput[];
    cursor?: Prisma.lo_assessmentsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Lo_assessmentsScalarFieldEnum | Prisma.Lo_assessmentsScalarFieldEnum[];
};
export type learning_outcomes$quiz_itemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type learning_outcomesDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.learning_outcomesSelect<ExtArgs> | null;
    omit?: Prisma.learning_outcomesOmit<ExtArgs> | null;
    include?: Prisma.learning_outcomesInclude<ExtArgs> | null;
};
