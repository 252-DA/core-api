import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type chaptersModel = runtime.Types.Result.DefaultSelection<Prisma.$chaptersPayload>;
export type AggregateChapters = {
    _count: ChaptersCountAggregateOutputType | null;
    _avg: ChaptersAvgAggregateOutputType | null;
    _sum: ChaptersSumAggregateOutputType | null;
    _min: ChaptersMinAggregateOutputType | null;
    _max: ChaptersMaxAggregateOutputType | null;
};
export type ChaptersAvgAggregateOutputType = {
    order_index: number | null;
};
export type ChaptersSumAggregateOutputType = {
    order_index: number | null;
};
export type ChaptersMinAggregateOutputType = {
    chapter_id: string | null;
    course_id: string | null;
    code: string | null;
    title: string | null;
    order_index: number | null;
};
export type ChaptersMaxAggregateOutputType = {
    chapter_id: string | null;
    course_id: string | null;
    code: string | null;
    title: string | null;
    order_index: number | null;
};
export type ChaptersCountAggregateOutputType = {
    chapter_id: number;
    course_id: number;
    code: number;
    title: number;
    order_index: number;
    _all: number;
};
export type ChaptersAvgAggregateInputType = {
    order_index?: true;
};
export type ChaptersSumAggregateInputType = {
    order_index?: true;
};
export type ChaptersMinAggregateInputType = {
    chapter_id?: true;
    course_id?: true;
    code?: true;
    title?: true;
    order_index?: true;
};
export type ChaptersMaxAggregateInputType = {
    chapter_id?: true;
    course_id?: true;
    code?: true;
    title?: true;
    order_index?: true;
};
export type ChaptersCountAggregateInputType = {
    chapter_id?: true;
    course_id?: true;
    code?: true;
    title?: true;
    order_index?: true;
    _all?: true;
};
export type ChaptersAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chaptersWhereInput;
    orderBy?: Prisma.chaptersOrderByWithRelationInput | Prisma.chaptersOrderByWithRelationInput[];
    cursor?: Prisma.chaptersWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | ChaptersCountAggregateInputType;
    _avg?: ChaptersAvgAggregateInputType;
    _sum?: ChaptersSumAggregateInputType;
    _min?: ChaptersMinAggregateInputType;
    _max?: ChaptersMaxAggregateInputType;
};
export type GetChaptersAggregateType<T extends ChaptersAggregateArgs> = {
    [P in keyof T & keyof AggregateChapters]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateChapters[P]> : Prisma.GetScalarType<T[P], AggregateChapters[P]>;
};
export type chaptersGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chaptersWhereInput;
    orderBy?: Prisma.chaptersOrderByWithAggregationInput | Prisma.chaptersOrderByWithAggregationInput[];
    by: Prisma.ChaptersScalarFieldEnum[] | Prisma.ChaptersScalarFieldEnum;
    having?: Prisma.chaptersScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ChaptersCountAggregateInputType | true;
    _avg?: ChaptersAvgAggregateInputType;
    _sum?: ChaptersSumAggregateInputType;
    _min?: ChaptersMinAggregateInputType;
    _max?: ChaptersMaxAggregateInputType;
};
export type ChaptersGroupByOutputType = {
    chapter_id: string;
    course_id: string;
    code: string;
    title: string;
    order_index: number;
    _count: ChaptersCountAggregateOutputType | null;
    _avg: ChaptersAvgAggregateOutputType | null;
    _sum: ChaptersSumAggregateOutputType | null;
    _min: ChaptersMinAggregateOutputType | null;
    _max: ChaptersMaxAggregateOutputType | null;
};
export type GetChaptersGroupByPayload<T extends chaptersGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ChaptersGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ChaptersGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ChaptersGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ChaptersGroupByOutputType[P]>;
}>>;
export type chaptersWhereInput = {
    AND?: Prisma.chaptersWhereInput | Prisma.chaptersWhereInput[];
    OR?: Prisma.chaptersWhereInput[];
    NOT?: Prisma.chaptersWhereInput | Prisma.chaptersWhereInput[];
    chapter_id?: Prisma.StringFilter<"chapters"> | string;
    course_id?: Prisma.StringFilter<"chapters"> | string;
    code?: Prisma.StringFilter<"chapters"> | string;
    title?: Prisma.StringFilter<"chapters"> | string;
    order_index?: Prisma.IntFilter<"chapters"> | number;
    courses?: Prisma.XOR<Prisma.CoursesScalarRelationFilter, Prisma.coursesWhereInput>;
};
export type chaptersOrderByWithRelationInput = {
    chapter_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    order_index?: Prisma.SortOrder;
    courses?: Prisma.coursesOrderByWithRelationInput;
};
export type chaptersWhereUniqueInput = Prisma.AtLeast<{
    chapter_id?: string;
    course_id_code?: Prisma.chaptersCourse_idCodeCompoundUniqueInput;
    AND?: Prisma.chaptersWhereInput | Prisma.chaptersWhereInput[];
    OR?: Prisma.chaptersWhereInput[];
    NOT?: Prisma.chaptersWhereInput | Prisma.chaptersWhereInput[];
    course_id?: Prisma.StringFilter<"chapters"> | string;
    code?: Prisma.StringFilter<"chapters"> | string;
    title?: Prisma.StringFilter<"chapters"> | string;
    order_index?: Prisma.IntFilter<"chapters"> | number;
    courses?: Prisma.XOR<Prisma.CoursesScalarRelationFilter, Prisma.coursesWhereInput>;
}, "chapter_id" | "course_id_code">;
export type chaptersOrderByWithAggregationInput = {
    chapter_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    order_index?: Prisma.SortOrder;
    _count?: Prisma.chaptersCountOrderByAggregateInput;
    _avg?: Prisma.chaptersAvgOrderByAggregateInput;
    _max?: Prisma.chaptersMaxOrderByAggregateInput;
    _min?: Prisma.chaptersMinOrderByAggregateInput;
    _sum?: Prisma.chaptersSumOrderByAggregateInput;
};
export type chaptersScalarWhereWithAggregatesInput = {
    AND?: Prisma.chaptersScalarWhereWithAggregatesInput | Prisma.chaptersScalarWhereWithAggregatesInput[];
    OR?: Prisma.chaptersScalarWhereWithAggregatesInput[];
    NOT?: Prisma.chaptersScalarWhereWithAggregatesInput | Prisma.chaptersScalarWhereWithAggregatesInput[];
    chapter_id?: Prisma.StringWithAggregatesFilter<"chapters"> | string;
    course_id?: Prisma.StringWithAggregatesFilter<"chapters"> | string;
    code?: Prisma.StringWithAggregatesFilter<"chapters"> | string;
    title?: Prisma.StringWithAggregatesFilter<"chapters"> | string;
    order_index?: Prisma.IntWithAggregatesFilter<"chapters"> | number;
};
export type chaptersCreateInput = {
    chapter_id: string;
    code: string;
    title: string;
    order_index?: number;
    courses: Prisma.coursesCreateNestedOneWithoutChaptersInput;
};
export type chaptersUncheckedCreateInput = {
    chapter_id: string;
    course_id: string;
    code: string;
    title: string;
    order_index?: number;
};
export type chaptersUpdateInput = {
    chapter_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    order_index?: Prisma.IntFieldUpdateOperationsInput | number;
    courses?: Prisma.coursesUpdateOneRequiredWithoutChaptersNestedInput;
};
export type chaptersUncheckedUpdateInput = {
    chapter_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    order_index?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type chaptersCreateManyInput = {
    chapter_id: string;
    course_id: string;
    code: string;
    title: string;
    order_index?: number;
};
export type chaptersUpdateManyMutationInput = {
    chapter_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    order_index?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type chaptersUncheckedUpdateManyInput = {
    chapter_id?: Prisma.StringFieldUpdateOperationsInput | string;
    course_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    order_index?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type chaptersCourse_idCodeCompoundUniqueInput = {
    course_id: string;
    code: string;
};
export type chaptersCountOrderByAggregateInput = {
    chapter_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    order_index?: Prisma.SortOrder;
};
export type chaptersAvgOrderByAggregateInput = {
    order_index?: Prisma.SortOrder;
};
export type chaptersMaxOrderByAggregateInput = {
    chapter_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    order_index?: Prisma.SortOrder;
};
export type chaptersMinOrderByAggregateInput = {
    chapter_id?: Prisma.SortOrder;
    course_id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    order_index?: Prisma.SortOrder;
};
export type chaptersSumOrderByAggregateInput = {
    order_index?: Prisma.SortOrder;
};
export type ChaptersListRelationFilter = {
    every?: Prisma.chaptersWhereInput;
    some?: Prisma.chaptersWhereInput;
    none?: Prisma.chaptersWhereInput;
};
export type chaptersOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type chaptersCreateNestedManyWithoutCoursesInput = {
    create?: Prisma.XOR<Prisma.chaptersCreateWithoutCoursesInput, Prisma.chaptersUncheckedCreateWithoutCoursesInput> | Prisma.chaptersCreateWithoutCoursesInput[] | Prisma.chaptersUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.chaptersCreateOrConnectWithoutCoursesInput | Prisma.chaptersCreateOrConnectWithoutCoursesInput[];
    createMany?: Prisma.chaptersCreateManyCoursesInputEnvelope;
    connect?: Prisma.chaptersWhereUniqueInput | Prisma.chaptersWhereUniqueInput[];
};
export type chaptersUncheckedCreateNestedManyWithoutCoursesInput = {
    create?: Prisma.XOR<Prisma.chaptersCreateWithoutCoursesInput, Prisma.chaptersUncheckedCreateWithoutCoursesInput> | Prisma.chaptersCreateWithoutCoursesInput[] | Prisma.chaptersUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.chaptersCreateOrConnectWithoutCoursesInput | Prisma.chaptersCreateOrConnectWithoutCoursesInput[];
    createMany?: Prisma.chaptersCreateManyCoursesInputEnvelope;
    connect?: Prisma.chaptersWhereUniqueInput | Prisma.chaptersWhereUniqueInput[];
};
export type chaptersUpdateManyWithoutCoursesNestedInput = {
    create?: Prisma.XOR<Prisma.chaptersCreateWithoutCoursesInput, Prisma.chaptersUncheckedCreateWithoutCoursesInput> | Prisma.chaptersCreateWithoutCoursesInput[] | Prisma.chaptersUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.chaptersCreateOrConnectWithoutCoursesInput | Prisma.chaptersCreateOrConnectWithoutCoursesInput[];
    upsert?: Prisma.chaptersUpsertWithWhereUniqueWithoutCoursesInput | Prisma.chaptersUpsertWithWhereUniqueWithoutCoursesInput[];
    createMany?: Prisma.chaptersCreateManyCoursesInputEnvelope;
    set?: Prisma.chaptersWhereUniqueInput | Prisma.chaptersWhereUniqueInput[];
    disconnect?: Prisma.chaptersWhereUniqueInput | Prisma.chaptersWhereUniqueInput[];
    delete?: Prisma.chaptersWhereUniqueInput | Prisma.chaptersWhereUniqueInput[];
    connect?: Prisma.chaptersWhereUniqueInput | Prisma.chaptersWhereUniqueInput[];
    update?: Prisma.chaptersUpdateWithWhereUniqueWithoutCoursesInput | Prisma.chaptersUpdateWithWhereUniqueWithoutCoursesInput[];
    updateMany?: Prisma.chaptersUpdateManyWithWhereWithoutCoursesInput | Prisma.chaptersUpdateManyWithWhereWithoutCoursesInput[];
    deleteMany?: Prisma.chaptersScalarWhereInput | Prisma.chaptersScalarWhereInput[];
};
export type chaptersUncheckedUpdateManyWithoutCoursesNestedInput = {
    create?: Prisma.XOR<Prisma.chaptersCreateWithoutCoursesInput, Prisma.chaptersUncheckedCreateWithoutCoursesInput> | Prisma.chaptersCreateWithoutCoursesInput[] | Prisma.chaptersUncheckedCreateWithoutCoursesInput[];
    connectOrCreate?: Prisma.chaptersCreateOrConnectWithoutCoursesInput | Prisma.chaptersCreateOrConnectWithoutCoursesInput[];
    upsert?: Prisma.chaptersUpsertWithWhereUniqueWithoutCoursesInput | Prisma.chaptersUpsertWithWhereUniqueWithoutCoursesInput[];
    createMany?: Prisma.chaptersCreateManyCoursesInputEnvelope;
    set?: Prisma.chaptersWhereUniqueInput | Prisma.chaptersWhereUniqueInput[];
    disconnect?: Prisma.chaptersWhereUniqueInput | Prisma.chaptersWhereUniqueInput[];
    delete?: Prisma.chaptersWhereUniqueInput | Prisma.chaptersWhereUniqueInput[];
    connect?: Prisma.chaptersWhereUniqueInput | Prisma.chaptersWhereUniqueInput[];
    update?: Prisma.chaptersUpdateWithWhereUniqueWithoutCoursesInput | Prisma.chaptersUpdateWithWhereUniqueWithoutCoursesInput[];
    updateMany?: Prisma.chaptersUpdateManyWithWhereWithoutCoursesInput | Prisma.chaptersUpdateManyWithWhereWithoutCoursesInput[];
    deleteMany?: Prisma.chaptersScalarWhereInput | Prisma.chaptersScalarWhereInput[];
};
export type chaptersCreateWithoutCoursesInput = {
    chapter_id: string;
    code: string;
    title: string;
    order_index?: number;
};
export type chaptersUncheckedCreateWithoutCoursesInput = {
    chapter_id: string;
    code: string;
    title: string;
    order_index?: number;
};
export type chaptersCreateOrConnectWithoutCoursesInput = {
    where: Prisma.chaptersWhereUniqueInput;
    create: Prisma.XOR<Prisma.chaptersCreateWithoutCoursesInput, Prisma.chaptersUncheckedCreateWithoutCoursesInput>;
};
export type chaptersCreateManyCoursesInputEnvelope = {
    data: Prisma.chaptersCreateManyCoursesInput | Prisma.chaptersCreateManyCoursesInput[];
    skipDuplicates?: boolean;
};
export type chaptersUpsertWithWhereUniqueWithoutCoursesInput = {
    where: Prisma.chaptersWhereUniqueInput;
    update: Prisma.XOR<Prisma.chaptersUpdateWithoutCoursesInput, Prisma.chaptersUncheckedUpdateWithoutCoursesInput>;
    create: Prisma.XOR<Prisma.chaptersCreateWithoutCoursesInput, Prisma.chaptersUncheckedCreateWithoutCoursesInput>;
};
export type chaptersUpdateWithWhereUniqueWithoutCoursesInput = {
    where: Prisma.chaptersWhereUniqueInput;
    data: Prisma.XOR<Prisma.chaptersUpdateWithoutCoursesInput, Prisma.chaptersUncheckedUpdateWithoutCoursesInput>;
};
export type chaptersUpdateManyWithWhereWithoutCoursesInput = {
    where: Prisma.chaptersScalarWhereInput;
    data: Prisma.XOR<Prisma.chaptersUpdateManyMutationInput, Prisma.chaptersUncheckedUpdateManyWithoutCoursesInput>;
};
export type chaptersScalarWhereInput = {
    AND?: Prisma.chaptersScalarWhereInput | Prisma.chaptersScalarWhereInput[];
    OR?: Prisma.chaptersScalarWhereInput[];
    NOT?: Prisma.chaptersScalarWhereInput | Prisma.chaptersScalarWhereInput[];
    chapter_id?: Prisma.StringFilter<"chapters"> | string;
    course_id?: Prisma.StringFilter<"chapters"> | string;
    code?: Prisma.StringFilter<"chapters"> | string;
    title?: Prisma.StringFilter<"chapters"> | string;
    order_index?: Prisma.IntFilter<"chapters"> | number;
};
export type chaptersCreateManyCoursesInput = {
    chapter_id: string;
    code: string;
    title: string;
    order_index?: number;
};
export type chaptersUpdateWithoutCoursesInput = {
    chapter_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    order_index?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type chaptersUncheckedUpdateWithoutCoursesInput = {
    chapter_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    order_index?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type chaptersUncheckedUpdateManyWithoutCoursesInput = {
    chapter_id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    order_index?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type chaptersSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chapter_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    title?: boolean;
    order_index?: boolean;
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chapters"]>;
export type chaptersSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chapter_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    title?: boolean;
    order_index?: boolean;
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chapters"]>;
export type chaptersSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chapter_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    title?: boolean;
    order_index?: boolean;
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chapters"]>;
export type chaptersSelectScalar = {
    chapter_id?: boolean;
    course_id?: boolean;
    code?: boolean;
    title?: boolean;
    order_index?: boolean;
};
export type chaptersOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"chapter_id" | "course_id" | "code" | "title" | "order_index", ExtArgs["result"]["chapters"]>;
export type chaptersInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
};
export type chaptersIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
};
export type chaptersIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    courses?: boolean | Prisma.coursesDefaultArgs<ExtArgs>;
};
export type $chaptersPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "chapters";
    objects: {
        courses: Prisma.$coursesPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        chapter_id: string;
        course_id: string;
        code: string;
        title: string;
        order_index: number;
    }, ExtArgs["result"]["chapters"]>;
    composites: {};
};
export type chaptersGetPayload<S extends boolean | null | undefined | chaptersDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$chaptersPayload, S>;
export type chaptersCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<chaptersFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ChaptersCountAggregateInputType | true;
};
export interface chaptersDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['chapters'];
        meta: {
            name: 'chapters';
        };
    };
    findUnique<T extends chaptersFindUniqueArgs>(args: Prisma.SelectSubset<T, chaptersFindUniqueArgs<ExtArgs>>): Prisma.Prisma__chaptersClient<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends chaptersFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, chaptersFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__chaptersClient<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends chaptersFindFirstArgs>(args?: Prisma.SelectSubset<T, chaptersFindFirstArgs<ExtArgs>>): Prisma.Prisma__chaptersClient<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends chaptersFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, chaptersFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__chaptersClient<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends chaptersFindManyArgs>(args?: Prisma.SelectSubset<T, chaptersFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends chaptersCreateArgs>(args: Prisma.SelectSubset<T, chaptersCreateArgs<ExtArgs>>): Prisma.Prisma__chaptersClient<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends chaptersCreateManyArgs>(args?: Prisma.SelectSubset<T, chaptersCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends chaptersCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, chaptersCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends chaptersDeleteArgs>(args: Prisma.SelectSubset<T, chaptersDeleteArgs<ExtArgs>>): Prisma.Prisma__chaptersClient<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends chaptersUpdateArgs>(args: Prisma.SelectSubset<T, chaptersUpdateArgs<ExtArgs>>): Prisma.Prisma__chaptersClient<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends chaptersDeleteManyArgs>(args?: Prisma.SelectSubset<T, chaptersDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends chaptersUpdateManyArgs>(args: Prisma.SelectSubset<T, chaptersUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends chaptersUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, chaptersUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends chaptersUpsertArgs>(args: Prisma.SelectSubset<T, chaptersUpsertArgs<ExtArgs>>): Prisma.Prisma__chaptersClient<runtime.Types.Result.GetResult<Prisma.$chaptersPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends chaptersCountArgs>(args?: Prisma.Subset<T, chaptersCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ChaptersCountAggregateOutputType> : number>;
    aggregate<T extends ChaptersAggregateArgs>(args: Prisma.Subset<T, ChaptersAggregateArgs>): Prisma.PrismaPromise<GetChaptersAggregateType<T>>;
    groupBy<T extends chaptersGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: chaptersGroupByArgs['orderBy'];
    } : {
        orderBy?: chaptersGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, chaptersGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChaptersGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: chaptersFieldRefs;
}
export interface Prisma__chaptersClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    courses<T extends Prisma.coursesDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.coursesDefaultArgs<ExtArgs>>): Prisma.Prisma__coursesClient<runtime.Types.Result.GetResult<Prisma.$coursesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface chaptersFieldRefs {
    readonly chapter_id: Prisma.FieldRef<"chapters", 'String'>;
    readonly course_id: Prisma.FieldRef<"chapters", 'String'>;
    readonly code: Prisma.FieldRef<"chapters", 'String'>;
    readonly title: Prisma.FieldRef<"chapters", 'String'>;
    readonly order_index: Prisma.FieldRef<"chapters", 'Int'>;
}
export type chaptersFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chaptersSelect<ExtArgs> | null;
    omit?: Prisma.chaptersOmit<ExtArgs> | null;
    include?: Prisma.chaptersInclude<ExtArgs> | null;
    where: Prisma.chaptersWhereUniqueInput;
};
export type chaptersFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chaptersSelect<ExtArgs> | null;
    omit?: Prisma.chaptersOmit<ExtArgs> | null;
    include?: Prisma.chaptersInclude<ExtArgs> | null;
    where: Prisma.chaptersWhereUniqueInput;
};
export type chaptersFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type chaptersFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type chaptersFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type chaptersCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chaptersSelect<ExtArgs> | null;
    omit?: Prisma.chaptersOmit<ExtArgs> | null;
    include?: Prisma.chaptersInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chaptersCreateInput, Prisma.chaptersUncheckedCreateInput>;
};
export type chaptersCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.chaptersCreateManyInput | Prisma.chaptersCreateManyInput[];
    skipDuplicates?: boolean;
};
export type chaptersCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chaptersSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.chaptersOmit<ExtArgs> | null;
    data: Prisma.chaptersCreateManyInput | Prisma.chaptersCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.chaptersIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type chaptersUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chaptersSelect<ExtArgs> | null;
    omit?: Prisma.chaptersOmit<ExtArgs> | null;
    include?: Prisma.chaptersInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chaptersUpdateInput, Prisma.chaptersUncheckedUpdateInput>;
    where: Prisma.chaptersWhereUniqueInput;
};
export type chaptersUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.chaptersUpdateManyMutationInput, Prisma.chaptersUncheckedUpdateManyInput>;
    where?: Prisma.chaptersWhereInput;
    limit?: number;
};
export type chaptersUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chaptersSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.chaptersOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chaptersUpdateManyMutationInput, Prisma.chaptersUncheckedUpdateManyInput>;
    where?: Prisma.chaptersWhereInput;
    limit?: number;
    include?: Prisma.chaptersIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type chaptersUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chaptersSelect<ExtArgs> | null;
    omit?: Prisma.chaptersOmit<ExtArgs> | null;
    include?: Prisma.chaptersInclude<ExtArgs> | null;
    where: Prisma.chaptersWhereUniqueInput;
    create: Prisma.XOR<Prisma.chaptersCreateInput, Prisma.chaptersUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.chaptersUpdateInput, Prisma.chaptersUncheckedUpdateInput>;
};
export type chaptersDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chaptersSelect<ExtArgs> | null;
    omit?: Prisma.chaptersOmit<ExtArgs> | null;
    include?: Prisma.chaptersInclude<ExtArgs> | null;
    where: Prisma.chaptersWhereUniqueInput;
};
export type chaptersDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chaptersWhereInput;
    limit?: number;
};
export type chaptersDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chaptersSelect<ExtArgs> | null;
    omit?: Prisma.chaptersOmit<ExtArgs> | null;
    include?: Prisma.chaptersInclude<ExtArgs> | null;
};
