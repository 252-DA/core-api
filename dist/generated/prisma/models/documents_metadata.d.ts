import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type documents_metadataModel = runtime.Types.Result.DefaultSelection<Prisma.$documents_metadataPayload>;
export type AggregateDocuments_metadata = {
    _count: Documents_metadataCountAggregateOutputType | null;
    _avg: Documents_metadataAvgAggregateOutputType | null;
    _sum: Documents_metadataSumAggregateOutputType | null;
    _min: Documents_metadataMinAggregateOutputType | null;
    _max: Documents_metadataMaxAggregateOutputType | null;
};
export type Documents_metadataAvgAggregateOutputType = {
    size_bytes: number | null;
};
export type Documents_metadataSumAggregateOutputType = {
    size_bytes: bigint | null;
};
export type Documents_metadataMinAggregateOutputType = {
    document_id: string | null;
    document_name: string | null;
    doc_type: string | null;
    mime_type: string | null;
    size_bytes: bigint | null;
    storage_key: string | null;
    course_id: string | null;
    owner_id: string | null;
    language: string | null;
    status: string | null;
    error_msg: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type Documents_metadataMaxAggregateOutputType = {
    document_id: string | null;
    document_name: string | null;
    doc_type: string | null;
    mime_type: string | null;
    size_bytes: bigint | null;
    storage_key: string | null;
    course_id: string | null;
    owner_id: string | null;
    language: string | null;
    status: string | null;
    error_msg: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type Documents_metadataCountAggregateOutputType = {
    document_id: number;
    document_name: number;
    doc_type: number;
    mime_type: number;
    size_bytes: number;
    storage_key: number;
    course_id: number;
    owner_id: number;
    language: number;
    status: number;
    error_msg: number;
    metadata_json: number;
    created_at: number;
    updated_at: number;
    _all: number;
};
export type Documents_metadataAvgAggregateInputType = {
    size_bytes?: true;
};
export type Documents_metadataSumAggregateInputType = {
    size_bytes?: true;
};
export type Documents_metadataMinAggregateInputType = {
    document_id?: true;
    document_name?: true;
    doc_type?: true;
    mime_type?: true;
    size_bytes?: true;
    storage_key?: true;
    course_id?: true;
    owner_id?: true;
    language?: true;
    status?: true;
    error_msg?: true;
    created_at?: true;
    updated_at?: true;
};
export type Documents_metadataMaxAggregateInputType = {
    document_id?: true;
    document_name?: true;
    doc_type?: true;
    mime_type?: true;
    size_bytes?: true;
    storage_key?: true;
    course_id?: true;
    owner_id?: true;
    language?: true;
    status?: true;
    error_msg?: true;
    created_at?: true;
    updated_at?: true;
};
export type Documents_metadataCountAggregateInputType = {
    document_id?: true;
    document_name?: true;
    doc_type?: true;
    mime_type?: true;
    size_bytes?: true;
    storage_key?: true;
    course_id?: true;
    owner_id?: true;
    language?: true;
    status?: true;
    error_msg?: true;
    metadata_json?: true;
    created_at?: true;
    updated_at?: true;
    _all?: true;
};
export type Documents_metadataAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.documents_metadataWhereInput;
    orderBy?: Prisma.documents_metadataOrderByWithRelationInput | Prisma.documents_metadataOrderByWithRelationInput[];
    cursor?: Prisma.documents_metadataWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Documents_metadataCountAggregateInputType;
    _avg?: Documents_metadataAvgAggregateInputType;
    _sum?: Documents_metadataSumAggregateInputType;
    _min?: Documents_metadataMinAggregateInputType;
    _max?: Documents_metadataMaxAggregateInputType;
};
export type GetDocuments_metadataAggregateType<T extends Documents_metadataAggregateArgs> = {
    [P in keyof T & keyof AggregateDocuments_metadata]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDocuments_metadata[P]> : Prisma.GetScalarType<T[P], AggregateDocuments_metadata[P]>;
};
export type documents_metadataGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.documents_metadataWhereInput;
    orderBy?: Prisma.documents_metadataOrderByWithAggregationInput | Prisma.documents_metadataOrderByWithAggregationInput[];
    by: Prisma.Documents_metadataScalarFieldEnum[] | Prisma.Documents_metadataScalarFieldEnum;
    having?: Prisma.documents_metadataScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Documents_metadataCountAggregateInputType | true;
    _avg?: Documents_metadataAvgAggregateInputType;
    _sum?: Documents_metadataSumAggregateInputType;
    _min?: Documents_metadataMinAggregateInputType;
    _max?: Documents_metadataMaxAggregateInputType;
};
export type Documents_metadataGroupByOutputType = {
    document_id: string;
    document_name: string;
    doc_type: string;
    mime_type: string;
    size_bytes: bigint;
    storage_key: string | null;
    course_id: string | null;
    owner_id: string | null;
    language: string | null;
    status: string;
    error_msg: string | null;
    metadata_json: runtime.JsonValue;
    created_at: Date;
    updated_at: Date;
    _count: Documents_metadataCountAggregateOutputType | null;
    _avg: Documents_metadataAvgAggregateOutputType | null;
    _sum: Documents_metadataSumAggregateOutputType | null;
    _min: Documents_metadataMinAggregateOutputType | null;
    _max: Documents_metadataMaxAggregateOutputType | null;
};
export type GetDocuments_metadataGroupByPayload<T extends documents_metadataGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Documents_metadataGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Documents_metadataGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Documents_metadataGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Documents_metadataGroupByOutputType[P]>;
}>>;
export type documents_metadataWhereInput = {
    AND?: Prisma.documents_metadataWhereInput | Prisma.documents_metadataWhereInput[];
    OR?: Prisma.documents_metadataWhereInput[];
    NOT?: Prisma.documents_metadataWhereInput | Prisma.documents_metadataWhereInput[];
    document_id?: Prisma.StringFilter<"documents_metadata"> | string;
    document_name?: Prisma.StringFilter<"documents_metadata"> | string;
    doc_type?: Prisma.StringFilter<"documents_metadata"> | string;
    mime_type?: Prisma.StringFilter<"documents_metadata"> | string;
    size_bytes?: Prisma.BigIntFilter<"documents_metadata"> | bigint | number;
    storage_key?: Prisma.StringNullableFilter<"documents_metadata"> | string | null;
    course_id?: Prisma.StringNullableFilter<"documents_metadata"> | string | null;
    owner_id?: Prisma.StringNullableFilter<"documents_metadata"> | string | null;
    language?: Prisma.StringNullableFilter<"documents_metadata"> | string | null;
    status?: Prisma.StringFilter<"documents_metadata"> | string;
    error_msg?: Prisma.StringNullableFilter<"documents_metadata"> | string | null;
    metadata_json?: Prisma.JsonFilter<"documents_metadata">;
    created_at?: Prisma.DateTimeFilter<"documents_metadata"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"documents_metadata"> | Date | string;
    courses?: Prisma.CoursesListRelationFilter;
    lesson_cards?: Prisma.Lesson_cardsListRelationFilter;
    quiz_items?: Prisma.Quiz_itemsListRelationFilter;
};
export type documents_metadataOrderByWithRelationInput = {
    document_id?: Prisma.SortOrder;
    document_name?: Prisma.SortOrder;
    doc_type?: Prisma.SortOrder;
    mime_type?: Prisma.SortOrder;
    size_bytes?: Prisma.SortOrder;
    storage_key?: Prisma.SortOrderInput | Prisma.SortOrder;
    course_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    owner_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    language?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    error_msg?: Prisma.SortOrderInput | Prisma.SortOrder;
    metadata_json?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    courses?: Prisma.coursesOrderByRelationAggregateInput;
    lesson_cards?: Prisma.lesson_cardsOrderByRelationAggregateInput;
    quiz_items?: Prisma.quiz_itemsOrderByRelationAggregateInput;
};
export type documents_metadataWhereUniqueInput = Prisma.AtLeast<{
    document_id?: string;
    AND?: Prisma.documents_metadataWhereInput | Prisma.documents_metadataWhereInput[];
    OR?: Prisma.documents_metadataWhereInput[];
    NOT?: Prisma.documents_metadataWhereInput | Prisma.documents_metadataWhereInput[];
    document_name?: Prisma.StringFilter<"documents_metadata"> | string;
    doc_type?: Prisma.StringFilter<"documents_metadata"> | string;
    mime_type?: Prisma.StringFilter<"documents_metadata"> | string;
    size_bytes?: Prisma.BigIntFilter<"documents_metadata"> | bigint | number;
    storage_key?: Prisma.StringNullableFilter<"documents_metadata"> | string | null;
    course_id?: Prisma.StringNullableFilter<"documents_metadata"> | string | null;
    owner_id?: Prisma.StringNullableFilter<"documents_metadata"> | string | null;
    language?: Prisma.StringNullableFilter<"documents_metadata"> | string | null;
    status?: Prisma.StringFilter<"documents_metadata"> | string;
    error_msg?: Prisma.StringNullableFilter<"documents_metadata"> | string | null;
    metadata_json?: Prisma.JsonFilter<"documents_metadata">;
    created_at?: Prisma.DateTimeFilter<"documents_metadata"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"documents_metadata"> | Date | string;
    courses?: Prisma.CoursesListRelationFilter;
    lesson_cards?: Prisma.Lesson_cardsListRelationFilter;
    quiz_items?: Prisma.Quiz_itemsListRelationFilter;
}, "document_id">;
export type documents_metadataOrderByWithAggregationInput = {
    document_id?: Prisma.SortOrder;
    document_name?: Prisma.SortOrder;
    doc_type?: Prisma.SortOrder;
    mime_type?: Prisma.SortOrder;
    size_bytes?: Prisma.SortOrder;
    storage_key?: Prisma.SortOrderInput | Prisma.SortOrder;
    course_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    owner_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    language?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    error_msg?: Prisma.SortOrderInput | Prisma.SortOrder;
    metadata_json?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    _count?: Prisma.documents_metadataCountOrderByAggregateInput;
    _avg?: Prisma.documents_metadataAvgOrderByAggregateInput;
    _max?: Prisma.documents_metadataMaxOrderByAggregateInput;
    _min?: Prisma.documents_metadataMinOrderByAggregateInput;
    _sum?: Prisma.documents_metadataSumOrderByAggregateInput;
};
export type documents_metadataScalarWhereWithAggregatesInput = {
    AND?: Prisma.documents_metadataScalarWhereWithAggregatesInput | Prisma.documents_metadataScalarWhereWithAggregatesInput[];
    OR?: Prisma.documents_metadataScalarWhereWithAggregatesInput[];
    NOT?: Prisma.documents_metadataScalarWhereWithAggregatesInput | Prisma.documents_metadataScalarWhereWithAggregatesInput[];
    document_id?: Prisma.StringWithAggregatesFilter<"documents_metadata"> | string;
    document_name?: Prisma.StringWithAggregatesFilter<"documents_metadata"> | string;
    doc_type?: Prisma.StringWithAggregatesFilter<"documents_metadata"> | string;
    mime_type?: Prisma.StringWithAggregatesFilter<"documents_metadata"> | string;
    size_bytes?: Prisma.BigIntWithAggregatesFilter<"documents_metadata"> | bigint | number;
    storage_key?: Prisma.StringNullableWithAggregatesFilter<"documents_metadata"> | string | null;
    course_id?: Prisma.StringNullableWithAggregatesFilter<"documents_metadata"> | string | null;
    owner_id?: Prisma.StringNullableWithAggregatesFilter<"documents_metadata"> | string | null;
    language?: Prisma.StringNullableWithAggregatesFilter<"documents_metadata"> | string | null;
    status?: Prisma.StringWithAggregatesFilter<"documents_metadata"> | string;
    error_msg?: Prisma.StringNullableWithAggregatesFilter<"documents_metadata"> | string | null;
    metadata_json?: Prisma.JsonWithAggregatesFilter<"documents_metadata">;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"documents_metadata"> | Date | string;
    updated_at?: Prisma.DateTimeWithAggregatesFilter<"documents_metadata"> | Date | string;
};
export type documents_metadataCreateInput = {
    document_id: string;
    document_name: string;
    doc_type: string;
    mime_type: string;
    size_bytes: bigint | number;
    storage_key?: string | null;
    course_id?: string | null;
    owner_id?: string | null;
    language?: string | null;
    status: string;
    error_msg?: string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Date | string;
    updated_at?: Date | string;
    courses?: Prisma.coursesCreateNestedManyWithoutDocuments_metadataInput;
    lesson_cards?: Prisma.lesson_cardsCreateNestedManyWithoutDocuments_metadataInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutDocuments_metadataInput;
};
export type documents_metadataUncheckedCreateInput = {
    document_id: string;
    document_name: string;
    doc_type: string;
    mime_type: string;
    size_bytes: bigint | number;
    storage_key?: string | null;
    course_id?: string | null;
    owner_id?: string | null;
    language?: string | null;
    status: string;
    error_msg?: string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Date | string;
    updated_at?: Date | string;
    courses?: Prisma.coursesUncheckedCreateNestedManyWithoutDocuments_metadataInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedCreateNestedManyWithoutDocuments_metadataInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutDocuments_metadataInput;
};
export type documents_metadataUpdateInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_name?: Prisma.StringFieldUpdateOperationsInput | string;
    doc_type?: Prisma.StringFieldUpdateOperationsInput | string;
    mime_type?: Prisma.StringFieldUpdateOperationsInput | string;
    size_bytes?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    storage_key?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    owner_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    courses?: Prisma.coursesUpdateManyWithoutDocuments_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUpdateManyWithoutDocuments_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutDocuments_metadataNestedInput;
};
export type documents_metadataUncheckedUpdateInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_name?: Prisma.StringFieldUpdateOperationsInput | string;
    doc_type?: Prisma.StringFieldUpdateOperationsInput | string;
    mime_type?: Prisma.StringFieldUpdateOperationsInput | string;
    size_bytes?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    storage_key?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    owner_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    courses?: Prisma.coursesUncheckedUpdateManyWithoutDocuments_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedUpdateManyWithoutDocuments_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutDocuments_metadataNestedInput;
};
export type documents_metadataCreateManyInput = {
    document_id: string;
    document_name: string;
    doc_type: string;
    mime_type: string;
    size_bytes: bigint | number;
    storage_key?: string | null;
    course_id?: string | null;
    owner_id?: string | null;
    language?: string | null;
    status: string;
    error_msg?: string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type documents_metadataUpdateManyMutationInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_name?: Prisma.StringFieldUpdateOperationsInput | string;
    doc_type?: Prisma.StringFieldUpdateOperationsInput | string;
    mime_type?: Prisma.StringFieldUpdateOperationsInput | string;
    size_bytes?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    storage_key?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    owner_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type documents_metadataUncheckedUpdateManyInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_name?: Prisma.StringFieldUpdateOperationsInput | string;
    doc_type?: Prisma.StringFieldUpdateOperationsInput | string;
    mime_type?: Prisma.StringFieldUpdateOperationsInput | string;
    size_bytes?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    storage_key?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    owner_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type Documents_metadataNullableScalarRelationFilter = {
    is?: Prisma.documents_metadataWhereInput | null;
    isNot?: Prisma.documents_metadataWhereInput | null;
};
export type documents_metadataCountOrderByAggregateInput = {
    document_id?: Prisma.SortOrder;
    document_name?: Prisma.SortOrder;
    doc_type?: Prisma.SortOrder;
    mime_type?: Prisma.SortOrder;
    size_bytes?: Prisma.SortOrder;
    storage_key?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    owner_id?: Prisma.SortOrder;
    language?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    error_msg?: Prisma.SortOrder;
    metadata_json?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type documents_metadataAvgOrderByAggregateInput = {
    size_bytes?: Prisma.SortOrder;
};
export type documents_metadataMaxOrderByAggregateInput = {
    document_id?: Prisma.SortOrder;
    document_name?: Prisma.SortOrder;
    doc_type?: Prisma.SortOrder;
    mime_type?: Prisma.SortOrder;
    size_bytes?: Prisma.SortOrder;
    storage_key?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    owner_id?: Prisma.SortOrder;
    language?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    error_msg?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type documents_metadataMinOrderByAggregateInput = {
    document_id?: Prisma.SortOrder;
    document_name?: Prisma.SortOrder;
    doc_type?: Prisma.SortOrder;
    mime_type?: Prisma.SortOrder;
    size_bytes?: Prisma.SortOrder;
    storage_key?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    owner_id?: Prisma.SortOrder;
    language?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    error_msg?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type documents_metadataSumOrderByAggregateInput = {
    size_bytes?: Prisma.SortOrder;
};
export type Documents_metadataScalarRelationFilter = {
    is?: Prisma.documents_metadataWhereInput;
    isNot?: Prisma.documents_metadataWhereInput;
};
export type documents_metadataCreateNestedOneWithoutCoursesInput = {
    create?: Prisma.XOR<Prisma.documents_metadataCreateWithoutCoursesInput, Prisma.documents_metadataUncheckedCreateWithoutCoursesInput>;
    connectOrCreate?: Prisma.documents_metadataCreateOrConnectWithoutCoursesInput;
    connect?: Prisma.documents_metadataWhereUniqueInput;
};
export type documents_metadataUpdateOneWithoutCoursesNestedInput = {
    create?: Prisma.XOR<Prisma.documents_metadataCreateWithoutCoursesInput, Prisma.documents_metadataUncheckedCreateWithoutCoursesInput>;
    connectOrCreate?: Prisma.documents_metadataCreateOrConnectWithoutCoursesInput;
    upsert?: Prisma.documents_metadataUpsertWithoutCoursesInput;
    disconnect?: Prisma.documents_metadataWhereInput | boolean;
    delete?: Prisma.documents_metadataWhereInput | boolean;
    connect?: Prisma.documents_metadataWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.documents_metadataUpdateToOneWithWhereWithoutCoursesInput, Prisma.documents_metadataUpdateWithoutCoursesInput>, Prisma.documents_metadataUncheckedUpdateWithoutCoursesInput>;
};
export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number;
    increment?: bigint | number;
    decrement?: bigint | number;
    multiply?: bigint | number;
    divide?: bigint | number;
};
export type documents_metadataCreateNestedOneWithoutLesson_cardsInput = {
    create?: Prisma.XOR<Prisma.documents_metadataCreateWithoutLesson_cardsInput, Prisma.documents_metadataUncheckedCreateWithoutLesson_cardsInput>;
    connectOrCreate?: Prisma.documents_metadataCreateOrConnectWithoutLesson_cardsInput;
    connect?: Prisma.documents_metadataWhereUniqueInput;
};
export type documents_metadataUpdateOneRequiredWithoutLesson_cardsNestedInput = {
    create?: Prisma.XOR<Prisma.documents_metadataCreateWithoutLesson_cardsInput, Prisma.documents_metadataUncheckedCreateWithoutLesson_cardsInput>;
    connectOrCreate?: Prisma.documents_metadataCreateOrConnectWithoutLesson_cardsInput;
    upsert?: Prisma.documents_metadataUpsertWithoutLesson_cardsInput;
    connect?: Prisma.documents_metadataWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.documents_metadataUpdateToOneWithWhereWithoutLesson_cardsInput, Prisma.documents_metadataUpdateWithoutLesson_cardsInput>, Prisma.documents_metadataUncheckedUpdateWithoutLesson_cardsInput>;
};
export type documents_metadataCreateNestedOneWithoutQuiz_itemsInput = {
    create?: Prisma.XOR<Prisma.documents_metadataCreateWithoutQuiz_itemsInput, Prisma.documents_metadataUncheckedCreateWithoutQuiz_itemsInput>;
    connectOrCreate?: Prisma.documents_metadataCreateOrConnectWithoutQuiz_itemsInput;
    connect?: Prisma.documents_metadataWhereUniqueInput;
};
export type documents_metadataUpdateOneRequiredWithoutQuiz_itemsNestedInput = {
    create?: Prisma.XOR<Prisma.documents_metadataCreateWithoutQuiz_itemsInput, Prisma.documents_metadataUncheckedCreateWithoutQuiz_itemsInput>;
    connectOrCreate?: Prisma.documents_metadataCreateOrConnectWithoutQuiz_itemsInput;
    upsert?: Prisma.documents_metadataUpsertWithoutQuiz_itemsInput;
    connect?: Prisma.documents_metadataWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.documents_metadataUpdateToOneWithWhereWithoutQuiz_itemsInput, Prisma.documents_metadataUpdateWithoutQuiz_itemsInput>, Prisma.documents_metadataUncheckedUpdateWithoutQuiz_itemsInput>;
};
export type documents_metadataCreateWithoutCoursesInput = {
    document_id: string;
    document_name: string;
    doc_type: string;
    mime_type: string;
    size_bytes: bigint | number;
    storage_key?: string | null;
    course_id?: string | null;
    owner_id?: string | null;
    language?: string | null;
    status: string;
    error_msg?: string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Date | string;
    updated_at?: Date | string;
    lesson_cards?: Prisma.lesson_cardsCreateNestedManyWithoutDocuments_metadataInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutDocuments_metadataInput;
};
export type documents_metadataUncheckedCreateWithoutCoursesInput = {
    document_id: string;
    document_name: string;
    doc_type: string;
    mime_type: string;
    size_bytes: bigint | number;
    storage_key?: string | null;
    course_id?: string | null;
    owner_id?: string | null;
    language?: string | null;
    status: string;
    error_msg?: string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Date | string;
    updated_at?: Date | string;
    lesson_cards?: Prisma.lesson_cardsUncheckedCreateNestedManyWithoutDocuments_metadataInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutDocuments_metadataInput;
};
export type documents_metadataCreateOrConnectWithoutCoursesInput = {
    where: Prisma.documents_metadataWhereUniqueInput;
    create: Prisma.XOR<Prisma.documents_metadataCreateWithoutCoursesInput, Prisma.documents_metadataUncheckedCreateWithoutCoursesInput>;
};
export type documents_metadataUpsertWithoutCoursesInput = {
    update: Prisma.XOR<Prisma.documents_metadataUpdateWithoutCoursesInput, Prisma.documents_metadataUncheckedUpdateWithoutCoursesInput>;
    create: Prisma.XOR<Prisma.documents_metadataCreateWithoutCoursesInput, Prisma.documents_metadataUncheckedCreateWithoutCoursesInput>;
    where?: Prisma.documents_metadataWhereInput;
};
export type documents_metadataUpdateToOneWithWhereWithoutCoursesInput = {
    where?: Prisma.documents_metadataWhereInput;
    data: Prisma.XOR<Prisma.documents_metadataUpdateWithoutCoursesInput, Prisma.documents_metadataUncheckedUpdateWithoutCoursesInput>;
};
export type documents_metadataUpdateWithoutCoursesInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_name?: Prisma.StringFieldUpdateOperationsInput | string;
    doc_type?: Prisma.StringFieldUpdateOperationsInput | string;
    mime_type?: Prisma.StringFieldUpdateOperationsInput | string;
    size_bytes?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    storage_key?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    owner_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lesson_cards?: Prisma.lesson_cardsUpdateManyWithoutDocuments_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutDocuments_metadataNestedInput;
};
export type documents_metadataUncheckedUpdateWithoutCoursesInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_name?: Prisma.StringFieldUpdateOperationsInput | string;
    doc_type?: Prisma.StringFieldUpdateOperationsInput | string;
    mime_type?: Prisma.StringFieldUpdateOperationsInput | string;
    size_bytes?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    storage_key?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    owner_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lesson_cards?: Prisma.lesson_cardsUncheckedUpdateManyWithoutDocuments_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutDocuments_metadataNestedInput;
};
export type documents_metadataCreateWithoutLesson_cardsInput = {
    document_id: string;
    document_name: string;
    doc_type: string;
    mime_type: string;
    size_bytes: bigint | number;
    storage_key?: string | null;
    course_id?: string | null;
    owner_id?: string | null;
    language?: string | null;
    status: string;
    error_msg?: string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Date | string;
    updated_at?: Date | string;
    courses?: Prisma.coursesCreateNestedManyWithoutDocuments_metadataInput;
    quiz_items?: Prisma.quiz_itemsCreateNestedManyWithoutDocuments_metadataInput;
};
export type documents_metadataUncheckedCreateWithoutLesson_cardsInput = {
    document_id: string;
    document_name: string;
    doc_type: string;
    mime_type: string;
    size_bytes: bigint | number;
    storage_key?: string | null;
    course_id?: string | null;
    owner_id?: string | null;
    language?: string | null;
    status: string;
    error_msg?: string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Date | string;
    updated_at?: Date | string;
    courses?: Prisma.coursesUncheckedCreateNestedManyWithoutDocuments_metadataInput;
    quiz_items?: Prisma.quiz_itemsUncheckedCreateNestedManyWithoutDocuments_metadataInput;
};
export type documents_metadataCreateOrConnectWithoutLesson_cardsInput = {
    where: Prisma.documents_metadataWhereUniqueInput;
    create: Prisma.XOR<Prisma.documents_metadataCreateWithoutLesson_cardsInput, Prisma.documents_metadataUncheckedCreateWithoutLesson_cardsInput>;
};
export type documents_metadataUpsertWithoutLesson_cardsInput = {
    update: Prisma.XOR<Prisma.documents_metadataUpdateWithoutLesson_cardsInput, Prisma.documents_metadataUncheckedUpdateWithoutLesson_cardsInput>;
    create: Prisma.XOR<Prisma.documents_metadataCreateWithoutLesson_cardsInput, Prisma.documents_metadataUncheckedCreateWithoutLesson_cardsInput>;
    where?: Prisma.documents_metadataWhereInput;
};
export type documents_metadataUpdateToOneWithWhereWithoutLesson_cardsInput = {
    where?: Prisma.documents_metadataWhereInput;
    data: Prisma.XOR<Prisma.documents_metadataUpdateWithoutLesson_cardsInput, Prisma.documents_metadataUncheckedUpdateWithoutLesson_cardsInput>;
};
export type documents_metadataUpdateWithoutLesson_cardsInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_name?: Prisma.StringFieldUpdateOperationsInput | string;
    doc_type?: Prisma.StringFieldUpdateOperationsInput | string;
    mime_type?: Prisma.StringFieldUpdateOperationsInput | string;
    size_bytes?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    storage_key?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    owner_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    courses?: Prisma.coursesUpdateManyWithoutDocuments_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUpdateManyWithoutDocuments_metadataNestedInput;
};
export type documents_metadataUncheckedUpdateWithoutLesson_cardsInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_name?: Prisma.StringFieldUpdateOperationsInput | string;
    doc_type?: Prisma.StringFieldUpdateOperationsInput | string;
    mime_type?: Prisma.StringFieldUpdateOperationsInput | string;
    size_bytes?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    storage_key?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    owner_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    courses?: Prisma.coursesUncheckedUpdateManyWithoutDocuments_metadataNestedInput;
    quiz_items?: Prisma.quiz_itemsUncheckedUpdateManyWithoutDocuments_metadataNestedInput;
};
export type documents_metadataCreateWithoutQuiz_itemsInput = {
    document_id: string;
    document_name: string;
    doc_type: string;
    mime_type: string;
    size_bytes: bigint | number;
    storage_key?: string | null;
    course_id?: string | null;
    owner_id?: string | null;
    language?: string | null;
    status: string;
    error_msg?: string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Date | string;
    updated_at?: Date | string;
    courses?: Prisma.coursesCreateNestedManyWithoutDocuments_metadataInput;
    lesson_cards?: Prisma.lesson_cardsCreateNestedManyWithoutDocuments_metadataInput;
};
export type documents_metadataUncheckedCreateWithoutQuiz_itemsInput = {
    document_id: string;
    document_name: string;
    doc_type: string;
    mime_type: string;
    size_bytes: bigint | number;
    storage_key?: string | null;
    course_id?: string | null;
    owner_id?: string | null;
    language?: string | null;
    status: string;
    error_msg?: string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Date | string;
    updated_at?: Date | string;
    courses?: Prisma.coursesUncheckedCreateNestedManyWithoutDocuments_metadataInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedCreateNestedManyWithoutDocuments_metadataInput;
};
export type documents_metadataCreateOrConnectWithoutQuiz_itemsInput = {
    where: Prisma.documents_metadataWhereUniqueInput;
    create: Prisma.XOR<Prisma.documents_metadataCreateWithoutQuiz_itemsInput, Prisma.documents_metadataUncheckedCreateWithoutQuiz_itemsInput>;
};
export type documents_metadataUpsertWithoutQuiz_itemsInput = {
    update: Prisma.XOR<Prisma.documents_metadataUpdateWithoutQuiz_itemsInput, Prisma.documents_metadataUncheckedUpdateWithoutQuiz_itemsInput>;
    create: Prisma.XOR<Prisma.documents_metadataCreateWithoutQuiz_itemsInput, Prisma.documents_metadataUncheckedCreateWithoutQuiz_itemsInput>;
    where?: Prisma.documents_metadataWhereInput;
};
export type documents_metadataUpdateToOneWithWhereWithoutQuiz_itemsInput = {
    where?: Prisma.documents_metadataWhereInput;
    data: Prisma.XOR<Prisma.documents_metadataUpdateWithoutQuiz_itemsInput, Prisma.documents_metadataUncheckedUpdateWithoutQuiz_itemsInput>;
};
export type documents_metadataUpdateWithoutQuiz_itemsInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_name?: Prisma.StringFieldUpdateOperationsInput | string;
    doc_type?: Prisma.StringFieldUpdateOperationsInput | string;
    mime_type?: Prisma.StringFieldUpdateOperationsInput | string;
    size_bytes?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    storage_key?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    owner_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    courses?: Prisma.coursesUpdateManyWithoutDocuments_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUpdateManyWithoutDocuments_metadataNestedInput;
};
export type documents_metadataUncheckedUpdateWithoutQuiz_itemsInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_name?: Prisma.StringFieldUpdateOperationsInput | string;
    doc_type?: Prisma.StringFieldUpdateOperationsInput | string;
    mime_type?: Prisma.StringFieldUpdateOperationsInput | string;
    size_bytes?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    storage_key?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    owner_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadata_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    courses?: Prisma.coursesUncheckedUpdateManyWithoutDocuments_metadataNestedInput;
    lesson_cards?: Prisma.lesson_cardsUncheckedUpdateManyWithoutDocuments_metadataNestedInput;
};
export type Documents_metadataCountOutputType = {
    courses: number;
    lesson_cards: number;
    quiz_items: number;
};
export type Documents_metadataCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Documents_metadataCountOutputTypeCountCoursesArgs;
    lesson_cards?: boolean | Documents_metadataCountOutputTypeCountLesson_cardsArgs;
    quiz_items?: boolean | Documents_metadataCountOutputTypeCountQuiz_itemsArgs;
};
export type Documents_metadataCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.Documents_metadataCountOutputTypeSelect<ExtArgs> | null;
};
export type Documents_metadataCountOutputTypeCountCoursesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.coursesWhereInput;
};
export type Documents_metadataCountOutputTypeCountLesson_cardsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lesson_cardsWhereInput;
};
export type Documents_metadataCountOutputTypeCountQuiz_itemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.quiz_itemsWhereInput;
};
export type documents_metadataSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    document_id?: boolean;
    document_name?: boolean;
    doc_type?: boolean;
    mime_type?: boolean;
    size_bytes?: boolean;
    storage_key?: boolean;
    course_id?: boolean;
    owner_id?: boolean;
    language?: boolean;
    status?: boolean;
    error_msg?: boolean;
    metadata_json?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
    courses?: boolean | Prisma.documents_metadata$coursesArgs<ExtArgs>;
    lesson_cards?: boolean | Prisma.documents_metadata$lesson_cardsArgs<ExtArgs>;
    quiz_items?: boolean | Prisma.documents_metadata$quiz_itemsArgs<ExtArgs>;
    _count?: boolean | Prisma.Documents_metadataCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["documents_metadata"]>;
export type documents_metadataSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    document_id?: boolean;
    document_name?: boolean;
    doc_type?: boolean;
    mime_type?: boolean;
    size_bytes?: boolean;
    storage_key?: boolean;
    course_id?: boolean;
    owner_id?: boolean;
    language?: boolean;
    status?: boolean;
    error_msg?: boolean;
    metadata_json?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["documents_metadata"]>;
export type documents_metadataSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    document_id?: boolean;
    document_name?: boolean;
    doc_type?: boolean;
    mime_type?: boolean;
    size_bytes?: boolean;
    storage_key?: boolean;
    course_id?: boolean;
    owner_id?: boolean;
    language?: boolean;
    status?: boolean;
    error_msg?: boolean;
    metadata_json?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["documents_metadata"]>;
export type documents_metadataSelectScalar = {
    document_id?: boolean;
    document_name?: boolean;
    doc_type?: boolean;
    mime_type?: boolean;
    size_bytes?: boolean;
    storage_key?: boolean;
    course_id?: boolean;
    owner_id?: boolean;
    language?: boolean;
    status?: boolean;
    error_msg?: boolean;
    metadata_json?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
};
export type documents_metadataOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"document_id" | "document_name" | "doc_type" | "mime_type" | "size_bytes" | "storage_key" | "course_id" | "owner_id" | "language" | "status" | "error_msg" | "metadata_json" | "created_at" | "updated_at", ExtArgs["result"]["documents_metadata"]>;
export type documents_metadataInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.documents_metadata$coursesArgs<ExtArgs>;
    lesson_cards?: boolean | Prisma.documents_metadata$lesson_cardsArgs<ExtArgs>;
    quiz_items?: boolean | Prisma.documents_metadata$quiz_itemsArgs<ExtArgs>;
    _count?: boolean | Prisma.Documents_metadataCountOutputTypeDefaultArgs<ExtArgs>;
};
export type documents_metadataIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type documents_metadataIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $documents_metadataPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "documents_metadata";
    objects: {
        courses: Prisma.$coursesPayload<ExtArgs>[];
        lesson_cards: Prisma.$lesson_cardsPayload<ExtArgs>[];
        quiz_items: Prisma.$quiz_itemsPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        document_id: string;
        document_name: string;
        doc_type: string;
        mime_type: string;
        size_bytes: bigint;
        storage_key: string | null;
        course_id: string | null;
        owner_id: string | null;
        language: string | null;
        status: string;
        error_msg: string | null;
        metadata_json: runtime.JsonValue;
        created_at: Date;
        updated_at: Date;
    }, ExtArgs["result"]["documents_metadata"]>;
    composites: {};
};
export type documents_metadataGetPayload<S extends boolean | null | undefined | documents_metadataDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload, S>;
export type documents_metadataCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<documents_metadataFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Documents_metadataCountAggregateInputType | true;
};
export interface documents_metadataDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['documents_metadata'];
        meta: {
            name: 'documents_metadata';
        };
    };
    findUnique<T extends documents_metadataFindUniqueArgs>(args: Prisma.SelectSubset<T, documents_metadataFindUniqueArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends documents_metadataFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, documents_metadataFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends documents_metadataFindFirstArgs>(args?: Prisma.SelectSubset<T, documents_metadataFindFirstArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends documents_metadataFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, documents_metadataFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends documents_metadataFindManyArgs>(args?: Prisma.SelectSubset<T, documents_metadataFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends documents_metadataCreateArgs>(args: Prisma.SelectSubset<T, documents_metadataCreateArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends documents_metadataCreateManyArgs>(args?: Prisma.SelectSubset<T, documents_metadataCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends documents_metadataCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, documents_metadataCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends documents_metadataDeleteArgs>(args: Prisma.SelectSubset<T, documents_metadataDeleteArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends documents_metadataUpdateArgs>(args: Prisma.SelectSubset<T, documents_metadataUpdateArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends documents_metadataDeleteManyArgs>(args?: Prisma.SelectSubset<T, documents_metadataDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends documents_metadataUpdateManyArgs>(args: Prisma.SelectSubset<T, documents_metadataUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends documents_metadataUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, documents_metadataUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends documents_metadataUpsertArgs>(args: Prisma.SelectSubset<T, documents_metadataUpsertArgs<ExtArgs>>): Prisma.Prisma__documents_metadataClient<runtime.Types.Result.GetResult<Prisma.$documents_metadataPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends documents_metadataCountArgs>(args?: Prisma.Subset<T, documents_metadataCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Documents_metadataCountAggregateOutputType> : number>;
    aggregate<T extends Documents_metadataAggregateArgs>(args: Prisma.Subset<T, Documents_metadataAggregateArgs>): Prisma.PrismaPromise<GetDocuments_metadataAggregateType<T>>;
    groupBy<T extends documents_metadataGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: documents_metadataGroupByArgs['orderBy'];
    } : {
        orderBy?: documents_metadataGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, documents_metadataGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDocuments_metadataGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: documents_metadataFieldRefs;
}
export interface Prisma__documents_metadataClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    courses<T extends Prisma.documents_metadata$coursesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.documents_metadata$coursesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    lesson_cards<T extends Prisma.documents_metadata$lesson_cardsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.documents_metadata$lesson_cardsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lesson_cardsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    quiz_items<T extends Prisma.documents_metadata$quiz_itemsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.documents_metadata$quiz_itemsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$quiz_itemsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface documents_metadataFieldRefs {
    readonly document_id: Prisma.FieldRef<"documents_metadata", 'String'>;
    readonly document_name: Prisma.FieldRef<"documents_metadata", 'String'>;
    readonly doc_type: Prisma.FieldRef<"documents_metadata", 'String'>;
    readonly mime_type: Prisma.FieldRef<"documents_metadata", 'String'>;
    readonly size_bytes: Prisma.FieldRef<"documents_metadata", 'BigInt'>;
    readonly storage_key: Prisma.FieldRef<"documents_metadata", 'String'>;
    readonly course_id: Prisma.FieldRef<"documents_metadata", 'String'>;
    readonly owner_id: Prisma.FieldRef<"documents_metadata", 'String'>;
    readonly language: Prisma.FieldRef<"documents_metadata", 'String'>;
    readonly status: Prisma.FieldRef<"documents_metadata", 'String'>;
    readonly error_msg: Prisma.FieldRef<"documents_metadata", 'String'>;
    readonly metadata_json: Prisma.FieldRef<"documents_metadata", 'Json'>;
    readonly created_at: Prisma.FieldRef<"documents_metadata", 'DateTime'>;
    readonly updated_at: Prisma.FieldRef<"documents_metadata", 'DateTime'>;
}
export type documents_metadataFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
    where: Prisma.documents_metadataWhereUniqueInput;
};
export type documents_metadataFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
    where: Prisma.documents_metadataWhereUniqueInput;
};
export type documents_metadataFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
    where?: Prisma.documents_metadataWhereInput;
    orderBy?: Prisma.documents_metadataOrderByWithRelationInput | Prisma.documents_metadataOrderByWithRelationInput[];
    cursor?: Prisma.documents_metadataWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Documents_metadataScalarFieldEnum | Prisma.Documents_metadataScalarFieldEnum[];
};
export type documents_metadataFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
    where?: Prisma.documents_metadataWhereInput;
    orderBy?: Prisma.documents_metadataOrderByWithRelationInput | Prisma.documents_metadataOrderByWithRelationInput[];
    cursor?: Prisma.documents_metadataWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Documents_metadataScalarFieldEnum | Prisma.Documents_metadataScalarFieldEnum[];
};
export type documents_metadataFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
    where?: Prisma.documents_metadataWhereInput;
    orderBy?: Prisma.documents_metadataOrderByWithRelationInput | Prisma.documents_metadataOrderByWithRelationInput[];
    cursor?: Prisma.documents_metadataWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Documents_metadataScalarFieldEnum | Prisma.Documents_metadataScalarFieldEnum[];
};
export type documents_metadataCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.documents_metadataCreateInput, Prisma.documents_metadataUncheckedCreateInput>;
};
export type documents_metadataCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.documents_metadataCreateManyInput | Prisma.documents_metadataCreateManyInput[];
    skipDuplicates?: boolean;
};
export type documents_metadataCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    data: Prisma.documents_metadataCreateManyInput | Prisma.documents_metadataCreateManyInput[];
    skipDuplicates?: boolean;
};
export type documents_metadataUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.documents_metadataUpdateInput, Prisma.documents_metadataUncheckedUpdateInput>;
    where: Prisma.documents_metadataWhereUniqueInput;
};
export type documents_metadataUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.documents_metadataUpdateManyMutationInput, Prisma.documents_metadataUncheckedUpdateManyInput>;
    where?: Prisma.documents_metadataWhereInput;
    limit?: number;
};
export type documents_metadataUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.documents_metadataUpdateManyMutationInput, Prisma.documents_metadataUncheckedUpdateManyInput>;
    where?: Prisma.documents_metadataWhereInput;
    limit?: number;
};
export type documents_metadataUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
    where: Prisma.documents_metadataWhereUniqueInput;
    create: Prisma.XOR<Prisma.documents_metadataCreateInput, Prisma.documents_metadataUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.documents_metadataUpdateInput, Prisma.documents_metadataUncheckedUpdateInput>;
};
export type documents_metadataDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
    where: Prisma.documents_metadataWhereUniqueInput;
};
export type documents_metadataDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.documents_metadataWhereInput;
    limit?: number;
};
export type documents_metadata$coursesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type documents_metadata$lesson_cardsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type documents_metadata$quiz_itemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type documents_metadataDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.documents_metadataSelect<ExtArgs> | null;
    omit?: Prisma.documents_metadataOmit<ExtArgs> | null;
    include?: Prisma.documents_metadataInclude<ExtArgs> | null;
};
