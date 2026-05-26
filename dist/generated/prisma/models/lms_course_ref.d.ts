import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type lms_course_refModel = runtime.Types.Result.DefaultSelection<Prisma.$lms_course_refPayload>;
export type AggregateLms_course_ref = {
    _count: Lms_course_refCountAggregateOutputType | null;
    _min: Lms_course_refMinAggregateOutputType | null;
    _max: Lms_course_refMaxAggregateOutputType | null;
};
export type Lms_course_refMinAggregateOutputType = {
    id: string | null;
    lms_type: $Enums.lms_type_enum | null;
    lms_course_id: string | null;
    course_id: string | null;
    created_at: Date | null;
};
export type Lms_course_refMaxAggregateOutputType = {
    id: string | null;
    lms_type: $Enums.lms_type_enum | null;
    lms_course_id: string | null;
    course_id: string | null;
    created_at: Date | null;
};
export type Lms_course_refCountAggregateOutputType = {
    id: number;
    lms_type: number;
    lms_course_id: number;
    course_id: number;
    created_at: number;
    _all: number;
};
export type Lms_course_refMinAggregateInputType = {
    id?: true;
    lms_type?: true;
    lms_course_id?: true;
    course_id?: true;
    created_at?: true;
};
export type Lms_course_refMaxAggregateInputType = {
    id?: true;
    lms_type?: true;
    lms_course_id?: true;
    course_id?: true;
    created_at?: true;
};
export type Lms_course_refCountAggregateInputType = {
    id?: true;
    lms_type?: true;
    lms_course_id?: true;
    course_id?: true;
    created_at?: true;
    _all?: true;
};
export type Lms_course_refAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lms_course_refWhereInput;
    orderBy?: Prisma.lms_course_refOrderByWithRelationInput | Prisma.lms_course_refOrderByWithRelationInput[];
    cursor?: Prisma.lms_course_refWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Lms_course_refCountAggregateInputType;
    _min?: Lms_course_refMinAggregateInputType;
    _max?: Lms_course_refMaxAggregateInputType;
};
export type GetLms_course_refAggregateType<T extends Lms_course_refAggregateArgs> = {
    [P in keyof T & keyof AggregateLms_course_ref]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateLms_course_ref[P]> : Prisma.GetScalarType<T[P], AggregateLms_course_ref[P]>;
};
export type lms_course_refGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lms_course_refWhereInput;
    orderBy?: Prisma.lms_course_refOrderByWithAggregationInput | Prisma.lms_course_refOrderByWithAggregationInput[];
    by: Prisma.Lms_course_refScalarFieldEnum[] | Prisma.Lms_course_refScalarFieldEnum;
    having?: Prisma.lms_course_refScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Lms_course_refCountAggregateInputType | true;
    _min?: Lms_course_refMinAggregateInputType;
    _max?: Lms_course_refMaxAggregateInputType;
};
export type Lms_course_refGroupByOutputType = {
    id: string;
    lms_type: $Enums.lms_type_enum;
    lms_course_id: string;
    course_id: string | null;
    created_at: Date;
    _count: Lms_course_refCountAggregateOutputType | null;
    _min: Lms_course_refMinAggregateOutputType | null;
    _max: Lms_course_refMaxAggregateOutputType | null;
};
export type GetLms_course_refGroupByPayload<T extends lms_course_refGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Lms_course_refGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Lms_course_refGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Lms_course_refGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Lms_course_refGroupByOutputType[P]>;
}>>;
export type lms_course_refWhereInput = {
    AND?: Prisma.lms_course_refWhereInput | Prisma.lms_course_refWhereInput[];
    OR?: Prisma.lms_course_refWhereInput[];
    NOT?: Prisma.lms_course_refWhereInput | Prisma.lms_course_refWhereInput[];
    id?: Prisma.UuidFilter<"lms_course_ref"> | string;
    lms_type?: Prisma.Enumlms_type_enumFilter<"lms_course_ref"> | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringFilter<"lms_course_ref"> | string;
    course_id?: Prisma.StringNullableFilter<"lms_course_ref"> | string | null;
    created_at?: Prisma.DateTimeFilter<"lms_course_ref"> | Date | string;
    courses?: Prisma.XOR<Prisma.CoursesNullableScalarRelationFilter, Prisma.coursesWhereInput> | null;
};
export type lms_course_refOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    lms_type?: Prisma.SortOrder;
    lms_course_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    courses?: Prisma.coursesOrderByWithRelationInput;
};
export type lms_course_refWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    lms_type_lms_course_id?: Prisma.lms_course_refLms_typeLms_course_idCompoundUniqueInput;
    AND?: Prisma.lms_course_refWhereInput | Prisma.lms_course_refWhereInput[];
    OR?: Prisma.lms_course_refWhereInput[];
    NOT?: Prisma.lms_course_refWhereInput | Prisma.lms_course_refWhereInput[];
    lms_type?: Prisma.Enumlms_type_enumFilter<"lms_course_ref"> | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringFilter<"lms_course_ref"> | string;
    course_id?: Prisma.StringNullableFilter<"lms_course_ref"> | string | null;
    created_at?: Prisma.DateTimeFilter<"lms_course_ref"> | Date | string;
    courses?: Prisma.XOR<Prisma.CoursesNullableScalarRelationFilter, Prisma.coursesWhereInput> | null;
}, "id" | "lms_type_lms_course_id">;
export type lms_course_refOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    lms_type?: Prisma.SortOrder;
    lms_course_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    _count?: Prisma.lms_course_refCountOrderByAggregateInput;
    _max?: Prisma.lms_course_refMaxOrderByAggregateInput;
    _min?: Prisma.lms_course_refMinOrderByAggregateInput;
};
export type lms_course_refScalarWhereWithAggregatesInput = {
    AND?: Prisma.lms_course_refScalarWhereWithAggregatesInput | Prisma.lms_course_refScalarWhereWithAggregatesInput[];
    OR?: Prisma.lms_course_refScalarWhereWithAggregatesInput[];
    NOT?: Prisma.lms_course_refScalarWhereWithAggregatesInput | Prisma.lms_course_refScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"lms_course_ref"> | string;
    lms_type?: Prisma.Enumlms_type_enumWithAggregatesFilter<"lms_course_ref"> | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringWithAggregatesFilter<"lms_course_ref"> | string;
    course_id?: Prisma.StringNullableWithAggregatesFilter<"lms_course_ref"> | string | null;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"lms_course_ref"> | Date | string;
};
export type lms_course_refCreateInput = {
    id?: string;
    lms_type: $Enums.lms_type_enum;
    lms_course_id: string;
    created_at?: Date | string;
    courses?: Prisma.coursesCreateNestedOneWithoutLms_course_refInput;
};
export type lms_course_refUncheckedCreateInput = {
    id?: string;
    lms_type: $Enums.lms_type_enum;
    lms_course_id: string;
    course_id?: string | null;
    created_at?: Date | string;
};
export type lms_course_refUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    courses?: Prisma.coursesUpdateOneWithoutLms_course_refNestedInput;
};
export type lms_course_refUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lms_course_refCreateManyInput = {
    id?: string;
    lms_type: $Enums.lms_type_enum;
    lms_course_id: string;
    course_id?: string | null;
    created_at?: Date | string;
};
export type lms_course_refUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lms_course_refUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type Lms_course_refListRelationFilter = {
    every?: Prisma.lms_course_refWhereInput;
    some?: Prisma.lms_course_refWhereInput;
    none?: Prisma.lms_course_refWhereInput;
};
export type lms_course_refOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type lms_course_refLms_typeLms_course_idCompoundUniqueInput = {
    lms_type: $Enums.lms_type_enum;
    lms_course_id: string;
};
export type lms_course_refCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    lms_type?: Prisma.SortOrder;
    lms_course_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
};
export type lms_course_refMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    lms_type?: Prisma.SortOrder;
    lms_course_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
};
export type lms_course_refMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    lms_type?: Prisma.SortOrder;
    lms_course_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
};
export type lms_course_refCreateNestedManyWithoutCoursesInput = {
    create?: Prisma.XOR<Prisma.lms_course_refCreateWithoutCoursesInput, Prisma.lms_course_refUncheckedCreateWithoutCoursesInput> | Prisma.lms_course_refCreateWithoutCoursesInput[] | Prisma.lms_course_refUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.lms_course_refCreateOrConnectWithoutCoursesInput | Prisma.lms_course_refCreateOrConnectWithoutCoursesInput[];
    createMany?: Prisma.lms_course_refCreateManyCoursesInputEnvelope;
    connect?: Prisma.lms_course_refWhereUniqueInput | Prisma.lms_course_refWhereUniqueInput[];
};
export type lms_course_refUncheckedCreateNestedManyWithoutCoursesInput = {
    create?: Prisma.XOR<Prisma.lms_course_refCreateWithoutCoursesInput, Prisma.lms_course_refUncheckedCreateWithoutCoursesInput> | Prisma.lms_course_refCreateWithoutCoursesInput[] | Prisma.lms_course_refUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.lms_course_refCreateOrConnectWithoutCoursesInput | Prisma.lms_course_refCreateOrConnectWithoutCoursesInput[];
    createMany?: Prisma.lms_course_refCreateManyCoursesInputEnvelope;
    connect?: Prisma.lms_course_refWhereUniqueInput | Prisma.lms_course_refWhereUniqueInput[];
};
export type lms_course_refUpdateManyWithoutCoursesNestedInput = {
    create?: Prisma.XOR<Prisma.lms_course_refCreateWithoutCoursesInput, Prisma.lms_course_refUncheckedCreateWithoutCoursesInput> | Prisma.lms_course_refCreateWithoutCoursesInput[] | Prisma.lms_course_refUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.lms_course_refCreateOrConnectWithoutCoursesInput | Prisma.lms_course_refCreateOrConnectWithoutCoursesInput[];
    upsert?: Prisma.lms_course_refUpsertWithWhereUniqueWithoutCoursesInput | Prisma.lms_course_refUpsertWithWhereUniqueWithoutCoursesInput[];
    createMany?: Prisma.lms_course_refCreateManyCoursesInputEnvelope;
    set?: Prisma.lms_course_refWhereUniqueInput | Prisma.lms_course_refWhereUniqueInput[];
    disconnect?: Prisma.lms_course_refWhereUniqueInput | Prisma.lms_course_refWhereUniqueInput[];
    delete?: Prisma.lms_course_refWhereUniqueInput | Prisma.lms_course_refWhereUniqueInput[];
    connect?: Prisma.lms_course_refWhereUniqueInput | Prisma.lms_course_refWhereUniqueInput[];
    update?: Prisma.lms_course_refUpdateWithWhereUniqueWithoutCoursesInput | Prisma.lms_course_refUpdateWithWhereUniqueWithoutCoursesInput[];
    updateMany?: Prisma.lms_course_refUpdateManyWithWhereWithoutCoursesInput | Prisma.lms_course_refUpdateManyWithWhereWithoutCoursesInput[];
    deleteMany?: Prisma.lms_course_refScalarWhereInput | Prisma.lms_course_refScalarWhereInput[];
};
export type lms_course_refUncheckedUpdateManyWithoutCoursesNestedInput = {
    create?: Prisma.XOR<Prisma.lms_course_refCreateWithoutCoursesInput, Prisma.lms_course_refUncheckedCreateWithoutCoursesInput> | Prisma.lms_course_refCreateWithoutCoursesInput[] | Prisma.lms_course_refUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.lms_course_refCreateOrConnectWithoutCoursesInput | Prisma.lms_course_refCreateOrConnectWithoutCoursesInput[];
    upsert?: Prisma.lms_course_refUpsertWithWhereUniqueWithoutCoursesInput | Prisma.lms_course_refUpsertWithWhereUniqueWithoutCoursesInput[];
    createMany?: Prisma.lms_course_refCreateManyCoursesInputEnvelope;
    set?: Prisma.lms_course_refWhereUniqueInput | Prisma.lms_course_refWhereUniqueInput[];
    disconnect?: Prisma.lms_course_refWhereUniqueInput | Prisma.lms_course_refWhereUniqueInput[];
    delete?: Prisma.lms_course_refWhereUniqueInput | Prisma.lms_course_refWhereUniqueInput[];
    connect?: Prisma.lms_course_refWhereUniqueInput | Prisma.lms_course_refWhereUniqueInput[];
    update?: Prisma.lms_course_refUpdateWithWhereUniqueWithoutCoursesInput | Prisma.lms_course_refUpdateWithWhereUniqueWithoutCoursesInput[];
    updateMany?: Prisma.lms_course_refUpdateManyWithWhereWithoutCoursesInput | Prisma.lms_course_refUpdateManyWithWhereWithoutCoursesInput[];
    deleteMany?: Prisma.lms_course_refScalarWhereInput | Prisma.lms_course_refScalarWhereInput[];
};
export type Enumlms_type_enumFieldUpdateOperationsInput = {
    set?: $Enums.lms_type_enum;
};
export type lms_course_refCreateWithoutCoursesInput = {
    id?: string;
    lms_type: $Enums.lms_type_enum;
    lms_course_id: string;
    created_at?: Date | string;
};
export type lms_course_refUncheckedCreateWithoutCoursesInput = {
    id?: string;
    lms_type: $Enums.lms_type_enum;
    lms_course_id: string;
    created_at?: Date | string;
};
export type lms_course_refCreateOrConnectWithoutCoursesInput = {
    where: Prisma.lms_course_refWhereUniqueInput;
    create: Prisma.XOR<Prisma.lms_course_refCreateWithoutCoursesInput, Prisma.lms_course_refUncheckedCreateWithoutCoursesInput>;
};
export type lms_course_refCreateManyCoursesInputEnvelope = {
    data: Prisma.lms_course_refCreateManyCoursesInput | Prisma.lms_course_refCreateManyCoursesInput[];
    skipDuplicates?: boolean;
};
export type lms_course_refUpsertWithWhereUniqueWithoutCoursesInput = {
    where: Prisma.lms_course_refWhereUniqueInput;
    update: Prisma.XOR<Prisma.lms_course_refUpdateWithoutCoursesInput, Prisma.lms_course_refUncheckedUpdateWithoutCoursesInput>;
    create: Prisma.XOR<Prisma.lms_course_refCreateWithoutCoursesInput, Prisma.lms_course_refUncheckedCreateWithoutCoursesInput>;
};
export type lms_course_refUpdateWithWhereUniqueWithoutCoursesInput = {
    where: Prisma.lms_course_refWhereUniqueInput;
    data: Prisma.XOR<Prisma.lms_course_refUpdateWithoutCoursesInput, Prisma.lms_course_refUncheckedUpdateWithoutCoursesInput>;
};
export type lms_course_refUpdateManyWithWhereWithoutCoursesInput = {
    where: Prisma.lms_course_refScalarWhereInput;
    data: Prisma.XOR<Prisma.lms_course_refUpdateManyMutationInput, Prisma.lms_course_refUncheckedUpdateManyWithoutCoursesInput>;
};
export type lms_course_refScalarWhereInput = {
    AND?: Prisma.lms_course_refScalarWhereInput | Prisma.lms_course_refScalarWhereInput[];
    OR?: Prisma.lms_course_refScalarWhereInput[];
    NOT?: Prisma.lms_course_refScalarWhereInput | Prisma.lms_course_refScalarWhereInput[];
    id?: Prisma.UuidFilter<"lms_course_ref"> | string;
    lms_type?: Prisma.Enumlms_type_enumFilter<"lms_course_ref"> | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringFilter<"lms_course_ref"> | string;
    course_id?: Prisma.StringNullableFilter<"lms_course_ref"> | string | null;
    created_at?: Prisma.DateTimeFilter<"lms_course_ref"> | Date | string;
};
export type lms_course_refCreateManyCoursesInput = {
    id?: string;
    lms_type: $Enums.lms_type_enum;
    lms_course_id: string;
    created_at?: Date | string;
};
export type lms_course_refUpdateWithoutCoursesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lms_course_refUncheckedUpdateWithoutCoursesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lms_course_refUncheckedUpdateManyWithoutCoursesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lms_course_refSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    lms_type?: boolean;
    lms_course_id?: boolean;
    course_id?: boolean;
    created_at?: boolean;
    courses?: boolean | Prisma.lms_course_ref$coursesArgs<ExtArgs>;
}, ExtArgs["result"]["lms_course_ref"]>;
export type lms_course_refSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    lms_type?: boolean;
    lms_course_id?: boolean;
    course_id?: boolean;
    created_at?: boolean;
    courses?: boolean | Prisma.lms_course_ref$coursesArgs<ExtArgs>;
}, ExtArgs["result"]["lms_course_ref"]>;
export type lms_course_refSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    lms_type?: boolean;
    lms_course_id?: boolean;
    course_id?: boolean;
    created_at?: boolean;
    courses?: boolean | Prisma.lms_course_ref$coursesArgs<ExtArgs>;
}, ExtArgs["result"]["lms_course_ref"]>;
export type lms_course_refSelectScalar = {
    id?: boolean;
    lms_type?: boolean;
    lms_course_id?: boolean;
    course_id?: boolean;
    created_at?: boolean;
};
export type lms_course_refOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "lms_type" | "lms_course_id" | "course_id" | "created_at", ExtArgs["result"]["lms_course_ref"]>;
export type lms_course_refInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.lms_course_ref$coursesArgs<ExtArgs>;
};
export type lms_course_refIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.lms_course_ref$coursesArgs<ExtArgs>;
};
export type lms_course_refIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.lms_course_ref$coursesArgs<ExtArgs>;
};
export type $lms_course_refPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "lms_course_ref";
    objects: {
        courses: Prisma.$coursesPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        lms_type: $Enums.lms_type_enum;
        lms_course_id: string;
        course_id: string | null;
        created_at: Date;
    }, ExtArgs["result"]["lms_course_ref"]>;
    composites: {};
};
export type lms_course_refGetPayload<S extends boolean | null | undefined | lms_course_refDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload, S>;
export type lms_course_refCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<lms_course_refFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Lms_course_refCountAggregateInputType | true;
};
export interface lms_course_refDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['lms_course_ref'];
        meta: {
            name: 'lms_course_ref';
        };
    };
    findUnique<T extends lms_course_refFindUniqueArgs>(args: Prisma.SelectSubset<T, lms_course_refFindUniqueArgs<ExtArgs>>): Prisma.Prisma__lms_course_refClient<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends lms_course_refFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, lms_course_refFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__lms_course_refClient<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends lms_course_refFindFirstArgs>(args?: Prisma.SelectSubset<T, lms_course_refFindFirstArgs<ExtArgs>>): Prisma.Prisma__lms_course_refClient<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends lms_course_refFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, lms_course_refFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__lms_course_refClient<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends lms_course_refFindManyArgs>(args?: Prisma.SelectSubset<T, lms_course_refFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends lms_course_refCreateArgs>(args: Prisma.SelectSubset<T, lms_course_refCreateArgs<ExtArgs>>): Prisma.Prisma__lms_course_refClient<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends lms_course_refCreateManyArgs>(args?: Prisma.SelectSubset<T, lms_course_refCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends lms_course_refCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, lms_course_refCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends lms_course_refDeleteArgs>(args: Prisma.SelectSubset<T, lms_course_refDeleteArgs<ExtArgs>>): Prisma.Prisma__lms_course_refClient<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends lms_course_refUpdateArgs>(args: Prisma.SelectSubset<T, lms_course_refUpdateArgs<ExtArgs>>): Prisma.Prisma__lms_course_refClient<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends lms_course_refDeleteManyArgs>(args?: Prisma.SelectSubset<T, lms_course_refDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends lms_course_refUpdateManyArgs>(args: Prisma.SelectSubset<T, lms_course_refUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends lms_course_refUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, lms_course_refUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends lms_course_refUpsertArgs>(args: Prisma.SelectSubset<T, lms_course_refUpsertArgs<ExtArgs>>): Prisma.Prisma__lms_course_refClient<runtime.Types.Result.GetResult<Prisma.$lms_course_refPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends lms_course_refCountArgs>(args?: Prisma.Subset<T, lms_course_refCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Lms_course_refCountAggregateOutputType> : number>;
    aggregate<T extends Lms_course_refAggregateArgs>(args: Prisma.Subset<T, Lms_course_refAggregateArgs>): Prisma.PrismaPromise<GetLms_course_refAggregateType<T>>;
    groupBy<T extends lms_course_refGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: lms_course_refGroupByArgs['orderBy'];
    } : {
        orderBy?: lms_course_refGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, lms_course_refGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLms_course_refGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: lms_course_refFieldRefs;
}
export interface Prisma__lms_course_refClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    courses<T extends Prisma.lms_course_ref$coursesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.lms_course_ref$coursesArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface lms_course_refFieldRefs {
    readonly id: Prisma.FieldRef<"lms_course_ref", 'String'>;
    readonly lms_type: Prisma.FieldRef<"lms_course_ref", 'lms_type_enum'>;
    readonly lms_course_id: Prisma.FieldRef<"lms_course_ref", 'String'>;
    readonly course_id: Prisma.FieldRef<"lms_course_ref", 'String'>;
    readonly created_at: Prisma.FieldRef<"lms_course_ref", 'DateTime'>;
}
export type lms_course_refFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_course_refSelect<ExtArgs> | null;
    omit?: Prisma.lms_course_refOmit<ExtArgs> | null;
    include?: Prisma.lms_course_refInclude<ExtArgs> | null;
    where: Prisma.lms_course_refWhereUniqueInput;
};
export type lms_course_refFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_course_refSelect<ExtArgs> | null;
    omit?: Prisma.lms_course_refOmit<ExtArgs> | null;
    include?: Prisma.lms_course_refInclude<ExtArgs> | null;
    where: Prisma.lms_course_refWhereUniqueInput;
};
export type lms_course_refFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type lms_course_refFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type lms_course_refFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type lms_course_refCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_course_refSelect<ExtArgs> | null;
    omit?: Prisma.lms_course_refOmit<ExtArgs> | null;
    include?: Prisma.lms_course_refInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lms_course_refCreateInput, Prisma.lms_course_refUncheckedCreateInput>;
};
export type lms_course_refCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.lms_course_refCreateManyInput | Prisma.lms_course_refCreateManyInput[];
    skipDuplicates?: boolean;
};
export type lms_course_refCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_course_refSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.lms_course_refOmit<ExtArgs> | null;
    data: Prisma.lms_course_refCreateManyInput | Prisma.lms_course_refCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.lms_course_refIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type lms_course_refUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_course_refSelect<ExtArgs> | null;
    omit?: Prisma.lms_course_refOmit<ExtArgs> | null;
    include?: Prisma.lms_course_refInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lms_course_refUpdateInput, Prisma.lms_course_refUncheckedUpdateInput>;
    where: Prisma.lms_course_refWhereUniqueInput;
};
export type lms_course_refUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.lms_course_refUpdateManyMutationInput, Prisma.lms_course_refUncheckedUpdateManyInput>;
    where?: Prisma.lms_course_refWhereInput;
    limit?: number;
};
export type lms_course_refUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_course_refSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.lms_course_refOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lms_course_refUpdateManyMutationInput, Prisma.lms_course_refUncheckedUpdateManyInput>;
    where?: Prisma.lms_course_refWhereInput;
    limit?: number;
    include?: Prisma.lms_course_refIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type lms_course_refUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_course_refSelect<ExtArgs> | null;
    omit?: Prisma.lms_course_refOmit<ExtArgs> | null;
    include?: Prisma.lms_course_refInclude<ExtArgs> | null;
    where: Prisma.lms_course_refWhereUniqueInput;
    create: Prisma.XOR<Prisma.lms_course_refCreateInput, Prisma.lms_course_refUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.lms_course_refUpdateInput, Prisma.lms_course_refUncheckedUpdateInput>;
};
export type lms_course_refDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_course_refSelect<ExtArgs> | null;
    omit?: Prisma.lms_course_refOmit<ExtArgs> | null;
    include?: Prisma.lms_course_refInclude<ExtArgs> | null;
    where: Prisma.lms_course_refWhereUniqueInput;
};
export type lms_course_refDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lms_course_refWhereInput;
    limit?: number;
};
export type lms_course_ref$coursesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.coursesSelect<ExtArgs> | null;
    omit?: Prisma.coursesOmit<ExtArgs> | null;
    include?: Prisma.coursesInclude<ExtArgs> | null;
    where?: Prisma.coursesWhereInput;
};
export type lms_course_refDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_course_refSelect<ExtArgs> | null;
    omit?: Prisma.lms_course_refOmit<ExtArgs> | null;
    include?: Prisma.lms_course_refInclude<ExtArgs> | null;
};
