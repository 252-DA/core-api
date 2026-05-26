import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type coursesModel = runtime.Types.Result.DefaultSelection<Prisma.$coursesPayload>;
export type AggregateCourses = {
    _count: CoursesCountAggregateOutputType | null;
    _avg: CoursesAvgAggregateOutputType | null;
    _sum: CoursesSumAggregateOutputType | null;
    _min: CoursesMinAggregateOutputType | null;
    _max: CoursesMaxAggregateOutputType | null;
};
export type CoursesAvgAggregateOutputType = {
    credits: number | null;
    extraction_confidence: number | null;
};
export type CoursesSumAggregateOutputType = {
    credits: number | null;
    extraction_confidence: number | null;
};
export type CoursesMinAggregateOutputType = {
    course_id: string | null;
    code: string | null;
    title_vi: string | null;
    title_en: string | null;
    credits: number | null;
    semester: string | null;
    source_document_id: string | null;
    extraction_confidence: number | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type CoursesMaxAggregateOutputType = {
    course_id: string | null;
    code: string | null;
    title_vi: string | null;
    title_en: string | null;
    credits: number | null;
    semester: string | null;
    source_document_id: string | null;
    extraction_confidence: number | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type CoursesCountAggregateOutputType = {
    course_id: number;
    code: number;
    title_vi: number;
    title_en: number;
    credits: number;
    semester: number;
    source_document_id: number;
    extraction_confidence: number;
    created_at: number;
    updated_at: number;
    _all: number;
};
export type CoursesAvgAggregateInputType = {
    credits?: true;
    extraction_confidence?: true;
};
export type CoursesSumAggregateInputType = {
    credits?: true;
    extraction_confidence?: true;
};
export type CoursesMinAggregateInputType = {
    course_id?: true;
    code?: true;
    title_vi?: true;
    title_en?: true;
    credits?: true;
    semester?: true;
    source_document_id?: true;
    extraction_confidence?: true;
    created_at?: true;
    updated_at?: true;
};
export type CoursesMaxAggregateInputType = {
    course_id?: true;
    code?: true;
    title_vi?: true;
    title_en?: true;
    credits?: true;
    semester?: true;
    source_document_id?: true;
    extraction_confidence?: true;
    created_at?: true;
    updated_at?: true;
};
export type CoursesCountAggregateInputType = {
    course_id?: true;
    code?: true;
    title_vi?: true;
    title_en?: true;
    credits?: true;
    semester?: true;
    source_document_id?: true;
    extraction_confidence?: true;
    created_at?: true;
    updated_at?: true;
    _all?: true;
};
export type CoursesAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.coursesWhereInput;
    orderBy?: Prisma.coursesOrderByWithRelationInput | Prisma.coursesOrderByWithRelationInput[];
    cursor?: Prisma.coursesWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | CoursesCountAggregateInputType;
    _avg?: CoursesAvgAggregateInputType;
    _sum?: CoursesSumAggregateInputType;
    _min?: CoursesMinAggregateInputType;
    _max?: CoursesMaxAggregateInputType;
};
export type GetCoursesAggregateType<T extends CoursesAggregateArgs> = {
    [P in keyof T & keyof AggregateCourses]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateCourses[P]> : Prisma.GetScalarType<T[P], AggregateCourses[P]>;
};
export type coursesGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.coursesWhereInput;
    orderBy?: Prisma.coursesOrderByWithAggregationInput | Prisma.coursesOrderByWithAggregationInput[];
    by: Prisma.CoursesScalarFieldEnum[] | Prisma.CoursesScalarFieldEnum;
    having?: Prisma.coursesScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CoursesCountAggregateInputType | true;
    _avg?: CoursesAvgAggregateInputType;
    _sum?: CoursesSumAggregateInputType;
    _min?: CoursesMinAggregateInputType;
    _max?: CoursesMaxAggregateInputType;
};
export type CoursesGroupByOutputType = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en: string | null;
    credits: number | null;
    semester: string | null;
    source_document_id: string | null;
    extraction_confidence: number;
    created_at: Date;
    updated_at: Date;
    _count: CoursesCountAggregateOutputType | null;
    _avg: CoursesAvgAggregateOutputType | null;
    _sum: CoursesSumAggregateOutputType | null;
    _min: CoursesMinAggregateOutputType | null;
    _max: CoursesMaxAggregateOutputType | null;
};
export type GetCoursesGroupByPayload<T extends coursesGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<CoursesGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof CoursesGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], CoursesGroupByOutputType[P]> : Prisma.GetScalarType<T[P], CoursesGroupByOutputType[P]>;
}>>;
export type coursesWhereInput = {
    AND?: Prisma.coursesWhereInput | Prisma.coursesWhereInput[];
    OR?: Prisma.coursesWhereInput[];
    NOT?: Prisma.coursesWhereInput | Prisma.coursesWhereInput[];
    course_id?: Prisma.StringFilter<"courses"> | string;
    code?: Prisma.StringFilter<"courses"> | string;
    title_vi?: Prisma.StringFilter<"courses"> | string;
    title_en?: Prisma.StringNullableFilter<"courses"> | string | null;
    credits?: Prisma.IntNullableFilter<"courses"> | number | null;
    semester?: Prisma.StringNullableFilter<"courses"> | string | null;
    source_document_id?: Prisma.StringNullableFilter<"courses"> | string | null;
    extraction_confidence?: Prisma.FloatFilter<"courses"> | number;
    created_at?: Prisma.DateTimeFilter<"courses"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"courses"> | Date | string;
    assessments?: Prisma.AssessmentsListRelationFilter;
    chapters?: Prisma.ChaptersListRelationFilter;
    documents_metadata?: Prisma.XOR<Prisma.Documents_metadataNullableScalarRelationFilter, Prisma.documents_metadataWhereInput> | null;
    learning_outcomes?: Prisma.Learning_outcomesListRelationFilter;
    lms_course_ref?: Prisma.Lms_course_refListRelationFilter;
};
export type coursesOrderByWithRelationInput = {
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    title_vi?: Prisma.SortOrder;
    title_en?: Prisma.SortOrderInput | Prisma.SortOrder;
    credits?: Prisma.SortOrderInput | Prisma.SortOrder;
    semester?: Prisma.SortOrderInput | Prisma.SortOrder;
    source_document_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    extraction_confidence?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    assessments?: Prisma.assessmentsOrderByRelationAggregateInput;
    chapters?: Prisma.chaptersOrderByRelationAggregateInput;
    documents_metadata?: Prisma.documents_metadataOrderByWithRelationInput;
    learning_outcomes?: Prisma.learning_outcomesOrderByRelationAggregateInput;
    lms_course_ref?: Prisma.lms_course_refOrderByRelationAggregateInput;
};
export type coursesWhereUniqueInput = Prisma.AtLeast<{
    course_id?: string;
    code?: string;
    AND?: Prisma.coursesWhereInput | Prisma.coursesWhereInput[];
    OR?: Prisma.coursesWhereInput[];
    NOT?: Prisma.coursesWhereInput | Prisma.coursesWhereInput[];
    title_vi?: Prisma.StringFilter<"courses"> | string;
    title_en?: Prisma.StringNullableFilter<"courses"> | string | null;
    credits?: Prisma.IntNullableFilter<"courses"> | number | null;
    semester?: Prisma.StringNullableFilter<"courses"> | string | null;
    source_document_id?: Prisma.StringNullableFilter<"courses"> | string | null;
    extraction_confidence?: Prisma.FloatFilter<"courses"> | number;
    created_at?: Prisma.DateTimeFilter<"courses"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"courses"> | Date | string;
    assessments?: Prisma.AssessmentsListRelationFilter;
    chapters?: Prisma.ChaptersListRelationFilter;
    documents_metadata?: Prisma.XOR<Prisma.Documents_metadataNullableScalarRelationFilter, Prisma.documents_metadataWhereInput> | null;
    learning_outcomes?: Prisma.Learning_outcomesListRelationFilter;
    lms_course_ref?: Prisma.Lms_course_refListRelationFilter;
}, "course_id" | "code">;
export type coursesOrderByWithAggregationInput = {
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    title_vi?: Prisma.SortOrder;
    title_en?: Prisma.SortOrderInput | Prisma.SortOrder;
    credits?: Prisma.SortOrderInput | Prisma.SortOrder;
    semester?: Prisma.SortOrderInput | Prisma.SortOrder;
    source_document_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    extraction_confidence?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    _count?: Prisma.coursesCountOrderByAggregateInput;
    _avg?: Prisma.coursesAvgOrderByAggregateInput;
    _max?: Prisma.coursesMaxOrderByAggregateInput;
    _min?: Prisma.coursesMinOrderByAggregateInput;
    _sum?: Prisma.coursesSumOrderByAggregateInput;
};
export type coursesScalarWhereWithAggregatesInput = {
    AND?: Prisma.coursesScalarWhereWithAggregatesInput | Prisma.coursesScalarWhereWithAggregatesInput[];
    OR?: Prisma.coursesScalarWhereWithAggregatesInput[];
    NOT?: Prisma.coursesScalarWhereWithAggregatesInput | Prisma.coursesScalarWhereWithAggregatesInput[];
    course_id?: Prisma.StringWithAggregatesFilter<"courses"> | string;
    code?: Prisma.StringWithAggregatesFilter<"courses"> | string;
    title_vi?: Prisma.StringWithAggregatesFilter<"courses"> | string;
    title_en?: Prisma.StringNullableWithAggregatesFilter<"courses"> | string | null;
    credits?: Prisma.IntNullableWithAggregatesFilter<"courses"> | number | null;
    semester?: Prisma.StringNullableWithAggregatesFilter<"courses"> | string | null;
    source_document_id?: Prisma.StringNullableWithAggregatesFilter<"courses"> | string | null;
    extraction_confidence?: Prisma.FloatWithAggregatesFilter<"courses"> | number;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"courses"> | Date | string;
    updated_at?: Prisma.DateTimeWithAggregatesFilter<"courses"> | Date | string;
};
export type coursesCreateInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    assessments?: Prisma.assessmentsCreateNestedManyWithoutCoursesInput;
    chapters?: Prisma.chaptersCreateNestedManyWithoutCoursesInput;
    documents_metadata?: Prisma.documents_metadataCreateNestedOneWithoutCoursesInput;
    learning_outcomes?: Prisma.learning_outcomesCreateNestedManyWithoutCoursesInput;
    lms_course_ref?: Prisma.lms_course_refCreateNestedManyWithoutCoursesInput;
};
export type coursesUncheckedCreateInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    source_document_id?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    assessments?: Prisma.assessmentsUncheckedCreateNestedManyWithoutCoursesInput;
    chapters?: Prisma.chaptersUncheckedCreateNestedManyWithoutCoursesInput;
    learning_outcomes?: Prisma.learning_outcomesUncheckedCreateNestedManyWithoutCoursesInput;
    lms_course_ref?: Prisma.lms_course_refUncheckedCreateNestedManyWithoutCoursesInput;
};
export type coursesUpdateInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessments?: Prisma.assessmentsUpdateManyWithoutCoursesNestedInput;
    chapters?: Prisma.chaptersUpdateManyWithoutCoursesNestedInput;
    documents_metadata?: Prisma.documents_metadataUpdateOneWithoutCoursesNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateManyWithoutCoursesNestedInput;
    lms_course_ref?: Prisma.lms_course_refUpdateManyWithoutCoursesNestedInput;
};
export type coursesUncheckedUpdateInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    source_document_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessments?: Prisma.assessmentsUncheckedUpdateManyWithoutCoursesNestedInput;
    chapters?: Prisma.chaptersUncheckedUpdateManyWithoutCoursesNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUncheckedUpdateManyWithoutCoursesNestedInput;
    lms_course_ref?: Prisma.lms_course_refUncheckedUpdateManyWithoutCoursesNestedInput;
};
export type coursesCreateManyInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    source_document_id?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type coursesUpdateManyMutationInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type coursesUncheckedUpdateManyInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    source_document_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CoursesScalarRelationFilter = {
    is?: Prisma.coursesWhereInput;
    isNot?: Prisma.coursesWhereInput;
};
export type coursesCountOrderByAggregateInput = {
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    title_vi?: Prisma.SortOrder;
    title_en?: Prisma.SortOrder;
    credits?: Prisma.SortOrder;
    semester?: Prisma.SortOrder;
    source_document_id?: Prisma.SortOrder;
    extraction_confidence?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type coursesAvgOrderByAggregateInput = {
    credits?: Prisma.SortOrder;
    extraction_confidence?: Prisma.SortOrder;
};
export type coursesMaxOrderByAggregateInput = {
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    title_vi?: Prisma.SortOrder;
    title_en?: Prisma.SortOrder;
    credits?: Prisma.SortOrder;
    semester?: Prisma.SortOrder;
    source_document_id?: Prisma.SortOrder;
    extraction_confidence?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type coursesMinOrderByAggregateInput = {
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    title_vi?: Prisma.SortOrder;
    title_en?: Prisma.SortOrder;
    credits?: Prisma.SortOrder;
    semester?: Prisma.SortOrder;
    source_document_id?: Prisma.SortOrder;
    extraction_confidence?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type coursesSumOrderByAggregateInput = {
    credits?: Prisma.SortOrder;
    extraction_confidence?: Prisma.SortOrder;
};
export type CoursesListRelationFilter = {
    every?: Prisma.coursesWhereInput;
    some?: Prisma.coursesWhereInput;
    none?: Prisma.coursesWhereInput;
};
export type coursesOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type CoursesNullableScalarRelationFilter = {
    is?: Prisma.coursesWhereInput | null;
    isNot?: Prisma.coursesWhereInput | null;
};
export type coursesCreateNestedOneWithoutAssessmentsInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutAssessmentsInput, Prisma.coursesUncheckedCreateWithoutAssessmentsInput>;
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutAssessmentsInput;
    connect?: Prisma.coursesWhereUniqueInput;
};
export type coursesUpdateOneRequiredWithoutAssessmentsNestedInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutAssessmentsInput, Prisma.coursesUncheckedCreateWithoutAssessmentsInput>;
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutAssessmentsInput;
    upsert?: Prisma.coursesUpsertWithoutAssessmentsInput;
    connect?: Prisma.coursesWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.coursesUpdateToOneWithWhereWithoutAssessmentsInput, Prisma.coursesUpdateWithoutAssessmentsInput>, Prisma.coursesUncheckedUpdateWithoutAssessmentsInput>;
};
export type coursesCreateNestedOneWithoutChaptersInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutChaptersInput, Prisma.coursesUncheckedCreateWithoutChaptersInput>;
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutChaptersInput;
    connect?: Prisma.coursesWhereUniqueInput;
};
export type coursesUpdateOneRequiredWithoutChaptersNestedInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutChaptersInput, Prisma.coursesUncheckedCreateWithoutChaptersInput>;
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutChaptersInput;
    upsert?: Prisma.coursesUpsertWithoutChaptersInput;
    connect?: Prisma.coursesWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.coursesUpdateToOneWithWhereWithoutChaptersInput, Prisma.coursesUpdateWithoutChaptersInput>, Prisma.coursesUncheckedUpdateWithoutChaptersInput>;
};
export type coursesCreateNestedManyWithoutDocuments_metadataInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutDocuments_metadataInput, Prisma.coursesUncheckedCreateWithoutDocuments_metadataInput> | Prisma.coursesCreateWithoutDocuments_metadataInput[] | Prisma.coursesUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutDocuments_metadataInput | Prisma.coursesCreateOrConnectWithoutDocuments_metadataInput[];
    createMany?: Prisma.coursesCreateManyDocuments_metadataInputEnvelope;
    connect?: Prisma.coursesWhereUniqueInput | Prisma.coursesWhereUniqueInput[];
};
export type coursesUncheckedCreateNestedManyWithoutDocuments_metadataInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutDocuments_metadataInput, Prisma.coursesUncheckedCreateWithoutDocuments_metadataInput> | Prisma.coursesCreateWithoutDocuments_metadataInput[] | Prisma.coursesUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutDocuments_metadataInput | Prisma.coursesCreateOrConnectWithoutDocuments_metadataInput[];
    createMany?: Prisma.coursesCreateManyDocuments_metadataInputEnvelope;
    connect?: Prisma.coursesWhereUniqueInput | Prisma.coursesWhereUniqueInput[];
};
export type coursesUpdateManyWithoutDocuments_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutDocuments_metadataInput, Prisma.coursesUncheckedCreateWithoutDocuments_metadataInput> | Prisma.coursesCreateWithoutDocuments_metadataInput[] | Prisma.coursesUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutDocuments_metadataInput | Prisma.coursesCreateOrConnectWithoutDocuments_metadataInput[];
    upsert?: Prisma.coursesUpsertWithWhereUniqueWithoutDocuments_metadataInput | Prisma.coursesUpsertWithWhereUniqueWithoutDocuments_metadataInput[];
    createMany?: Prisma.coursesCreateManyDocuments_metadataInputEnvelope;
    set?: Prisma.coursesWhereUniqueInput | Prisma.coursesWhereUniqueInput[];
    disconnect?: Prisma.coursesWhereUniqueInput | Prisma.coursesWhereUniqueInput[];
    delete?: Prisma.coursesWhereUniqueInput | Prisma.coursesWhereUniqueInput[];
    connect?: Prisma.coursesWhereUniqueInput | Prisma.coursesWhereUniqueInput[];
    update?: Prisma.coursesUpdateWithWhereUniqueWithoutDocuments_metadataInput | Prisma.coursesUpdateWithWhereUniqueWithoutDocuments_metadataInput[];
    updateMany?: Prisma.coursesUpdateManyWithWhereWithoutDocuments_metadataInput | Prisma.coursesUpdateManyWithWhereWithoutDocuments_metadataInput[];
    deleteMany?: Prisma.coursesScalarWhereInput | Prisma.coursesScalarWhereInput[];
};
export type coursesUncheckedUpdateManyWithoutDocuments_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutDocuments_metadataInput, Prisma.coursesUncheckedCreateWithoutDocuments_metadataInput> | Prisma.coursesCreateWithoutDocuments_metadataInput[] | Prisma.coursesUncheckedCreateWithoutDocuments_metadataInput[];
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutDocuments_metadataInput | Prisma.coursesCreateOrConnectWithoutDocuments_metadataInput[];
    upsert?: Prisma.coursesUpsertWithWhereUniqueWithoutDocuments_metadataInput | Prisma.coursesUpsertWithWhereUniqueWithoutDocuments_metadataInput[];
    createMany?: Prisma.coursesCreateManyDocuments_metadataInputEnvelope;
    set?: Prisma.coursesWhereUniqueInput | Prisma.coursesWhereUniqueInput[];
    disconnect?: Prisma.coursesWhereUniqueInput | Prisma.coursesWhereUniqueInput[];
    delete?: Prisma.coursesWhereUniqueInput | Prisma.coursesWhereUniqueInput[];
    connect?: Prisma.coursesWhereUniqueInput | Prisma.coursesWhereUniqueInput[];
    update?: Prisma.coursesUpdateWithWhereUniqueWithoutDocuments_metadataInput | Prisma.coursesUpdateWithWhereUniqueWithoutDocuments_metadataInput[];
    updateMany?: Prisma.coursesUpdateManyWithWhereWithoutDocuments_metadataInput | Prisma.coursesUpdateManyWithWhereWithoutDocuments_metadataInput[];
    deleteMany?: Prisma.coursesScalarWhereInput | Prisma.coursesScalarWhereInput[];
};
export type coursesCreateNestedOneWithoutLearning_outcomesInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutLearning_outcomesInput, Prisma.coursesUncheckedCreateWithoutLearning_outcomesInput>;
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutLearning_outcomesInput;
    connect?: Prisma.coursesWhereUniqueInput;
};
export type coursesUpdateOneRequiredWithoutLearning_outcomesNestedInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutLearning_outcomesInput, Prisma.coursesUncheckedCreateWithoutLearning_outcomesInput>;
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutLearning_outcomesInput;
    upsert?: Prisma.coursesUpsertWithoutLearning_outcomesInput;
    connect?: Prisma.coursesWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.coursesUpdateToOneWithWhereWithoutLearning_outcomesInput, Prisma.coursesUpdateWithoutLearning_outcomesInput>, Prisma.coursesUncheckedUpdateWithoutLearning_outcomesInput>;
};
export type coursesCreateNestedOneWithoutLms_course_refInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutLms_course_refInput, Prisma.coursesUncheckedCreateWithoutLms_course_refInput>;
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutLms_course_refInput;
    connect?: Prisma.coursesWhereUniqueInput;
};
export type coursesUpdateOneWithoutLms_course_refNestedInput = {
    create?: Prisma.XOR<Prisma.coursesCreateWithoutLms_course_refInput, Prisma.coursesUncheckedCreateWithoutLms_course_refInput>;
    connectOrCreate?: Prisma.coursesCreateOrConnectWithoutLms_course_refInput;
    upsert?: Prisma.coursesUpsertWithoutLms_course_refInput;
    disconnect?: Prisma.coursesWhereInput | boolean;
    delete?: Prisma.coursesWhereInput | boolean;
    connect?: Prisma.coursesWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.coursesUpdateToOneWithWhereWithoutLms_course_refInput, Prisma.coursesUpdateWithoutLms_course_refInput>, Prisma.coursesUncheckedUpdateWithoutLms_course_refInput>;
};
export type coursesCreateWithoutAssessmentsInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    chapters?: Prisma.chaptersCreateNestedManyWithoutCoursesInput;
    documents_metadata?: Prisma.documents_metadataCreateNestedOneWithoutCoursesInput;
    learning_outcomes?: Prisma.learning_outcomesCreateNestedManyWithoutCoursesInput;
    lms_course_ref?: Prisma.lms_course_refCreateNestedManyWithoutCoursesInput;
};
export type coursesUncheckedCreateWithoutAssessmentsInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    source_document_id?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    chapters?: Prisma.chaptersUncheckedCreateNestedManyWithoutCoursesInput;
    learning_outcomes?: Prisma.learning_outcomesUncheckedCreateNestedManyWithoutCoursesInput;
    lms_course_ref?: Prisma.lms_course_refUncheckedCreateNestedManyWithoutCoursesInput;
};
export type coursesCreateOrConnectWithoutAssessmentsInput = {
    where: Prisma.coursesWhereUniqueInput;
    create: Prisma.XOR<Prisma.coursesCreateWithoutAssessmentsInput, Prisma.coursesUncheckedCreateWithoutAssessmentsInput>;
};
export type coursesUpsertWithoutAssessmentsInput = {
    update: Prisma.XOR<Prisma.coursesUpdateWithoutAssessmentsInput, Prisma.coursesUncheckedUpdateWithoutAssessmentsInput>;
    create: Prisma.XOR<Prisma.coursesCreateWithoutAssessmentsInput, Prisma.coursesUncheckedCreateWithoutAssessmentsInput>;
    where?: Prisma.coursesWhereInput;
};
export type coursesUpdateToOneWithWhereWithoutAssessmentsInput = {
    where?: Prisma.coursesWhereInput;
    data: Prisma.XOR<Prisma.coursesUpdateWithoutAssessmentsInput, Prisma.coursesUncheckedUpdateWithoutAssessmentsInput>;
};
export type coursesUpdateWithoutAssessmentsInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chapters?: Prisma.chaptersUpdateManyWithoutCoursesNestedInput;
    documents_metadata?: Prisma.documents_metadataUpdateOneWithoutCoursesNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateManyWithoutCoursesNestedInput;
    lms_course_ref?: Prisma.lms_course_refUpdateManyWithoutCoursesNestedInput;
};
export type coursesUncheckedUpdateWithoutAssessmentsInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    source_document_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chapters?: Prisma.chaptersUncheckedUpdateManyWithoutCoursesNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUncheckedUpdateManyWithoutCoursesNestedInput;
    lms_course_ref?: Prisma.lms_course_refUncheckedUpdateManyWithoutCoursesNestedInput;
};
export type coursesCreateWithoutChaptersInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    assessments?: Prisma.assessmentsCreateNestedManyWithoutCoursesInput;
    documents_metadata?: Prisma.documents_metadataCreateNestedOneWithoutCoursesInput;
    learning_outcomes?: Prisma.learning_outcomesCreateNestedManyWithoutCoursesInput;
    lms_course_ref?: Prisma.lms_course_refCreateNestedManyWithoutCoursesInput;
};
export type coursesUncheckedCreateWithoutChaptersInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    source_document_id?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    assessments?: Prisma.assessmentsUncheckedCreateNestedManyWithoutCoursesInput;
    learning_outcomes?: Prisma.learning_outcomesUncheckedCreateNestedManyWithoutCoursesInput;
    lms_course_ref?: Prisma.lms_course_refUncheckedCreateNestedManyWithoutCoursesInput;
};
export type coursesCreateOrConnectWithoutChaptersInput = {
    where: Prisma.coursesWhereUniqueInput;
    create: Prisma.XOR<Prisma.coursesCreateWithoutChaptersInput, Prisma.coursesUncheckedCreateWithoutChaptersInput>;
};
export type coursesUpsertWithoutChaptersInput = {
    update: Prisma.XOR<Prisma.coursesUpdateWithoutChaptersInput, Prisma.coursesUncheckedUpdateWithoutChaptersInput>;
    create: Prisma.XOR<Prisma.coursesCreateWithoutChaptersInput, Prisma.coursesUncheckedCreateWithoutChaptersInput>;
    where?: Prisma.coursesWhereInput;
};
export type coursesUpdateToOneWithWhereWithoutChaptersInput = {
    where?: Prisma.coursesWhereInput;
    data: Prisma.XOR<Prisma.coursesUpdateWithoutChaptersInput, Prisma.coursesUncheckedUpdateWithoutChaptersInput>;
};
export type coursesUpdateWithoutChaptersInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessments?: Prisma.assessmentsUpdateManyWithoutCoursesNestedInput;
    documents_metadata?: Prisma.documents_metadataUpdateOneWithoutCoursesNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateManyWithoutCoursesNestedInput;
    lms_course_ref?: Prisma.lms_course_refUpdateManyWithoutCoursesNestedInput;
};
export type coursesUncheckedUpdateWithoutChaptersInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    source_document_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessments?: Prisma.assessmentsUncheckedUpdateManyWithoutCoursesNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUncheckedUpdateManyWithoutCoursesNestedInput;
    lms_course_ref?: Prisma.lms_course_refUncheckedUpdateManyWithoutCoursesNestedInput;
};
export type coursesCreateWithoutDocuments_metadataInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    assessments?: Prisma.assessmentsCreateNestedManyWithoutCoursesInput;
    chapters?: Prisma.chaptersCreateNestedManyWithoutCoursesInput;
    learning_outcomes?: Prisma.learning_outcomesCreateNestedManyWithoutCoursesInput;
    lms_course_ref?: Prisma.lms_course_refCreateNestedManyWithoutCoursesInput;
};
export type coursesUncheckedCreateWithoutDocuments_metadataInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    assessments?: Prisma.assessmentsUncheckedCreateNestedManyWithoutCoursesInput;
    chapters?: Prisma.chaptersUncheckedCreateNestedManyWithoutCoursesInput;
    learning_outcomes?: Prisma.learning_outcomesUncheckedCreateNestedManyWithoutCoursesInput;
    lms_course_ref?: Prisma.lms_course_refUncheckedCreateNestedManyWithoutCoursesInput;
};
export type coursesCreateOrConnectWithoutDocuments_metadataInput = {
    where: Prisma.coursesWhereUniqueInput;
    create: Prisma.XOR<Prisma.coursesCreateWithoutDocuments_metadataInput, Prisma.coursesUncheckedCreateWithoutDocuments_metadataInput>;
};
export type coursesCreateManyDocuments_metadataInputEnvelope = {
    data: Prisma.coursesCreateManyDocuments_metadataInput | Prisma.coursesCreateManyDocuments_metadataInput[];
    skipDuplicates?: boolean;
};
export type coursesUpsertWithWhereUniqueWithoutDocuments_metadataInput = {
    where: Prisma.coursesWhereUniqueInput;
    update: Prisma.XOR<Prisma.coursesUpdateWithoutDocuments_metadataInput, Prisma.coursesUncheckedUpdateWithoutDocuments_metadataInput>;
    create: Prisma.XOR<Prisma.coursesCreateWithoutDocuments_metadataInput, Prisma.coursesUncheckedCreateWithoutDocuments_metadataInput>;
};
export type coursesUpdateWithWhereUniqueWithoutDocuments_metadataInput = {
    where: Prisma.coursesWhereUniqueInput;
    data: Prisma.XOR<Prisma.coursesUpdateWithoutDocuments_metadataInput, Prisma.coursesUncheckedUpdateWithoutDocuments_metadataInput>;
};
export type coursesUpdateManyWithWhereWithoutDocuments_metadataInput = {
    where: Prisma.coursesScalarWhereInput;
    data: Prisma.XOR<Prisma.coursesUpdateManyMutationInput, Prisma.coursesUncheckedUpdateManyWithoutDocuments_metadataInput>;
};
export type coursesScalarWhereInput = {
    AND?: Prisma.coursesScalarWhereInput | Prisma.coursesScalarWhereInput[];
    OR?: Prisma.coursesScalarWhereInput[];
    NOT?: Prisma.coursesScalarWhereInput | Prisma.coursesScalarWhereInput[];
    course_id?: Prisma.StringFilter<"courses"> | string;
    code?: Prisma.StringFilter<"courses"> | string;
    title_vi?: Prisma.StringFilter<"courses"> | string;
    title_en?: Prisma.StringNullableFilter<"courses"> | string | null;
    credits?: Prisma.IntNullableFilter<"courses"> | number | null;
    semester?: Prisma.StringNullableFilter<"courses"> | string | null;
    source_document_id?: Prisma.StringNullableFilter<"courses"> | string | null;
    extraction_confidence?: Prisma.FloatFilter<"courses"> | number;
    created_at?: Prisma.DateTimeFilter<"courses"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"courses"> | Date | string;
};
export type coursesCreateWithoutLearning_outcomesInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    assessments?: Prisma.assessmentsCreateNestedManyWithoutCoursesInput;
    chapters?: Prisma.chaptersCreateNestedManyWithoutCoursesInput;
    documents_metadata?: Prisma.documents_metadataCreateNestedOneWithoutCoursesInput;
    lms_course_ref?: Prisma.lms_course_refCreateNestedManyWithoutCoursesInput;
};
export type coursesUncheckedCreateWithoutLearning_outcomesInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    source_document_id?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    assessments?: Prisma.assessmentsUncheckedCreateNestedManyWithoutCoursesInput;
    chapters?: Prisma.chaptersUncheckedCreateNestedManyWithoutCoursesInput;
    lms_course_ref?: Prisma.lms_course_refUncheckedCreateNestedManyWithoutCoursesInput;
};
export type coursesCreateOrConnectWithoutLearning_outcomesInput = {
    where: Prisma.coursesWhereUniqueInput;
    create: Prisma.XOR<Prisma.coursesCreateWithoutLearning_outcomesInput, Prisma.coursesUncheckedCreateWithoutLearning_outcomesInput>;
};
export type coursesUpsertWithoutLearning_outcomesInput = {
    update: Prisma.XOR<Prisma.coursesUpdateWithoutLearning_outcomesInput, Prisma.coursesUncheckedUpdateWithoutLearning_outcomesInput>;
    create: Prisma.XOR<Prisma.coursesCreateWithoutLearning_outcomesInput, Prisma.coursesUncheckedCreateWithoutLearning_outcomesInput>;
    where?: Prisma.coursesWhereInput;
};
export type coursesUpdateToOneWithWhereWithoutLearning_outcomesInput = {
    where?: Prisma.coursesWhereInput;
    data: Prisma.XOR<Prisma.coursesUpdateWithoutLearning_outcomesInput, Prisma.coursesUncheckedUpdateWithoutLearning_outcomesInput>;
};
export type coursesUpdateWithoutLearning_outcomesInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessments?: Prisma.assessmentsUpdateManyWithoutCoursesNestedInput;
    chapters?: Prisma.chaptersUpdateManyWithoutCoursesNestedInput;
    documents_metadata?: Prisma.documents_metadataUpdateOneWithoutCoursesNestedInput;
    lms_course_ref?: Prisma.lms_course_refUpdateManyWithoutCoursesNestedInput;
};
export type coursesUncheckedUpdateWithoutLearning_outcomesInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    source_document_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessments?: Prisma.assessmentsUncheckedUpdateManyWithoutCoursesNestedInput;
    chapters?: Prisma.chaptersUncheckedUpdateManyWithoutCoursesNestedInput;
    lms_course_ref?: Prisma.lms_course_refUncheckedUpdateManyWithoutCoursesNestedInput;
};
export type coursesCreateWithoutLms_course_refInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    assessments?: Prisma.assessmentsCreateNestedManyWithoutCoursesInput;
    chapters?: Prisma.chaptersCreateNestedManyWithoutCoursesInput;
    documents_metadata?: Prisma.documents_metadataCreateNestedOneWithoutCoursesInput;
    learning_outcomes?: Prisma.learning_outcomesCreateNestedManyWithoutCoursesInput;
};
export type coursesUncheckedCreateWithoutLms_course_refInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    source_document_id?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    assessments?: Prisma.assessmentsUncheckedCreateNestedManyWithoutCoursesInput;
    chapters?: Prisma.chaptersUncheckedCreateNestedManyWithoutCoursesInput;
    learning_outcomes?: Prisma.learning_outcomesUncheckedCreateNestedManyWithoutCoursesInput;
};
export type coursesCreateOrConnectWithoutLms_course_refInput = {
    where: Prisma.coursesWhereUniqueInput;
    create: Prisma.XOR<Prisma.coursesCreateWithoutLms_course_refInput, Prisma.coursesUncheckedCreateWithoutLms_course_refInput>;
};
export type coursesUpsertWithoutLms_course_refInput = {
    update: Prisma.XOR<Prisma.coursesUpdateWithoutLms_course_refInput, Prisma.coursesUncheckedUpdateWithoutLms_course_refInput>;
    create: Prisma.XOR<Prisma.coursesCreateWithoutLms_course_refInput, Prisma.coursesUncheckedCreateWithoutLms_course_refInput>;
    where?: Prisma.coursesWhereInput;
};
export type coursesUpdateToOneWithWhereWithoutLms_course_refInput = {
    where?: Prisma.coursesWhereInput;
    data: Prisma.XOR<Prisma.coursesUpdateWithoutLms_course_refInput, Prisma.coursesUncheckedUpdateWithoutLms_course_refInput>;
};
export type coursesUpdateWithoutLms_course_refInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessments?: Prisma.assessmentsUpdateManyWithoutCoursesNestedInput;
    chapters?: Prisma.chaptersUpdateManyWithoutCoursesNestedInput;
    documents_metadata?: Prisma.documents_metadataUpdateOneWithoutCoursesNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateManyWithoutCoursesNestedInput;
};
export type coursesUncheckedUpdateWithoutLms_course_refInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    source_document_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessments?: Prisma.assessmentsUncheckedUpdateManyWithoutCoursesNestedInput;
    chapters?: Prisma.chaptersUncheckedUpdateManyWithoutCoursesNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUncheckedUpdateManyWithoutCoursesNestedInput;
};
export type coursesCreateManyDocuments_metadataInput = {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string | null;
    credits?: number | null;
    semester?: string | null;
    extraction_confidence?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type coursesUpdateWithoutDocuments_metadataInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessments?: Prisma.assessmentsUpdateManyWithoutCoursesNestedInput;
    chapters?: Prisma.chaptersUpdateManyWithoutCoursesNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateManyWithoutCoursesNestedInput;
    lms_course_ref?: Prisma.lms_course_refUpdateManyWithoutCoursesNestedInput;
};
export type coursesUncheckedUpdateWithoutDocuments_metadataInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    assessments?: Prisma.assessmentsUncheckedUpdateManyWithoutCoursesNestedInput;
    chapters?: Prisma.chaptersUncheckedUpdateManyWithoutCoursesNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUncheckedUpdateManyWithoutCoursesNestedInput;
    lms_course_ref?: Prisma.lms_course_refUncheckedUpdateManyWithoutCoursesNestedInput;
};
export type coursesUncheckedUpdateManyWithoutDocuments_metadataInput = {
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title_vi?: Prisma.StringFieldUpdateOperationsInput | string;
    title_en?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    credits?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    semester?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    extraction_confidence?: Prisma.FloatFieldUpdateOperationsInput | number;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CoursesCountOutputType = {
    assessments: number;
    chapters: number;
    learning_outcomes: number;
    lms_course_ref: number;
};
export type CoursesCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    assessments?: boolean | CoursesCountOutputTypeCountAssessmentsArgs;
    chapters?: boolean | CoursesCountOutputTypeCountChaptersArgs;
    learning_outcomes?: boolean | CoursesCountOutputTypeCountLearning_outcomesArgs;
    lms_course_ref?: boolean | CoursesCountOutputTypeCountLms_course_refArgs;
};
export type CoursesCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CoursesCountOutputTypeSelect<ExtArgs> | null;
};
export type CoursesCountOutputTypeCountAssessmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.assessmentsWhereInput;
};
export type CoursesCountOutputTypeCountChaptersArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chaptersWhereInput;
};
export type CoursesCountOutputTypeCountLearning_outcomesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.learning_outcomesWhereInput;
};
export type CoursesCountOutputTypeCountLms_course_refArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lms_course_refWhereInput;
};
export type coursesSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    course_id?: boolean;
    code?: boolean;
    title_vi?: boolean;
    title_en?: boolean;
    credits?: boolean;
    semester?: boolean;
    source_document_id?: boolean;
    extraction_confidence?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
    assessments?: boolean | Prisma.courses$assessmentsArgs<ExtArgs>;
    chapters?: boolean | Prisma.courses$chaptersArgs<ExtArgs>;
    documents_metadata?: boolean | Prisma.courses$documents_metadataArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.courses$learning_outcomesArgs<ExtArgs>;
    lms_course_ref?: boolean | Prisma.courses$lms_course_refArgs<ExtArgs>;
    _count?: boolean | Prisma.CoursesCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["courses"]>;
export type coursesSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    course_id?: boolean;
    code?: boolean;
    title_vi?: boolean;
    title_en?: boolean;
    credits?: boolean;
    semester?: boolean;
    source_document_id?: boolean;
    extraction_confidence?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
    documents_metadata?: boolean | Prisma.courses$documents_metadataArgs<ExtArgs>;
}, ExtArgs["result"]["courses"]>;
export type coursesSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    course_id?: boolean;
    code?: boolean;
    title_vi?: boolean;
    title_en?: boolean;
    credits?: boolean;
    semester?: boolean;
    source_document_id?: boolean;
    extraction_confidence?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
    documents_metadata?: boolean | Prisma.courses$documents_metadataArgs<ExtArgs>;
}, ExtArgs["result"]["courses"]>;
export type coursesSelectScalar = {
    course_id?: boolean;
    code?: boolean;
    title_vi?: boolean;
    title_en?: boolean;
    credits?: boolean;
    semester?: boolean;
    source_document_id?: boolean;
    extraction_confidence?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
};
export type coursesOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"course_id" | "code" | "title_vi" | "title_en" | "credits" | "semester" | "source_document_id" | "extraction_confidence" | "created_at" | "updated_at", ExtArgs["result"]["courses"]>;
export type coursesInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    assessments?: boolean | Prisma.courses$assessmentsArgs<ExtArgs>;
    chapters?: boolean | Prisma.courses$chaptersArgs<ExtArgs>;
    documents_metadata?: boolean | Prisma.courses$documents_metadataArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.courses$learning_outcomesArgs<ExtArgs>;
    lms_course_ref?: boolean | Prisma.courses$lms_course_refArgs<ExtArgs>;
    _count?: boolean | Prisma.CoursesCountOutputTypeDefaultArgs<ExtArgs>;
};
export type coursesIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    documents_metadata?: boolean | Prisma.courses$documents_metadataArgs<ExtArgs>;
};
export type coursesIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    documents_metadata?: boolean | Prisma.courses$documents_metadataArgs<ExtArgs>;
};
export type $coursesPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "courses";
    objects: {
        assessments: Prisma.$assessmentsPayload<ExtArgs>[];
        chapters: Prisma.$chaptersPayload<ExtArgs>[];
        documents_metadata: Prisma.$documents_metadataPayload<ExtArgs> | null;
        learning_outcomes: Prisma.$learning_outcomesPayload<ExtArgs>[];
        lms_course_ref: Prisma.$lms_course_refPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        course_id: string;
        code: string;
        title_vi: string;
        title_en: string | null;
        credits: number | null;
        semester: string | null;
        source_document_id: string | null;
        extraction_confidence: number;
        created_at: Date;
        updated_at: Date;
    }, ExtArgs["result"]["courses"]>;
    composites: {};
};
export type coursesGetPayload<S extends boolean | null | undefined | coursesDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$coursesPayload, S>;
export type coursesCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<coursesFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: CoursesCountAggregateInputType | true;
};
export interface coursesDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['courses'];
        meta: {
            name: 'courses';
        };
    };
    findUnique<T extends coursesFindUniqueArgs>(args: Prisma.SelectSubset<T, coursesFindUniqueArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends coursesFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, coursesFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends coursesFindFirstArgs>(args?: Prisma.SelectSubset<T, coursesFindFirstArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends coursesFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, coursesFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends coursesFindManyArgs>(args?: Prisma.SelectSubset<T, coursesFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends coursesCreateArgs>(args: Prisma.SelectSubset<T, coursesCreateArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends coursesCreateManyArgs>(args?: Prisma.SelectSubset<T, coursesCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends coursesCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, coursesCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends coursesDeleteArgs>(args: Prisma.SelectSubset<T, coursesDeleteArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends coursesUpdateArgs>(args: Prisma.SelectSubset<T, coursesUpdateArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends coursesDeleteManyArgs>(args?: Prisma.SelectSubset<T, coursesDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends coursesUpdateManyArgs>(args: Prisma.SelectSubset<T, coursesUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends coursesUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, coursesUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends coursesUpsertArgs>(args: Prisma.SelectSubset<T, coursesUpsertArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends coursesCountArgs>(args?: Prisma.Subset<T, coursesCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], CoursesCountAggregateOutputType> : number>;
    aggregate<T extends CoursesAggregateArgs>(args: Prisma.Subset<T, CoursesAggregateArgs>): Prisma.PrismaPromise<GetCoursesAggregateType<T>>;
    groupBy<T extends coursesGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: coursesGroupByArgs['orderBy'];
    } : {
        orderBy?: coursesGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, coursesGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCoursesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: coursesFieldRefs;
}
export interface Prisma__coursesClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    assessments<T extends Prisma.courses$assessmentsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.courses$assessmentsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    chapters<T extends Prisma.courses$chaptersArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.courses$chaptersArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    documents_metadata<T extends Prisma.courses$documents_metadataArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.courses$documents_metadataArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    learning_outcomes<T extends Prisma.courses$learning_outcomesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.courses$learning_outcomesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    lms_course_ref<T extends Prisma.courses$lms_course_refArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.courses$lms_course_refArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface coursesFieldRefs {
    readonly course_id: Prisma.FieldRef<"courses", 'String'>;
    readonly code: Prisma.FieldRef<"courses", 'String'>;
    readonly title_vi: Prisma.FieldRef<"courses", 'String'>;
    readonly title_en: Prisma.FieldRef<"courses", 'String'>;
    readonly credits: Prisma.FieldRef<"courses", 'Int'>;
    readonly semester: Prisma.FieldRef<"courses", 'String'>;
    readonly source_document_id: Prisma.FieldRef<"courses", 'String'>;
    readonly extraction_confidence: Prisma.FieldRef<"courses", 'Float'>;
    readonly created_at: Prisma.FieldRef<"courses", 'DateTime'>;
    readonly updated_at: Prisma.FieldRef<"courses", 'DateTime'>;
}
export type coursesFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
    where: Prisma.coursesWhereUniqueInput;
};
export type coursesFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
    where: Prisma.coursesWhereUniqueInput;
};
export type coursesFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
    where?: Prisma.coursesWhereInput;
    orderBy?: Prisma.coursesOrderByWithRelationInput | Prisma.coursesOrderByWithRelationInput[];
    cursor?: Prisma.coursesWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CoursesScalarFieldEnum | Prisma.CoursesScalarFieldEnum[];
};
export type coursesFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
    where?: Prisma.coursesWhereInput;
    orderBy?: Prisma.coursesOrderByWithRelationInput | Prisma.coursesOrderByWithRelationInput[];
    cursor?: Prisma.coursesWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CoursesScalarFieldEnum | Prisma.CoursesScalarFieldEnum[];
};
export type coursesFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
    where?: Prisma.coursesWhereInput;
    orderBy?: Prisma.coursesOrderByWithRelationInput | Prisma.coursesOrderByWithRelationInput[];
    cursor?: Prisma.coursesWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CoursesScalarFieldEnum | Prisma.CoursesScalarFieldEnum[];
};
export type coursesCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.coursesCreateInput, Prisma.coursesUncheckedCreateInput>;
};
export type coursesCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.coursesCreateManyInput | Prisma.coursesCreateManyInput[];
    skipDuplicates?: boolean;
};
export type coursesCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    data: Prisma.coursesCreateManyInput | Prisma.coursesCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.coursesIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type coursesUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.coursesUpdateInput, Prisma.coursesUncheckedUpdateInput>;
    where: Prisma.coursesWhereUniqueInput;
};
export type coursesUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.coursesUpdateManyMutationInput, Prisma.coursesUncheckedUpdateManyInput>;
    where?: Prisma.coursesWhereInput;
    limit?: number;
};
export type coursesUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.coursesUpdateManyMutationInput, Prisma.coursesUncheckedUpdateManyInput>;
    where?: Prisma.coursesWhereInput;
    limit?: number;
    include?: Prisma.coursesIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type coursesUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
    where: Prisma.coursesWhereUniqueInput;
    create: Prisma.XOR<Prisma.coursesCreateInput, Prisma.coursesUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.coursesUpdateInput, Prisma.coursesUncheckedUpdateInput>;
};
export type coursesDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
    where: Prisma.coursesWhereUniqueInput;
};
export type coursesDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.coursesWhereInput;
    limit?: number;
};
export type courses$assessmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type courses$chaptersArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chaptersSelect<ExtArgs> | null;
    omit?: Prisma.chaptersOmit<ExtArgs> | null;
    include?: Prisma.chaptersInclude<ExtArgs> | null;
    where?: Prisma.chaptersWhereInput;
    orderBy?: Prisma.chaptersOrderByWithRelationInput | Prisma.chaptersOrderByWithRelationInput[];
    cursor?: Prisma.chaptersWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ChaptersScalarFieldEnum | Prisma.ChaptersScalarFieldEnum[];
};
export type courses$documents_metadataArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
    where?: Prisma.documents_metadataWhereInput;
};
export type courses$learning_outcomesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type courses$lms_course_refArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_course_refSelect<ExtArgs> | null;
    omit?: Prisma.lms_course_refOmit<ExtArgs> | null;
    include?: Prisma.lms_course_refInclude<ExtArgs> | null;
    where?: Prisma.lms_course_refWhereInput;
    orderBy?: Prisma.lms_course_refOrderByWithRelationInput | Prisma.lms_course_refOrderByWithRelationInput[];
    cursor?: Prisma.lms_course_refWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Lms_course_refScalarFieldEnum | Prisma.Lms_course_refScalarFieldEnum[];
};
export type coursesDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
};
