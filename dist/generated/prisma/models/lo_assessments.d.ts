import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type lo_assessmentsModel = runtime.Types.Result.DefaultSelection<Prisma.$lo_assessmentsPayload>;
export type AggregateLo_assessments = {
    _count: Lo_assessmentsCountAggregateOutputType | null;
    _min: Lo_assessmentsMinAggregateOutputType | null;
    _max: Lo_assessmentsMaxAggregateOutputType | null;
};
export type Lo_assessmentsMinAggregateOutputType = {
    lo_id: string | null;
    assessment_id: string | null;
};
export type Lo_assessmentsMaxAggregateOutputType = {
    lo_id: string | null;
    assessment_id: string | null;
};
export type Lo_assessmentsCountAggregateOutputType = {
    lo_id: number;
    assessment_id: number;
    _all: number;
};
export type Lo_assessmentsMinAggregateInputType = {
    lo_id?: true;
    assessment_id?: true;
};
export type Lo_assessmentsMaxAggregateInputType = {
    lo_id?: true;
    assessment_id?: true;
};
export type Lo_assessmentsCountAggregateInputType = {
    lo_id?: true;
    assessment_id?: true;
    _all?: true;
};
export type Lo_assessmentsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lo_assessmentsWhereInput;
    orderBy?: Prisma.lo_assessmentsOrderByWithRelationInput | Prisma.lo_assessmentsOrderByWithRelationInput[];
    cursor?: Prisma.lo_assessmentsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Lo_assessmentsCountAggregateInputType;
    _min?: Lo_assessmentsMinAggregateInputType;
    _max?: Lo_assessmentsMaxAggregateInputType;
};
export type GetLo_assessmentsAggregateType<T extends Lo_assessmentsAggregateArgs> = {
    [P in keyof T & keyof AggregateLo_assessments]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateLo_assessments[P]> : Prisma.GetScalarType<T[P], AggregateLo_assessments[P]>;
};
export type lo_assessmentsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lo_assessmentsWhereInput;
    orderBy?: Prisma.lo_assessmentsOrderByWithAggregationInput | Prisma.lo_assessmentsOrderByWithAggregationInput[];
    by: Prisma.Lo_assessmentsScalarFieldEnum[] | Prisma.Lo_assessmentsScalarFieldEnum;
    having?: Prisma.lo_assessmentsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Lo_assessmentsCountAggregateInputType | true;
    _min?: Lo_assessmentsMinAggregateInputType;
    _max?: Lo_assessmentsMaxAggregateInputType;
};
export type Lo_assessmentsGroupByOutputType = {
    lo_id: string;
    assessment_id: string;
    _count: Lo_assessmentsCountAggregateOutputType | null;
    _min: Lo_assessmentsMinAggregateOutputType | null;
    _max: Lo_assessmentsMaxAggregateOutputType | null;
};
export type GetLo_assessmentsGroupByPayload<T extends lo_assessmentsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Lo_assessmentsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Lo_assessmentsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Lo_assessmentsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Lo_assessmentsGroupByOutputType[P]>;
}>>;
export type lo_assessmentsWhereInput = {
    AND?: Prisma.lo_assessmentsWhereInput | Prisma.lo_assessmentsWhereInput[];
    OR?: Prisma.lo_assessmentsWhereInput[];
    NOT?: Prisma.lo_assessmentsWhereInput | Prisma.lo_assessmentsWhereInput[];
    lo_id?: Prisma.StringFilter<"lo_assessments"> | string;
    assessment_id?: Prisma.StringFilter<"lo_assessments"> | string;
    assessments?: Prisma.XOR<Prisma.AssessmentsScalarRelationFilter, Prisma.assessmentsWhereInput>;
    learning_outcomes?: Prisma.XOR<Prisma.Learning_outcomesScalarRelationFilter, Prisma.learning_outcomesWhereInput>;
};
export type lo_assessmentsOrderByWithRelationInput = {
    lo_id?: Prisma.SortOrder;
    assessment_id?: Prisma.SortOrder;
    assessments?: Prisma.assessmentsOrderByWithRelationInput;
    learning_outcomes?: Prisma.learning_outcomesOrderByWithRelationInput;
};
export type lo_assessmentsWhereUniqueInput = Prisma.AtLeast<{
    lo_id_assessment_id?: Prisma.lo_assessmentsLo_idAssessment_idCompoundUniqueInput;
    AND?: Prisma.lo_assessmentsWhereInput | Prisma.lo_assessmentsWhereInput[];
    OR?: Prisma.lo_assessmentsWhereInput[];
    NOT?: Prisma.lo_assessmentsWhereInput | Prisma.lo_assessmentsWhereInput[];
    lo_id?: Prisma.StringFilter<"lo_assessments"> | string;
    assessment_id?: Prisma.StringFilter<"lo_assessments"> | string;
    assessments?: Prisma.XOR<Prisma.AssessmentsScalarRelationFilter, Prisma.assessmentsWhereInput>;
    learning_outcomes?: Prisma.XOR<Prisma.Learning_outcomesScalarRelationFilter, Prisma.learning_outcomesWhereInput>;
}, "lo_id_assessment_id">;
export type lo_assessmentsOrderByWithAggregationInput = {
    lo_id?: Prisma.SortOrder;
    assessment_id?: Prisma.SortOrder;
    _count?: Prisma.lo_assessmentsCountOrderByAggregateInput;
    _max?: Prisma.lo_assessmentsMaxOrderByAggregateInput;
    _min?: Prisma.lo_assessmentsMinOrderByAggregateInput;
};
export type lo_assessmentsScalarWhereWithAggregatesInput = {
    AND?: Prisma.lo_assessmentsScalarWhereWithAggregatesInput | Prisma.lo_assessmentsScalarWhereWithAggregatesInput[];
    OR?: Prisma.lo_assessmentsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.lo_assessmentsScalarWhereWithAggregatesInput | Prisma.lo_assessmentsScalarWhereWithAggregatesInput[];
    lo_id?: Prisma.StringWithAggregatesFilter<"lo_assessments"> | string;
    assessment_id?: Prisma.StringWithAggregatesFilter<"lo_assessments"> | string;
};
export type lo_assessmentsCreateInput = {
    assessments: Prisma.assessmentsCreateNestedOneWithoutLo_assessmentsInput;
    learning_outcomes: Prisma.learning_outcomesCreateNestedOneWithoutLo_assessmentsInput;
};
export type lo_assessmentsUncheckedCreateInput = {
    lo_id: string;
    assessment_id: string;
};
export type lo_assessmentsUpdateInput = {
    assessments?: Prisma.assessmentsUpdateOneRequiredWithoutLo_assessmentsNestedInput;
    learning_outcomes?: Prisma.learning_outcomesUpdateOneRequiredWithoutLo_assessmentsNestedInput;
};
export type lo_assessmentsUncheckedUpdateInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type lo_assessmentsCreateManyInput = {
    lo_id: string;
    assessment_id: string;
};
export type lo_assessmentsUpdateManyMutationInput = {};
export type lo_assessmentsUncheckedUpdateManyInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type Lo_assessmentsListRelationFilter = {
    every?: Prisma.lo_assessmentsWhereInput;
    some?: Prisma.lo_assessmentsWhereInput;
    none?: Prisma.lo_assessmentsWhereInput;
};
export type lo_assessmentsOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type lo_assessmentsLo_idAssessment_idCompoundUniqueInput = {
    lo_id: string;
    assessment_id: string;
};
export type lo_assessmentsCountOrderByAggregateInput = {
    lo_id?: Prisma.SortOrder;
    assessment_id?: Prisma.SortOrder;
};
export type lo_assessmentsMaxOrderByAggregateInput = {
    lo_id?: Prisma.SortOrder;
    assessment_id?: Prisma.SortOrder;
};
export type lo_assessmentsMinOrderByAggregateInput = {
    lo_id?: Prisma.SortOrder;
    assessment_id?: Prisma.SortOrder;
};
export type lo_assessmentsCreateNestedManyWithoutAssessmentsInput = {
    create?: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutAssessmentsInput, Prisma.lo_assessmentsUncheckedCreateWithoutAssessmentsInput> | Prisma.lo_assessmentsCreateWithoutAssessmentsInput[] | Prisma.lo_assessmentsUncheckedCreateWithoutAssessmentsInput[];
    connectOrCreate?: Prisma.lo_assessmentsCreateOrConnectWithoutAssessmentsInput | Prisma.lo_assessmentsCreateOrConnectWithoutAssessmentsInput[];
    createMany?: Prisma.lo_assessmentsCreateManyAssessmentsInputEnvelope;
    connect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
};
export type lo_assessmentsUncheckedCreateNestedManyWithoutAssessmentsInput = {
    create?: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutAssessmentsInput, Prisma.lo_assessmentsUncheckedCreateWithoutAssessmentsInput> | Prisma.lo_assessmentsCreateWithoutAssessmentsInput[] | Prisma.lo_assessmentsUncheckedCreateWithoutAssessmentsInput[];
    connectOrCreate?: Prisma.lo_assessmentsCreateOrConnectWithoutAssessmentsInput | Prisma.lo_assessmentsCreateOrConnectWithoutAssessmentsInput[];
    createMany?: Prisma.lo_assessmentsCreateManyAssessmentsInputEnvelope;
    connect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
};
export type lo_assessmentsUpdateManyWithoutAssessmentsNestedInput = {
    create?: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutAssessmentsInput, Prisma.lo_assessmentsUncheckedCreateWithoutAssessmentsInput> | Prisma.lo_assessmentsCreateWithoutAssessmentsInput[] | Prisma.lo_assessmentsUncheckedCreateWithoutAssessmentsInput[];
    connectOrCreate?: Prisma.lo_assessmentsCreateOrConnectWithoutAssessmentsInput | Prisma.lo_assessmentsCreateOrConnectWithoutAssessmentsInput[];
    upsert?: Prisma.lo_assessmentsUpsertWithWhereUniqueWithoutAssessmentsInput | Prisma.lo_assessmentsUpsertWithWhereUniqueWithoutAssessmentsInput[];
    createMany?: Prisma.lo_assessmentsCreateManyAssessmentsInputEnvelope;
    set?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    disconnect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    delete?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    connect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    update?: Prisma.lo_assessmentsUpdateWithWhereUniqueWithoutAssessmentsInput | Prisma.lo_assessmentsUpdateWithWhereUniqueWithoutAssessmentsInput[];
    updateMany?: Prisma.lo_assessmentsUpdateManyWithWhereWithoutAssessmentsInput | Prisma.lo_assessmentsUpdateManyWithWhereWithoutAssessmentsInput[];
    deleteMany?: Prisma.lo_assessmentsScalarWhereInput | Prisma.lo_assessmentsScalarWhereInput[];
};
export type lo_assessmentsUncheckedUpdateManyWithoutAssessmentsNestedInput = {
    create?: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutAssessmentsInput, Prisma.lo_assessmentsUncheckedCreateWithoutAssessmentsInput> | Prisma.lo_assessmentsCreateWithoutAssessmentsInput[] | Prisma.lo_assessmentsUncheckedCreateWithoutAssessmentsInput[];
    connectOrCreate?: Prisma.lo_assessmentsCreateOrConnectWithoutAssessmentsInput | Prisma.lo_assessmentsCreateOrConnectWithoutAssessmentsInput[];
    upsert?: Prisma.lo_assessmentsUpsertWithWhereUniqueWithoutAssessmentsInput | Prisma.lo_assessmentsUpsertWithWhereUniqueWithoutAssessmentsInput[];
    createMany?: Prisma.lo_assessmentsCreateManyAssessmentsInputEnvelope;
    set?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    disconnect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    delete?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    connect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    update?: Prisma.lo_assessmentsUpdateWithWhereUniqueWithoutAssessmentsInput | Prisma.lo_assessmentsUpdateWithWhereUniqueWithoutAssessmentsInput[];
    updateMany?: Prisma.lo_assessmentsUpdateManyWithWhereWithoutAssessmentsInput | Prisma.lo_assessmentsUpdateManyWithWhereWithoutAssessmentsInput[];
    deleteMany?: Prisma.lo_assessmentsScalarWhereInput | Prisma.lo_assessmentsScalarWhereInput[];
};
export type lo_assessmentsCreateNestedManyWithoutLearning_outcomesInput = {
    create?: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutLearning_outcomesInput, Prisma.lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.lo_assessmentsCreateWithoutLearning_outcomesInput[] | Prisma.lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.lo_assessmentsCreateOrConnectWithoutLearning_outcomesInput | Prisma.lo_assessmentsCreateOrConnectWithoutLearning_outcomesInput[];
    createMany?: Prisma.lo_assessmentsCreateManyLearning_outcomesInputEnvelope;
    connect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
};
export type lo_assessmentsUncheckedCreateNestedManyWithoutLearning_outcomesInput = {
    create?: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutLearning_outcomesInput, Prisma.lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.lo_assessmentsCreateWithoutLearning_outcomesInput[] | Prisma.lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.lo_assessmentsCreateOrConnectWithoutLearning_outcomesInput | Prisma.lo_assessmentsCreateOrConnectWithoutLearning_outcomesInput[];
    createMany?: Prisma.lo_assessmentsCreateManyLearning_outcomesInputEnvelope;
    connect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
};
export type lo_assessmentsUpdateManyWithoutLearning_outcomesNestedInput = {
    create?: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutLearning_outcomesInput, Prisma.lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.lo_assessmentsCreateWithoutLearning_outcomesInput[] | Prisma.lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.lo_assessmentsCreateOrConnectWithoutLearning_outcomesInput | Prisma.lo_assessmentsCreateOrConnectWithoutLearning_outcomesInput[];
    upsert?: Prisma.lo_assessmentsUpsertWithWhereUniqueWithoutLearning_outcomesInput | Prisma.lo_assessmentsUpsertWithWhereUniqueWithoutLearning_outcomesInput[];
    createMany?: Prisma.lo_assessmentsCreateManyLearning_outcomesInputEnvelope;
    set?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    disconnect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    delete?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    connect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    update?: Prisma.lo_assessmentsUpdateWithWhereUniqueWithoutLearning_outcomesInput | Prisma.lo_assessmentsUpdateWithWhereUniqueWithoutLearning_outcomesInput[];
    updateMany?: Prisma.lo_assessmentsUpdateManyWithWhereWithoutLearning_outcomesInput | Prisma.lo_assessmentsUpdateManyWithWhereWithoutLearning_outcomesInput[];
    deleteMany?: Prisma.lo_assessmentsScalarWhereInput | Prisma.lo_assessmentsScalarWhereInput[];
};
export type lo_assessmentsUncheckedUpdateManyWithoutLearning_outcomesNestedInput = {
    create?: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutLearning_outcomesInput, Prisma.lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput> | Prisma.lo_assessmentsCreateWithoutLearning_outcomesInput[] | Prisma.lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput[];
    connectOrCreate?: Prisma.lo_assessmentsCreateOrConnectWithoutLearning_outcomesInput | Prisma.lo_assessmentsCreateOrConnectWithoutLearning_outcomesInput[];
    upsert?: Prisma.lo_assessmentsUpsertWithWhereUniqueWithoutLearning_outcomesInput | Prisma.lo_assessmentsUpsertWithWhereUniqueWithoutLearning_outcomesInput[];
    createMany?: Prisma.lo_assessmentsCreateManyLearning_outcomesInputEnvelope;
    set?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    disconnect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    delete?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    connect?: Prisma.lo_assessmentsWhereUniqueInput | Prisma.lo_assessmentsWhereUniqueInput[];
    update?: Prisma.lo_assessmentsUpdateWithWhereUniqueWithoutLearning_outcomesInput | Prisma.lo_assessmentsUpdateWithWhereUniqueWithoutLearning_outcomesInput[];
    updateMany?: Prisma.lo_assessmentsUpdateManyWithWhereWithoutLearning_outcomesInput | Prisma.lo_assessmentsUpdateManyWithWhereWithoutLearning_outcomesInput[];
    deleteMany?: Prisma.lo_assessmentsScalarWhereInput | Prisma.lo_assessmentsScalarWhereInput[];
};
export type lo_assessmentsCreateWithoutAssessmentsInput = {
    learning_outcomes: Prisma.learning_outcomesCreateNestedOneWithoutLo_assessmentsInput;
};
export type lo_assessmentsUncheckedCreateWithoutAssessmentsInput = {
    lo_id: string;
};
export type lo_assessmentsCreateOrConnectWithoutAssessmentsInput = {
    where: Prisma.lo_assessmentsWhereUniqueInput;
    create: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutAssessmentsInput, Prisma.lo_assessmentsUncheckedCreateWithoutAssessmentsInput>;
};
export type lo_assessmentsCreateManyAssessmentsInputEnvelope = {
    data: Prisma.lo_assessmentsCreateManyAssessmentsInput | Prisma.lo_assessmentsCreateManyAssessmentsInput[];
    skipDuplicates?: boolean;
};
export type lo_assessmentsUpsertWithWhereUniqueWithoutAssessmentsInput = {
    where: Prisma.lo_assessmentsWhereUniqueInput;
    update: Prisma.XOR<Prisma.lo_assessmentsUpdateWithoutAssessmentsInput, Prisma.lo_assessmentsUncheckedUpdateWithoutAssessmentsInput>;
    create: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutAssessmentsInput, Prisma.lo_assessmentsUncheckedCreateWithoutAssessmentsInput>;
};
export type lo_assessmentsUpdateWithWhereUniqueWithoutAssessmentsInput = {
    where: Prisma.lo_assessmentsWhereUniqueInput;
    data: Prisma.XOR<Prisma.lo_assessmentsUpdateWithoutAssessmentsInput, Prisma.lo_assessmentsUncheckedUpdateWithoutAssessmentsInput>;
};
export type lo_assessmentsUpdateManyWithWhereWithoutAssessmentsInput = {
    where: Prisma.lo_assessmentsScalarWhereInput;
    data: Prisma.XOR<Prisma.lo_assessmentsUpdateManyMutationInput, Prisma.lo_assessmentsUncheckedUpdateManyWithoutAssessmentsInput>;
};
export type lo_assessmentsScalarWhereInput = {
    AND?: Prisma.lo_assessmentsScalarWhereInput | Prisma.lo_assessmentsScalarWhereInput[];
    OR?: Prisma.lo_assessmentsScalarWhereInput[];
    NOT?: Prisma.lo_assessmentsScalarWhereInput | Prisma.lo_assessmentsScalarWhereInput[];
    lo_id?: Prisma.StringFilter<"lo_assessments"> | string;
    assessment_id?: Prisma.StringFilter<"lo_assessments"> | string;
};
export type lo_assessmentsCreateWithoutLearning_outcomesInput = {
    assessments: Prisma.assessmentsCreateNestedOneWithoutLo_assessmentsInput;
};
export type lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput = {
    assessment_id: string;
};
export type lo_assessmentsCreateOrConnectWithoutLearning_outcomesInput = {
    where: Prisma.lo_assessmentsWhereUniqueInput;
    create: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutLearning_outcomesInput, Prisma.lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput>;
};
export type lo_assessmentsCreateManyLearning_outcomesInputEnvelope = {
    data: Prisma.lo_assessmentsCreateManyLearning_outcomesInput | Prisma.lo_assessmentsCreateManyLearning_outcomesInput[];
    skipDuplicates?: boolean;
};
export type lo_assessmentsUpsertWithWhereUniqueWithoutLearning_outcomesInput = {
    where: Prisma.lo_assessmentsWhereUniqueInput;
    update: Prisma.XOR<Prisma.lo_assessmentsUpdateWithoutLearning_outcomesInput, Prisma.lo_assessmentsUncheckedUpdateWithoutLearning_outcomesInput>;
    create: Prisma.XOR<Prisma.lo_assessmentsCreateWithoutLearning_outcomesInput, Prisma.lo_assessmentsUncheckedCreateWithoutLearning_outcomesInput>;
};
export type lo_assessmentsUpdateWithWhereUniqueWithoutLearning_outcomesInput = {
    where: Prisma.lo_assessmentsWhereUniqueInput;
    data: Prisma.XOR<Prisma.lo_assessmentsUpdateWithoutLearning_outcomesInput, Prisma.lo_assessmentsUncheckedUpdateWithoutLearning_outcomesInput>;
};
export type lo_assessmentsUpdateManyWithWhereWithoutLearning_outcomesInput = {
    where: Prisma.lo_assessmentsScalarWhereInput;
    data: Prisma.XOR<Prisma.lo_assessmentsUpdateManyMutationInput, Prisma.lo_assessmentsUncheckedUpdateManyWithoutLearning_outcomesInput>;
};
export type lo_assessmentsCreateManyAssessmentsInput = {
    lo_id: string;
};
export type lo_assessmentsUpdateWithoutAssessmentsInput = {
    learning_outcomes?: Prisma.learning_outcomesUpdateOneRequiredWithoutLo_assessmentsNestedInput;
};
export type lo_assessmentsUncheckedUpdateWithoutAssessmentsInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type lo_assessmentsUncheckedUpdateManyWithoutAssessmentsInput = {
    lo_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type lo_assessmentsCreateManyLearning_outcomesInput = {
    assessment_id: string;
};
export type lo_assessmentsUpdateWithoutLearning_outcomesInput = {
    assessments?: Prisma.assessmentsUpdateOneRequiredWithoutLo_assessmentsNestedInput;
};
export type lo_assessmentsUncheckedUpdateWithoutLearning_outcomesInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type lo_assessmentsUncheckedUpdateManyWithoutLearning_outcomesInput = {
    assessment_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type lo_assessmentsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    lo_id?: boolean;
    assessment_id?: boolean;
    assessments?: boolean | Prisma.assessmentsDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["lo_assessments"]>;
export type lo_assessmentsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    lo_id?: boolean;
    assessment_id?: boolean;
    assessments?: boolean | Prisma.assessmentsDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["lo_assessments"]>;
export type lo_assessmentsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    lo_id?: boolean;
    assessment_id?: boolean;
    assessments?: boolean | Prisma.assessmentsDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["lo_assessments"]>;
export type lo_assessmentsSelectScalar = {
    lo_id?: boolean;
    assessment_id?: boolean;
};
export type lo_assessmentsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"lo_id" | "assessment_id", ExtArgs["result"]["lo_assessments"]>;
export type lo_assessmentsInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    assessments?: boolean | Prisma.assessmentsDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
};
export type lo_assessmentsIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    assessments?: boolean | Prisma.assessmentsDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
};
export type lo_assessmentsIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    assessments?: boolean | Prisma.assessmentsDefaultArgs<ExtArgs>;
    learning_outcomes?: boolean | Prisma.learning_outcomesDefaultArgs<ExtArgs>;
};
export type $lo_assessmentsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "lo_assessments";
    objects: {
        assessments: Prisma.$assessmentsPayload<ExtArgs>;
        learning_outcomes: Prisma.$learning_outcomesPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        lo_id: string;
        assessment_id: string;
    }, ExtArgs["result"]["lo_assessments"]>;
    composites: {};
};
export type lo_assessmentsGetPayload<S extends boolean | null | undefined | lo_assessmentsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload, S>;
export type lo_assessmentsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<lo_assessmentsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Lo_assessmentsCountAggregateInputType | true;
};
export interface lo_assessmentsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['lo_assessments'];
        meta: {
            name: 'lo_assessments';
        };
    };
    findUnique<T extends lo_assessmentsFindUniqueArgs>(args: Prisma.SelectSubset<T, lo_assessmentsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__lo_assessmentsClient<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends lo_assessmentsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, lo_assessmentsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__lo_assessmentsClient<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends lo_assessmentsFindFirstArgs>(args?: Prisma.SelectSubset<T, lo_assessmentsFindFirstArgs<ExtArgs>>): Prisma.Prisma__lo_assessmentsClient<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends lo_assessmentsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, lo_assessmentsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__lo_assessmentsClient<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends lo_assessmentsFindManyArgs>(args?: Prisma.SelectSubset<T, lo_assessmentsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends lo_assessmentsCreateArgs>(args: Prisma.SelectSubset<T, lo_assessmentsCreateArgs<ExtArgs>>): Prisma.Prisma__lo_assessmentsClient<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends lo_assessmentsCreateManyArgs>(args?: Prisma.SelectSubset<T, lo_assessmentsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends lo_assessmentsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, lo_assessmentsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends lo_assessmentsDeleteArgs>(args: Prisma.SelectSubset<T, lo_assessmentsDeleteArgs<ExtArgs>>): Prisma.Prisma__lo_assessmentsClient<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends lo_assessmentsUpdateArgs>(args: Prisma.SelectSubset<T, lo_assessmentsUpdateArgs<ExtArgs>>): Prisma.Prisma__lo_assessmentsClient<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends lo_assessmentsDeleteManyArgs>(args?: Prisma.SelectSubset<T, lo_assessmentsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends lo_assessmentsUpdateManyArgs>(args: Prisma.SelectSubset<T, lo_assessmentsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends lo_assessmentsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, lo_assessmentsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends lo_assessmentsUpsertArgs>(args: Prisma.SelectSubset<T, lo_assessmentsUpsertArgs<ExtArgs>>): Prisma.Prisma__lo_assessmentsClient<runtime.Types.Result.GetResult<Prisma.$lo_assessmentsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends lo_assessmentsCountArgs>(args?: Prisma.Subset<T, lo_assessmentsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Lo_assessmentsCountAggregateOutputType> : number>;
    aggregate<T extends Lo_assessmentsAggregateArgs>(args: Prisma.Subset<T, Lo_assessmentsAggregateArgs>): Prisma.PrismaPromise<GetLo_assessmentsAggregateType<T>>;
    groupBy<T extends lo_assessmentsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: lo_assessmentsGroupByArgs['orderBy'];
    } : {
        orderBy?: lo_assessmentsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, lo_assessmentsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLo_assessmentsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: lo_assessmentsFieldRefs;
}
export interface Prisma__lo_assessmentsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    assessments<T extends Prisma.assessmentsDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.assessmentsDefaultArgs<ExtArgs>>): Prisma.Prisma__assessmentsClient<runtime.Types.Result.GetResult<Prisma.$assessmentsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    learning_outcomes<T extends Prisma.learning_outcomesDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.learning_outcomesDefaultArgs<ExtArgs>>): Prisma.Prisma__learning_outcomesClient<runtime.Types.Result.GetResult<Prisma.$learning_outcomesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface lo_assessmentsFieldRefs {
    readonly lo_id: Prisma.FieldRef<"lo_assessments", 'String'>;
    readonly assessment_id: Prisma.FieldRef<"lo_assessments", 'String'>;
}
export type lo_assessmentsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lo_assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.lo_assessmentsOmit<ExtArgs> | null;
    include?: Prisma.lo_assessmentsInclude<ExtArgs> | null;
    where: Prisma.lo_assessmentsWhereUniqueInput;
};
export type lo_assessmentsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lo_assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.lo_assessmentsOmit<ExtArgs> | null;
    include?: Prisma.lo_assessmentsInclude<ExtArgs> | null;
    where: Prisma.lo_assessmentsWhereUniqueInput;
};
export type lo_assessmentsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type lo_assessmentsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type lo_assessmentsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type lo_assessmentsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lo_assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.lo_assessmentsOmit<ExtArgs> | null;
    include?: Prisma.lo_assessmentsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lo_assessmentsCreateInput, Prisma.lo_assessmentsUncheckedCreateInput>;
};
export type lo_assessmentsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.lo_assessmentsCreateManyInput | Prisma.lo_assessmentsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type lo_assessmentsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lo_assessmentsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.lo_assessmentsOmit<ExtArgs> | null;
    data: Prisma.lo_assessmentsCreateManyInput | Prisma.lo_assessmentsCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.lo_assessmentsIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type lo_assessmentsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lo_assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.lo_assessmentsOmit<ExtArgs> | null;
    include?: Prisma.lo_assessmentsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lo_assessmentsUpdateInput, Prisma.lo_assessmentsUncheckedUpdateInput>;
    where: Prisma.lo_assessmentsWhereUniqueInput;
};
export type lo_assessmentsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.lo_assessmentsUpdateManyMutationInput, Prisma.lo_assessmentsUncheckedUpdateManyInput>;
    where?: Prisma.lo_assessmentsWhereInput;
    limit?: number;
};
export type lo_assessmentsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lo_assessmentsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.lo_assessmentsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lo_assessmentsUpdateManyMutationInput, Prisma.lo_assessmentsUncheckedUpdateManyInput>;
    where?: Prisma.lo_assessmentsWhereInput;
    limit?: number;
    include?: Prisma.lo_assessmentsIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type lo_assessmentsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lo_assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.lo_assessmentsOmit<ExtArgs> | null;
    include?: Prisma.lo_assessmentsInclude<ExtArgs> | null;
    where: Prisma.lo_assessmentsWhereUniqueInput;
    create: Prisma.XOR<Prisma.lo_assessmentsCreateInput, Prisma.lo_assessmentsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.lo_assessmentsUpdateInput, Prisma.lo_assessmentsUncheckedUpdateInput>;
};
export type lo_assessmentsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lo_assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.lo_assessmentsOmit<ExtArgs> | null;
    include?: Prisma.lo_assessmentsInclude<ExtArgs> | null;
    where: Prisma.lo_assessmentsWhereUniqueInput;
};
export type lo_assessmentsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lo_assessmentsWhereInput;
    limit?: number;
};
export type lo_assessmentsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lo_assessmentsSelect<ExtArgs> | null;
    omit?: Prisma.lo_assessmentsOmit<ExtArgs> | null;
    include?: Prisma.lo_assessmentsInclude<ExtArgs> | null;
};
