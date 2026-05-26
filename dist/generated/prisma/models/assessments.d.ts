import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type assessmentsModel = runtime.Types.Result.DefaultSelection<Prisma.$assessmentsPayload>;
export type AggregateAssessments = {
    _count: AssessmentsCountAggregateOutputType | null;
    _avg: AssessmentsAvgAggregateOutputType | null;
    _sum: AssessmentsSumAggregateOutputType | null;
    _min: AssessmentsMinAggregateOutputType | null;
    _max: AssessmentsMaxAggregateOutputType | null;
};
export type AssessmentsAvgAggregateOutputType = {
    weight: number | null;
};
export type AssessmentsSumAggregateOutputType = {
    weight: number | null;
};
export type AssessmentsMinAggregateOutputType = {
    assessment_id: string | null;
    course_id: string | null;
    code: string | null;
    name_vi: string | null;
    name_en: string | null;
    category: string | null;
    weight: number | null;
};
export type AssessmentsMaxAggregateOutputType = {
    assessment_id: string | null;
    course_id: string | null;
    code: string | null;
    name_vi: string | null;
    name_en: string | null;
    category: string | null;
    weight: number | null;
};
export type AssessmentsCountAggregateOutputType = {
    assessment_id: number;
    course_id: number;
    code: number;
    name_vi: number;
    name_en: number;
    category: number;
    weight: number;
    _all: number;
};
export type AssessmentsAvgAggregateInputType = {
    weight?: true;
};
export type AssessmentsSumAggregateInputType = {
    weight?: true;
};
export type AssessmentsMinAggregateInputType = {
    assessment_id?: true;
    course_id?: true;
    code?: true;
    name_vi?: true;
    name_en?: true;
    category?: true;
    weight?: true;
};
export type AssessmentsMaxAggregateInputType = {
    assessment_id?: true;
    course_id?: true;
    code?: true;
    name_vi?: true;
    name_en?: true;
    category?: true;
    weight?: true;
};
export type AssessmentsCountAggregateInputType = {
    assessment_id?: true;
    course_id?: true;
    code?: true;
    name_vi?: true;
    name_en?: true;
    category?: true;
    weight?: true;
    _all?: true;
};
export type AssessmentsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.assessmentsWhereInput;
    orderBy?: Prisma.assessmentsOrderByWithRelationInput | Prisma.assessmentsOrderByWithRelationInput[];
    cursor?: Prisma.assessmentsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | AssessmentsCountAggregateInputType;
    _avg?: AssessmentsAvgAggregateInputType;
    _sum?: AssessmentsSumAggregateInputType;
    _min?: AssessmentsMinAggregateInputType;
    _max?: AssessmentsMaxAggregateInputType;
};
export type GetAssessmentsAggregateType<T extends AssessmentsAggregateArgs> = {
    [P in keyof T & keyof AggregateAssessments]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAssessments[P]> : Prisma.GetScalarType<T[P], AggregateAssessments[P]>;
};
export type assessmentsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.assessmentsWhereInput;
    orderBy?: Prisma.assessmentsOrderByWithAggregationInput | Prisma.assessmentsOrderByWithAggregationInput[];
    by: Prisma.AssessmentsScalarFieldEnum[] | Prisma.AssessmentsScalarFieldEnum;
    having?: Prisma.assessmentsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AssessmentsCountAggregateInputType | true;
    _avg?: AssessmentsAvgAggregateInputType;
    _sum?: AssessmentsSumAggregateInputType;
    _min?: AssessmentsMinAggregateInputType;
    _max?: AssessmentsMaxAggregateInputType;
};
export type AssessmentsGroupByOutputType = {
    assessment_id: string;
    course_id: string;
    code: string;
    name_vi: string;
    name_en: string | null;
    category: string;
    weight: number | null;
    _count: AssessmentsCountAggregateOutputType | null;
    _avg: AssessmentsAvgAggregateOutputType | null;
    _sum: AssessmentsSumAggregateOutputType | null;
    _min: AssessmentsMinAggregateOutputType | null;
    _max: AssessmentsMaxAggregateOutputType | null;
};
export type GetAssessmentsGroupByPayload<T extends assessmentsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AssessmentsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AssessmentsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AssessmentsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AssessmentsGroupByOutputType[P]>;
}>>;
export type assessmentsWhereInput = {
    AND?: Prisma.assessmentsWhereInput | Prisma.assessmentsWhereInput[];
    OR?: Prisma.assessmentsWhereInput[];
    NOT?: Prisma.assessmentsWhereInput | Prisma.assessmentsWhereInput[];
    assessment_id?: Prisma.StringFilter<"assessments"> | string;
    course_id?: Prisma.StringFilter<"assessments"> | string;
    code?: Prisma.StringFilter<"assessments"> | string;
    name_vi?: Prisma.StringFilter<"assessments"> | string;
    name_en?: Prisma.StringNullableFilter<"assessments"> | string | null;
    category?: Prisma.StringFilter<"assessments"> | string;
    weight?: Prisma.FloatNullableFilter<"assessments"> | number | null;
    courses?: Prisma.XOR<Prisma.CoursesScalarRelationFilter, Prisma.coursesWhereInput>;
    lo_assessments?: Prisma.Lo_assessmentsListRelationFilter;
    quiz_items?: Prisma.Quiz_itemsListRelationFilter;
};
export type assessmentsOrderByWithRelationInput = {
    assessment_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    name_vi?: Prisma.SortOrder;
    name_en?: Prisma.SortOrderInput | Prisma.SortOrder;
    category?: Prisma.SortOrder;
    weight?: Prisma.SortOrderInput | Prisma.SortOrder;
    courses?: Prisma.coursesOrderByWithRelationInput;
    lo_assessments?: Prisma.lo_assessmentsOrderByRelationAggregateInput;
    quiz_items?: Prisma.quiz_itemsOrderByRelationAggregateInput;
};
export type assessmentsWhereUniqueInput = Prisma.AtLeast<{
    assessment_id?: string;
    course_id_code?: Prisma.assessmentsCourse_idCodeCompoundUniqueInput;
    AND?: Prisma.assessmentsWhereInput | Prisma.assessmentsWhereInput[];
    OR?: Prisma.assessmentsWhereInput[];
    NOT?: Prisma.assessmentsWhereInput | Prisma.assessmentsWhereInput[];
    course_id?: Prisma.StringFilter<"assessments"> | string;
    code?: Prisma.StringFilter<"assessments"> | string;
    name_vi?: Prisma.StringFilter<"assessments"> | string;
    name_en?: Prisma.StringNullableFilter<"assessments"> | string | null;
    category?: Prisma.StringFilter<"assessments"> | string;
    weight?: Prisma.FloatNullableFilter<"assessments"> | number | null;
    courses?: Prisma.XOR<Prisma.CoursesScalarRelationFilter, Prisma.coursesWhereInput>;
    lo_assessments?: Prisma.Lo_assessmentsListRelationFilter;
    quiz_items?: Prisma.Quiz_itemsListRelationFilter;
}, "assessment_id" | "course_id_code">;
export type assessmentsOrderByWithAggregationInput = {
    assessment_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    name_vi?: Prisma.SortOrder;
    name_en?: Prisma.SortOrderInput | Prisma.SortOrder;
    category?: Prisma.SortOrder;
    weight?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.assessmentsCountOrderByAggregateInput;
    _avg?: Prisma.assessmentsAvgOrderByAggregateInput;
    _max?: Prisma.assessmentsMaxOrderByAggregateInput;
    _min?: Prisma.assessmentsMinOrderByAggregateInput;
    _sum?: Prisma.assessmentsSumOrderByAggregateInput;
};
export type assessmentsScalarWhereWithAggregatesInput = {
    AND?: Prisma.assessmentsScalarWhereWithAggregatesInput | Prisma.assessmentsScalarWhereWithAggregatesInput[];
    OR?: Prisma.assessmentsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.assessmentsScalarWhereWithAggregatesInput | Prisma.assessmentsScalarWhereWithAggregatesInput[];
    assessment_id?: Prisma.StringWithAggregatesFilter<"assessments"> | string;
    course_id?: Prisma.StringWithAggregatesFilter<"assessments"> | string;
    code?: Prisma.StringWithAggregatesFilter<"assessments"> | string;
    name_vi?: Prisma.StringWithAggregatesFilter<"assessments"> | string;
    name_en?: Prisma.StringNullableWithAggregatesFilter<"assessments"> | string | null;
    category?: Prisma.StringWithAggregatesFilter<"assessments"> | string;
    weight?: Prisma.FloatNullableWithAggregatesFilter<"assessments"> | number | null;
};
export type assessmentsCreateInput = {
    assessment_id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    category?: string;
    weight?: number | null;
    courses: Prisma.coursesCreateNestedOneWithoutAssessmentsInput;
    lo_assessments?: Prisma.lo_assessmentsCreateNestedManyWithoutAssessmentsInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutAssessmentsInput;
};
export type assessmentsUncheckedCreateInput = {
    assessment_id: string;
    course_id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    category?: string;
    weight?: number | null;
    lo_assessments?: Prisma.lo_assessmentsUncheckedCreateNestedManyWithoutAssessmentsInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutAssessmentsInput;
};
export type assessmentsUpdateInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    courses?: Prisma.coursesUpdateOneRequiredWithoutAssessmentsNestedInput;
    lo_assessments?: Prisma.lo_assessmentsUpdateManyWithoutAssessmentsNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutAssessmentsNestedInput;
};
export type assessmentsUncheckedUpdateInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    lo_assessments?: Prisma.lo_assessmentsUncheckedUpdateManyWithoutAssessmentsNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutAssessmentsNestedInput;
};
export type assessmentsCreateManyInput = {
    assessment_id: string;
    course_id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    category?: string;
    weight?: number | null;
};
export type assessmentsUpdateManyMutationInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
};
export type assessmentsUncheckedUpdateManyInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
};
export type assessmentsCourse_idCodeCompoundUniqueInput = {
    course_id: string;
    code: string;
};
export type assessmentsCountOrderByAggregateInput = {
    assessment_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    name_vi?: Prisma.SortOrder;
    name_en?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    weight?: Prisma.SortOrder;
};
export type assessmentsAvgOrderByAggregateInput = {
    weight?: Prisma.SortOrder;
};
export type assessmentsMaxOrderByAggregateInput = {
    assessment_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    name_vi?: Prisma.SortOrder;
    name_en?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    weight?: Prisma.SortOrder;
};
export type assessmentsMinOrderByAggregateInput = {
    assessment_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    name_vi?: Prisma.SortOrder;
    name_en?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    weight?: Prisma.SortOrder;
};
export type assessmentsSumOrderByAggregateInput = {
    weight?: Prisma.SortOrder;
};
export type AssessmentsListRelationFilter = {
    every?: Prisma.assessmentsWhereInput;
    some?: Prisma.assessmentsWhereInput;
    none?: Prisma.assessmentsWhereInput;
};
export type assessmentsOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type AssessmentsScalarRelationFilter = {
    is?: Prisma.assessmentsWhereInput;
    isNot?: Prisma.assessmentsWhereInput;
};
export type AssessmentsNullableScalarRelationFilter = {
    is?: Prisma.assessmentsWhereInput | null;
    isNot?: Prisma.assessmentsWhereInput | null;
};
export type StringFieldUpdateOperationsInput = {
    set?: string;
};
export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
};
export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type assessmentsCreateNestedManyWithoutCoursesInput = {
    create?: Prisma.XOR<Prisma.assessmentsCreateWithoutCoursesInput, Prisma.assessmentsUncheckedCreateWithoutCoursesInput> | Prisma.assessmentsCreateWithoutCoursesInput[] | Prisma.assessmentsUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.assessmentsCreateOrConnectWithoutCoursesInput | Prisma.assessmentsCreateOrConnectWithoutCoursesInput[];
    createMany?: Prisma.assessmentsCreateManyCoursesInputEnvelope;
    connect?: Prisma.assessmentsWhereUniqueInput | Prisma.assessmentsWhereUniqueInput[];
};
export type assessmentsUncheckedCreateNestedManyWithoutCoursesInput = {
    create?: Prisma.XOR<Prisma.assessmentsCreateWithoutCoursesInput, Prisma.assessmentsUncheckedCreateWithoutCoursesInput> | Prisma.assessmentsCreateWithoutCoursesInput[] | Prisma.assessmentsUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.assessmentsCreateOrConnectWithoutCoursesInput | Prisma.assessmentsCreateOrConnectWithoutCoursesInput[];
    createMany?: Prisma.assessmentsCreateManyCoursesInputEnvelope;
    connect?: Prisma.assessmentsWhereUniqueInput | Prisma.assessmentsWhereUniqueInput[];
};
export type assessmentsUpdateManyWithoutCoursesNestedInput = {
    create?: Prisma.XOR<Prisma.assessmentsCreateWithoutCoursesInput, Prisma.assessmentsUncheckedCreateWithoutCoursesInput> | Prisma.assessmentsCreateWithoutCoursesInput[] | Prisma.assessmentsUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.assessmentsCreateOrConnectWithoutCoursesInput | Prisma.assessmentsCreateOrConnectWithoutCoursesInput[];
    upsert?: Prisma.assessmentsUpsertWithWhereUniqueWithoutCoursesInput | Prisma.assessmentsUpsertWithWhereUniqueWithoutCoursesInput[];
    createMany?: Prisma.assessmentsCreateManyCoursesInputEnvelope;
    set?: Prisma.assessmentsWhereUniqueInput | Prisma.assessmentsWhereUniqueInput[];
    disconnect?: Prisma.assessmentsWhereUniqueInput | Prisma.assessmentsWhereUniqueInput[];
    delete?: Prisma.assessmentsWhereUniqueInput | Prisma.assessmentsWhereUniqueInput[];
    connect?: Prisma.assessmentsWhereUniqueInput | Prisma.assessmentsWhereUniqueInput[];
    update?: Prisma.assessmentsUpdateWithWhereUniqueWithoutCoursesInput | Prisma.assessmentsUpdateWithWhereUniqueWithoutCoursesInput[];
    updateMany?: Prisma.assessmentsUpdateManyWithWhereWithoutCoursesInput | Prisma.assessmentsUpdateManyWithWhereWithoutCoursesInput[];
    deleteMany?: Prisma.assessmentsScalarWhereInput | Prisma.assessmentsScalarWhereInput[];
};
export type assessmentsUncheckedUpdateManyWithoutCoursesNestedInput = {
    create?: Prisma.XOR<Prisma.assessmentsCreateWithoutCoursesInput, Prisma.assessmentsUncheckedCreateWithoutCoursesInput> | Prisma.assessmentsCreateWithoutCoursesInput[] | Prisma.assessmentsUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.assessmentsCreateOrConnectWithoutCoursesInput | Prisma.assessmentsCreateOrConnectWithoutCoursesInput[];
    upsert?: Prisma.assessmentsUpsertWithWhereUniqueWithoutCoursesInput | Prisma.assessmentsUpsertWithWhereUniqueWithoutCoursesInput[];
    createMany?: Prisma.assessmentsCreateManyCoursesInputEnvelope;
    set?: Prisma.assessmentsWhereUniqueInput | Prisma.assessmentsWhereUniqueInput[];
    disconnect?: Prisma.assessmentsWhereUniqueInput | Prisma.assessmentsWhereUniqueInput[];
    delete?: Prisma.assessmentsWhereUniqueInput | Prisma.assessmentsWhereUniqueInput[];
    connect?: Prisma.assessmentsWhereUniqueInput | Prisma.assessmentsWhereUniqueInput[];
    update?: Prisma.assessmentsUpdateWithWhereUniqueWithoutCoursesInput | Prisma.assessmentsUpdateWithWhereUniqueWithoutCoursesInput[];
    updateMany?: Prisma.assessmentsUpdateManyWithWhereWithoutCoursesInput | Prisma.assessmentsUpdateManyWithWhereWithoutCoursesInput[];
    deleteMany?: Prisma.assessmentsScalarWhereInput | Prisma.assessmentsScalarWhereInput[];
};
export type assessmentsCreateNestedOneWithoutLo_assessmentsInput = {
    create?: Prisma.XOR<Prisma.assessmentsCreateWithoutLo_assessmentsInput, Prisma.assessmentsUncheckedCreateWithoutLo_assessmentsInput>;
    connectOrCreate?: Prisma.assessmentsCreateOrConnectWithoutLo_assessmentsInput;
    connect?: Prisma.assessmentsWhereUniqueInput;
};
export type assessmentsUpdateOneRequiredWithoutLo_assessmentsNestedInput = {
    create?: Prisma.XOR<Prisma.assessmentsCreateWithoutLo_assessmentsInput, Prisma.assessmentsUncheckedCreateWithoutLo_assessmentsInput>;
    connectOrCreate?: Prisma.assessmentsCreateOrConnectWithoutLo_assessmentsInput;
    upsert?: Prisma.assessmentsUpsertWithoutLo_assessmentsInput;
    connect?: Prisma.assessmentsWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.assessmentsUpdateToOneWithWhereWithoutLo_assessmentsInput, Prisma.assessmentsUpdateWithoutLo_assessmentsInput>, Prisma.assessmentsUncheckedUpdateWithoutLo_assessmentsInput>;
};
export type assessmentsCreateNestedOneWithoutQuiz_itemsInput = {
    create?: Prisma.XOR<Prisma.assessmentsCreateWithoutQuiz_itemsInput, Prisma.assessmentsUncheckedCreateWithoutQuiz_itemsInput>;
    connectOrCreate?: Prisma.assessmentsCreateOrConnectWithoutQuiz_itemsInput;
    connect?: Prisma.assessmentsWhereUniqueInput;
};
export type assessmentsUpdateOneWithoutQuiz_itemsNestedInput = {
    create?: Prisma.XOR<Prisma.assessmentsCreateWithoutQuiz_itemsInput, Prisma.assessmentsUncheckedCreateWithoutQuiz_itemsInput>;
    connectOrCreate?: Prisma.assessmentsCreateOrConnectWithoutQuiz_itemsInput;
    upsert?: Prisma.assessmentsUpsertWithoutQuiz_itemsInput;
    disconnect?: Prisma.assessmentsWhereInput | boolean;
    delete?: Prisma.assessmentsWhereInput | boolean;
    connect?: Prisma.assessmentsWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.assessmentsUpdateToOneWithWhereWithoutQuiz_itemsInput, Prisma.assessmentsUpdateWithoutQuiz_itemsInput>, Prisma.assessmentsUncheckedUpdateWithoutQuiz_itemsInput>;
};
export type assessmentsCreateWithoutCoursesInput = {
    assessment_id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    category?: string;
    weight?: number | null;
    lo_assessments?: Prisma.lo_assessmentsCreateNestedManyWithoutAssessmentsInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutAssessmentsInput;
};
export type assessmentsUncheckedCreateWithoutCoursesInput = {
    assessment_id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    category?: string;
    weight?: number | null;
    lo_assessments?: Prisma.lo_assessmentsUncheckedCreateNestedManyWithoutAssessmentsInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutAssessmentsInput;
};
export type assessmentsCreateOrConnectWithoutCoursesInput = {
    where: Prisma.assessmentsWhereUniqueInput;
    create: Prisma.XOR<Prisma.assessmentsCreateWithoutCoursesInput, Prisma.assessmentsUncheckedCreateWithoutCoursesInput>;
};
export type assessmentsCreateManyCoursesInputEnvelope = {
    data: Prisma.assessmentsCreateManyCoursesInput | Prisma.assessmentsCreateManyCoursesInput[];
    skipDuplicates?: boolean;
};
export type assessmentsUpsertWithWhereUniqueWithoutCoursesInput = {
    where: Prisma.assessmentsWhereUniqueInput;
    update: Prisma.XOR<Prisma.assessmentsUpdateWithoutCoursesInput, Prisma.assessmentsUncheckedUpdateWithoutCoursesInput>;
    create: Prisma.XOR<Prisma.assessmentsCreateWithoutCoursesInput, Prisma.assessmentsUncheckedCreateWithoutCoursesInput>;
};
export type assessmentsUpdateWithWhereUniqueWithoutCoursesInput = {
    where: Prisma.assessmentsWhereUniqueInput;
    data: Prisma.XOR<Prisma.assessmentsUpdateWithoutCoursesInput, Prisma.assessmentsUncheckedUpdateWithoutCoursesInput>;
};
export type assessmentsUpdateManyWithWhereWithoutCoursesInput = {
    where: Prisma.assessmentsScalarWhereInput;
    data: Prisma.XOR<Prisma.assessmentsUpdateManyMutationInput, Prisma.assessmentsUncheckedUpdateManyWithoutCoursesInput>;
};
export type assessmentsScalarWhereInput = {
    AND?: Prisma.assessmentsScalarWhereInput | Prisma.assessmentsScalarWhereInput[];
    OR?: Prisma.assessmentsScalarWhereInput[];
    NOT?: Prisma.assessmentsScalarWhereInput | Prisma.assessmentsScalarWhereInput[];
    assessment_id?: Prisma.StringFilter<"assessments"> | string;
    course_id?: Prisma.StringFilter<"assessments"> | string;
    code?: Prisma.StringFilter<"assessments"> | string;
    name_vi?: Prisma.StringFilter<"assessments"> | string;
    name_en?: Prisma.StringNullableFilter<"assessments"> | string | null;
    category?: Prisma.StringFilter<"assessments"> | string;
    weight?: Prisma.FloatNullableFilter<"assessments"> | number | null;
};
export type assessmentsCreateWithoutLo_assessmentsInput = {
    assessment_id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    category?: string;
    weight?: number | null;
    courses: Prisma.coursesCreateNestedOneWithoutAssessmentsInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutAssessmentsInput;
};
export type assessmentsUncheckedCreateWithoutLo_assessmentsInput = {
    assessment_id: string;
    course_id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    category?: string;
    weight?: number | null;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutAssessmentsInput;
};
export type assessmentsCreateOrConnectWithoutLo_assessmentsInput = {
    where: Prisma.assessmentsWhereUniqueInput;
    create: Prisma.XOR<Prisma.assessmentsCreateWithoutLo_assessmentsInput, Prisma.assessmentsUncheckedCreateWithoutLo_assessmentsInput>;
};
export type assessmentsUpsertWithoutLo_assessmentsInput = {
    update: Prisma.XOR<Prisma.assessmentsUpdateWithoutLo_assessmentsInput, Prisma.assessmentsUncheckedUpdateWithoutLo_assessmentsInput>;
    create: Prisma.XOR<Prisma.assessmentsCreateWithoutLo_assessmentsInput, Prisma.assessmentsUncheckedCreateWithoutLo_assessmentsInput>;
    where?: Prisma.assessmentsWhereInput;
};
export type assessmentsUpdateToOneWithWhereWithoutLo_assessmentsInput = {
    where?: Prisma.assessmentsWhereInput;
    data: Prisma.XOR<Prisma.assessmentsUpdateWithoutLo_assessmentsInput, Prisma.assessmentsUncheckedUpdateWithoutLo_assessmentsInput>;
};
export type assessmentsUpdateWithoutLo_assessmentsInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    courses?: Prisma.coursesUpdateOneRequiredWithoutAssessmentsNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutAssessmentsNestedInput;
};
export type assessmentsUncheckedUpdateWithoutLo_assessmentsInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutAssessmentsNestedInput;
};
export type assessmentsCreateWithoutQuiz_itemsInput = {
    assessment_id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    category?: string;
    weight?: number | null;
    courses: Prisma.coursesCreateNestedOneWithoutAssessmentsInput;
    lo_assessments?: Prisma.lo_assessmentsCreateNestedManyWithoutAssessmentsInput;
};
export type assessmentsUncheckedCreateWithoutQuiz_itemsInput = {
    assessment_id: string;
    course_id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    category?: string;
    weight?: number | null;
    lo_assessments?: Prisma.lo_assessmentsUncheckedCreateNestedManyWithoutAssessmentsInput;
};
export type assessmentsCreateOrConnectWithoutQuiz_itemsInput = {
    where: Prisma.assessmentsWhereUniqueInput;
    create: Prisma.XOR<Prisma.assessmentsCreateWithoutQuiz_itemsInput, Prisma.assessmentsUncheckedCreateWithoutQuiz_itemsInput>;
};
export type assessmentsUpsertWithoutQuiz_itemsInput = {
    update: Prisma.XOR<Prisma.assessmentsUpdateWithoutQuiz_itemsInput, Prisma.assessmentsUncheckedUpdateWithoutQuiz_itemsInput>;
    create: Prisma.XOR<Prisma.assessmentsCreateWithoutQuiz_itemsInput, Prisma.assessmentsUncheckedCreateWithoutQuiz_itemsInput>;
    where?: Prisma.assessmentsWhereInput;
};
export type assessmentsUpdateToOneWithWhereWithoutQuiz_itemsInput = {
    where?: Prisma.assessmentsWhereInput;
    data: Prisma.XOR<Prisma.assessmentsUpdateWithoutQuiz_itemsInput, Prisma.assessmentsUncheckedUpdateWithoutQuiz_itemsInput>;
};
export type assessmentsUpdateWithoutQuiz_itemsInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    courses?: Prisma.coursesUpdateOneRequiredWithoutAssessmentsNestedInput;
    lo_assessments?: Prisma.lo_assessmentsUpdateManyWithoutAssessmentsNestedInput;
};
export type assessmentsUncheckedUpdateWithoutQuiz_itemsInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    lo_assessments?: Prisma.lo_assessmentsUncheckedUpdateManyWithoutAssessmentsNestedInput;
};
export type assessmentsCreateManyCoursesInput = {
    assessment_id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    category?: string;
    weight?: number | null;
};
export type assessmentsUpdateWithoutCoursesInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    lo_assessments?: Prisma.lo_assessmentsUpdateManyWithoutAssessmentsNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutAssessmentsNestedInput;
};
export type assessmentsUncheckedUpdateWithoutCoursesInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    lo_assessments?: Prisma.lo_assessmentsUncheckedUpdateManyWithoutAssessmentsNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutAssessmentsNestedInput;
};
export type assessmentsUncheckedUpdateManyWithoutCoursesInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    name_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    name_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    weight?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
};
export type AssessmentsCountOutputType = {
    lo_assessments: number;
    quiz_items: number;
};
export type AssessmentsCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    lo_assessments?: boolean | AssessmentsCountOutputTypeCountLo_assessmentsArgs;
    quiz_items?: boolean | AssessmentsCountOutputTypeCountQuiz_itemsArgs;
};
export type AssessmentsCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AssessmentsCountOutputTypeSelect<ExtArgs> | null;
};
export type AssessmentsCountOutputTypeCountLo_assessmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lo_assessmentsWhereInput;
};
export type AssessmentsCountOutputTypeCountQuiz_itemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.quiz_itemsWhereInput;
};
export type assessmentsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    assessment_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    name_vi?: boolean;
    name_en?: boolean;
    category?: boolean;
    weight?: boolean;
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
    lo_assessments?: boolean | Prisma.assessments$lo_assessmentsArgs<ExtArgs>;
    quiz_items?: boolean | Prisma.assessments$quiz_itemsArgs<ExtArgs>;
    _count?: boolean | Prisma.AssessmentsCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["assessments"]>;
export type assessmentsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    assessment_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    name_vi?: boolean;
    name_en?: boolean;
    category?: boolean;
    weight?: boolean;
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["assessments"]>;
export type assessmentsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    assessment_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    name_vi?: boolean;
    name_en?: boolean;
    category?: boolean;
    weight?: boolean;
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["assessments"]>;
export type assessmentsSelectScalar = {
    assessment_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    name_vi?: boolean;
    name_en?: boolean;
    category?: boolean;
    weight?: boolean;
};
export type assessmentsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"assessment_id" | "course_id" | "code" | "name_vi" | "name_en" | "category" | "weight", ExtArgs["result"]["assessments"]>;
export type assessmentsInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
    lo_assessments?: boolean | Prisma.assessments$lo_assessmentsArgs<ExtArgs>;
    quiz_items?: boolean | Prisma.assessments$quiz_itemsArgs<ExtArgs>;
    _count?: boolean | Prisma.AssessmentsCountOutputTypeDefaultArgs<ExtArgs>;
};
export type assessmentsIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
};
export type assessmentsIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
};
export type $assessmentsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "assessments";
    objects: {
        courses: Prisma.$coursesPayload<ExtArgs>;
        lo_assessments: Prisma.$lo_assessmentsPayload<ExtArgs>[];
        quiz_items: Prisma.$quiz_itemsPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        assessment_id: string;
        course_id: string;
        code: string;
        name_vi: string;
        name_en: string | null;
        category: string;
        weight: number | null;
    }, ExtArgs["result"]["assessments"]>;
    composites: {};
};
export type assessmentsGetPayload<S extends boolean | null | undefined | assessmentsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$assessmentsPayload, S>;
export type assessmentsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<assessmentsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AssessmentsCountAggregateInputType | true;
};
export interface assessmentsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['assessments'];
        meta: {
            name: 'assessments';
        };
    };
    findUnique<T extends assessmentsFindUniqueArgs>(args: Prisma.SelectSubset<T, assessmentsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__assessmentsClient<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends assessmentsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, assessmentsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__assessmentsClient<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends assessmentsFindFirstArgs>(args?: Prisma.SelectSubset<T, assessmentsFindFirstArgs<ExtArgs>>): Prisma.Prisma__assessmentsClient<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends assessmentsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, assessmentsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__assessmentsClient<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends assessmentsFindManyArgs>(args?: Prisma.SelectSubset<T, assessmentsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends assessmentsCreateArgs>(args: Prisma.SelectSubset<T, assessmentsCreateArgs<ExtArgs>>): Prisma.Prisma__assessmentsClient<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends assessmentsCreateManyArgs>(args?: Prisma.SelectSubset<T, assessmentsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends assessmentsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, assessmentsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends assessmentsDeleteArgs>(args: Prisma.SelectSubset<T, assessmentsDeleteArgs<ExtArgs>>): Prisma.Prisma__assessmentsClient<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends assessmentsUpdateArgs>(args: Prisma.SelectSubset<T, assessmentsUpdateArgs<ExtArgs>>): Prisma.Prisma__assessmentsClient<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends assessmentsDeleteManyArgs>(args?: Prisma.SelectSubset<T, assessmentsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends assessmentsUpdateManyArgs>(args: Prisma.SelectSubset<T, assessmentsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends assessmentsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, assessmentsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends assessmentsUpsertArgs>(args: Prisma.SelectSubset<T, assessmentsUpsertArgs<ExtArgs>>): Prisma.Prisma__assessmentsClient<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends assessmentsCountArgs>(args?: Prisma.Subset<T, assessmentsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AssessmentsCountAggregateOutputType> : number>;
    aggregate<T extends AssessmentsAggregateArgs>(args: Prisma.Subset<T, AssessmentsAggregateArgs>): Prisma.PrismaPromise<GetAssessmentsAggregateType<T>>;
    groupBy<T extends assessmentsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: assessmentsGroupByArgs['orderBy'];
    } : {
        orderBy?: assessmentsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, assessmentsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAssessmentsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: assessmentsFieldRefs;
}
export interface Prisma__assessmentsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    courses<T extends Prisma.coursesDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.coursesDefaultArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    lo_assessments<T extends Prisma.assessments$lo_assessmentsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.assessments$lo_assessmentsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    quiz_items<T extends Prisma.assessments$quiz_itemsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.assessments$quiz_itemsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface assessmentsFieldRefs {
    readonly assessment_id: Prisma.FieldRef<"assessments", 'String'>;
    readonly course_id: Prisma.FieldRef<"assessments", 'String'>;
    readonly code: Prisma.FieldRef<"assessments", 'String'>;
    readonly name_vi: Prisma.FieldRef<"assessments", 'String'>;
    readonly name_en: Prisma.FieldRef<"assessments", 'String'>;
    readonly category: Prisma.FieldRef<"assessments", 'String'>;
    readonly weight: Prisma.FieldRef<"assessments", 'Float'>;
}
export type assessmentsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
    where: Prisma.assessmentsWhereUniqueInput;
};
export type assessmentsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
    where: Prisma.assessmentsWhereUniqueInput;
};
export type assessmentsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
    where?: Prisma.assessmentsWhereInput;
    orderBy?: Prisma.assessmentsOrderByWithRelationInput | Prisma.assessmentsOrderByWithRelationInput[];
    cursor?: Prisma.assessmentsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AssessmentsScalarFieldEnum | Prisma.AssessmentsScalarFieldEnum[];
};
export type assessmentsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
    where?: Prisma.assessmentsWhereInput;
    orderBy?: Prisma.assessmentsOrderByWithRelationInput | Prisma.assessmentsOrderByWithRelationInput[];
    cursor?: Prisma.assessmentsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AssessmentsScalarFieldEnum | Prisma.AssessmentsScalarFieldEnum[];
};
export type assessmentsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
    where?: Prisma.assessmentsWhereInput;
    orderBy?: Prisma.assessmentsOrderByWithRelationInput | Prisma.assessmentsOrderByWithRelationInput[];
    cursor?: Prisma.assessmentsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AssessmentsScalarFieldEnum | Prisma.AssessmentsScalarFieldEnum[];
};
export type assessmentsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.assessmentsCreateInput, Prisma.assessmentsUncheckedCreateInput>;
};
export type assessmentsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.assessmentsCreateManyInput | Prisma.assessmentsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type assessmentsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    data: Prisma.assessmentsCreateManyInput | Prisma.assessmentsCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.assessmentsIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type assessmentsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.assessmentsUpdateInput, Prisma.assessmentsUncheckedUpdateInput>;
    where: Prisma.assessmentsWhereUniqueInput;
};
export type assessmentsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.assessmentsUpdateManyMutationInput, Prisma.assessmentsUncheckedUpdateManyInput>;
    where?: Prisma.assessmentsWhereInput;
    limit?: number;
};
export type assessmentsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.assessmentsUpdateManyMutationInput, Prisma.assessmentsUncheckedUpdateManyInput>;
    where?: Prisma.assessmentsWhereInput;
    limit?: number;
    include?: Prisma.assessmentsIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type assessmentsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
    where: Prisma.assessmentsWhereUniqueInput;
    create: Prisma.XOR<Prisma.assessmentsCreateInput, Prisma.assessmentsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.assessmentsUpdateInput, Prisma.assessmentsUncheckedUpdateInput>;
};
export type assessmentsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
    where: Prisma.assessmentsWhereUniqueInput;
};
export type assessmentsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.assessmentsWhereInput;
    limit?: number;
};
export type assessments$lo_assessmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type assessments$quiz_itemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type assessmentsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.assessmentsOmit<ExtArgs> | null;
    include?: Prisma.assessmentsInclude<ExtArgs> | null;
};
