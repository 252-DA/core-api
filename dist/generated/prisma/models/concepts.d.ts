import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type conceptsModel = runtime.Types.Result.DefaultSelection<Prisma.$conceptsPayload>;
export type AggregateConcepts = {
    _count: ConceptsCountAggregateOutputType | null;
    _min: ConceptsMinAggregateOutputType | null;
    _max: ConceptsMaxAggregateOutputType | null;
};
export type ConceptsMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    canonical_name: string | null;
    slug: string | null;
    domain: string | null;
    category: string | null;
    language: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type ConceptsMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    canonical_name: string | null;
    slug: string | null;
    domain: string | null;
    category: string | null;
    language: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type ConceptsCountAggregateOutputType = {
    id: number;
    name: number;
    canonical_name: number;
    slug: number;
    domain: number;
    category: number;
    language: number;
    created_at: number;
    updated_at: number;
    _all: number;
};
export type ConceptsMinAggregateInputType = {
    id?: true;
    name?: true;
    canonical_name?: true;
    slug?: true;
    domain?: true;
    category?: true;
    language?: true;
    created_at?: true;
    updated_at?: true;
};
export type ConceptsMaxAggregateInputType = {
    id?: true;
    name?: true;
    canonical_name?: true;
    slug?: true;
    domain?: true;
    category?: true;
    language?: true;
    created_at?: true;
    updated_at?: true;
};
export type ConceptsCountAggregateInputType = {
    id?: true;
    name?: true;
    canonical_name?: true;
    slug?: true;
    domain?: true;
    category?: true;
    language?: true;
    created_at?: true;
    updated_at?: true;
    _all?: true;
};
export type ConceptsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.conceptsWhereInput;
    orderBy?: Prisma.conceptsOrderByWithRelationInput | Prisma.conceptsOrderByWithRelationInput[];
    cursor?: Prisma.conceptsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | ConceptsCountAggregateInputType;
    _min?: ConceptsMinAggregateInputType;
    _max?: ConceptsMaxAggregateInputType;
};
export type GetConceptsAggregateType<T extends ConceptsAggregateArgs> = {
    [P in keyof T & keyof AggregateConcepts]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateConcepts[P]> : Prisma.GetScalarType<T[P], AggregateConcepts[P]>;
};
export type conceptsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.conceptsWhereInput;
    orderBy?: Prisma.conceptsOrderByWithAggregationInput | Prisma.conceptsOrderByWithAggregationInput[];
    by: Prisma.ConceptsScalarFieldEnum[] | Prisma.ConceptsScalarFieldEnum;
    having?: Prisma.conceptsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ConceptsCountAggregateInputType | true;
    _min?: ConceptsMinAggregateInputType;
    _max?: ConceptsMaxAggregateInputType;
};
export type ConceptsGroupByOutputType = {
    id: string;
    name: string;
    canonical_name: string;
    slug: string;
    domain: string | null;
    category: string;
    language: string | null;
    created_at: Date;
    updated_at: Date;
    _count: ConceptsCountAggregateOutputType | null;
    _min: ConceptsMinAggregateOutputType | null;
    _max: ConceptsMaxAggregateOutputType | null;
};
export type GetConceptsGroupByPayload<T extends conceptsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ConceptsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ConceptsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ConceptsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ConceptsGroupByOutputType[P]>;
}>>;
export type conceptsWhereInput = {
    AND?: Prisma.conceptsWhereInput | Prisma.conceptsWhereInput[];
    OR?: Prisma.conceptsWhereInput[];
    NOT?: Prisma.conceptsWhereInput | Prisma.conceptsWhereInput[];
    id?: Prisma.StringFilter<"concepts"> | string;
    name?: Prisma.StringFilter<"concepts"> | string;
    canonical_name?: Prisma.StringFilter<"concepts"> | string;
    slug?: Prisma.StringFilter<"concepts"> | string;
    domain?: Prisma.StringNullableFilter<"concepts"> | string | null;
    category?: Prisma.StringFilter<"concepts"> | string;
    language?: Prisma.StringNullableFilter<"concepts"> | string | null;
    created_at?: Prisma.DateTimeFilter<"concepts"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"concepts"> | Date | string;
    chunk_concepts?: Prisma.Chunk_conceptsListRelationFilter;
};
export type conceptsOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    canonical_name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    domain?: Prisma.SortOrderInput | Prisma.SortOrder;
    category?: Prisma.SortOrder;
    language?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    chunk_concepts?: Prisma.chunk_conceptsOrderByRelationAggregateInput;
};
export type conceptsWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    slug?: string;
    AND?: Prisma.conceptsWhereInput | Prisma.conceptsWhereInput[];
    OR?: Prisma.conceptsWhereInput[];
    NOT?: Prisma.conceptsWhereInput | Prisma.conceptsWhereInput[];
    name?: Prisma.StringFilter<"concepts"> | string;
    canonical_name?: Prisma.StringFilter<"concepts"> | string;
    domain?: Prisma.StringNullableFilter<"concepts"> | string | null;
    category?: Prisma.StringFilter<"concepts"> | string;
    language?: Prisma.StringNullableFilter<"concepts"> | string | null;
    created_at?: Prisma.DateTimeFilter<"concepts"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"concepts"> | Date | string;
    chunk_concepts?: Prisma.Chunk_conceptsListRelationFilter;
}, "id" | "slug">;
export type conceptsOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    canonical_name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    domain?: Prisma.SortOrderInput | Prisma.SortOrder;
    category?: Prisma.SortOrder;
    language?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    _count?: Prisma.conceptsCountOrderByAggregateInput;
    _max?: Prisma.conceptsMaxOrderByAggregateInput;
    _min?: Prisma.conceptsMinOrderByAggregateInput;
};
export type conceptsScalarWhereWithAggregatesInput = {
    AND?: Prisma.conceptsScalarWhereWithAggregatesInput | Prisma.conceptsScalarWhereWithAggregatesInput[];
    OR?: Prisma.conceptsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.conceptsScalarWhereWithAggregatesInput | Prisma.conceptsScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"concepts"> | string;
    name?: Prisma.StringWithAggregatesFilter<"concepts"> | string;
    canonical_name?: Prisma.StringWithAggregatesFilter<"concepts"> | string;
    slug?: Prisma.StringWithAggregatesFilter<"concepts"> | string;
    domain?: Prisma.StringNullableWithAggregatesFilter<"concepts"> | string | null;
    category?: Prisma.StringWithAggregatesFilter<"concepts"> | string;
    language?: Prisma.StringNullableWithAggregatesFilter<"concepts"> | string | null;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"concepts"> | Date | string;
    updated_at?: Prisma.DateTimeWithAggregatesFilter<"concepts"> | Date | string;
};
export type conceptsCreateInput = {
    id: string;
    name: string;
    canonical_name: string;
    slug: string;
    domain?: string | null;
    category?: string;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsCreateNestedManyWithoutConceptsInput;
};
export type conceptsUncheckedCreateInput = {
    id: string;
    name: string;
    canonical_name: string;
    slug: string;
    domain?: string | null;
    category?: string;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedCreateNestedManyWithoutConceptsInput;
};
export type conceptsUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    canonical_name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUpdateManyWithoutConceptsNestedInput;
};
export type conceptsUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    canonical_name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunk_concepts?: Prisma.chunk_conceptsUncheckedUpdateManyWithoutConceptsNestedInput;
};
export type conceptsCreateManyInput = {
    id: string;
    name: string;
    canonical_name: string;
    slug: string;
    domain?: string | null;
    category?: string;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type conceptsUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    canonical_name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type conceptsUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    canonical_name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ConceptsScalarRelationFilter = {
    is?: Prisma.conceptsWhereInput;
    isNot?: Prisma.conceptsWhereInput;
};
export type conceptsCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    canonical_name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    domain?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    language?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type conceptsMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    canonical_name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    domain?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    language?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type conceptsMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    canonical_name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    domain?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    language?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type conceptsCreateNestedOneWithoutChunk_conceptsInput = {
    create?: Prisma.XOR<Prisma.conceptsCreateWithoutChunk_conceptsInput, Prisma.conceptsUncheckedCreateWithoutChunk_conceptsInput>;
    connectOrCreate?: Prisma.conceptsCreateOrConnectWithoutChunk_conceptsInput;
    connect?: Prisma.conceptsWhereUniqueInput;
};
export type conceptsUpdateOneRequiredWithoutChunk_conceptsNestedInput = {
    create?: Prisma.XOR<Prisma.conceptsCreateWithoutChunk_conceptsInput, Prisma.conceptsUncheckedCreateWithoutChunk_conceptsInput>;
    connectOrCreate?: Prisma.conceptsCreateOrConnectWithoutChunk_conceptsInput;
    upsert?: Prisma.conceptsUpsertWithoutChunk_conceptsInput;
    connect?: Prisma.conceptsWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.conceptsUpdateToOneWithWhereWithoutChunk_conceptsInput, Prisma.conceptsUpdateWithoutChunk_conceptsInput>, Prisma.conceptsUncheckedUpdateWithoutChunk_conceptsInput>;
};
export type conceptsCreateWithoutChunk_conceptsInput = {
    id: string;
    name: string;
    canonical_name: string;
    slug: string;
    domain?: string | null;
    category?: string;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type conceptsUncheckedCreateWithoutChunk_conceptsInput = {
    id: string;
    name: string;
    canonical_name: string;
    slug: string;
    domain?: string | null;
    category?: string;
    language?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type conceptsCreateOrConnectWithoutChunk_conceptsInput = {
    where: Prisma.conceptsWhereUniqueInput;
    create: Prisma.XOR<Prisma.conceptsCreateWithoutChunk_conceptsInput, Prisma.conceptsUncheckedCreateWithoutChunk_conceptsInput>;
};
export type conceptsUpsertWithoutChunk_conceptsInput = {
    update: Prisma.XOR<Prisma.conceptsUpdateWithoutChunk_conceptsInput, Prisma.conceptsUncheckedUpdateWithoutChunk_conceptsInput>;
    create: Prisma.XOR<Prisma.conceptsCreateWithoutChunk_conceptsInput, Prisma.conceptsUncheckedCreateWithoutChunk_conceptsInput>;
    where?: Prisma.conceptsWhereInput;
};
export type conceptsUpdateToOneWithWhereWithoutChunk_conceptsInput = {
    where?: Prisma.conceptsWhereInput;
    data: Prisma.XOR<Prisma.conceptsUpdateWithoutChunk_conceptsInput, Prisma.conceptsUncheckedUpdateWithoutChunk_conceptsInput>;
};
export type conceptsUpdateWithoutChunk_conceptsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    canonical_name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type conceptsUncheckedUpdateWithoutChunk_conceptsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    canonical_name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    language?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ConceptsCountOutputType = {
    chunk_concepts: number;
};
export type ConceptsCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunk_concepts?: boolean | ConceptsCountOutputTypeCountChunk_conceptsArgs;
};
export type ConceptsCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ConceptsCountOutputTypeSelect<ExtArgs> | null;
};
export type ConceptsCountOutputTypeCountChunk_conceptsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_conceptsWhereInput;
};
export type conceptsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    canonical_name?: boolean;
    slug?: boolean;
    domain?: boolean;
    category?: boolean;
    language?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
    chunk_concepts?: boolean | Prisma.concepts$chunk_conceptsArgs<ExtArgs>;
    _count?: boolean | Prisma.ConceptsCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["concepts"]>;
export type conceptsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    canonical_name?: boolean;
    slug?: boolean;
    domain?: boolean;
    category?: boolean;
    language?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["concepts"]>;
export type conceptsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    canonical_name?: boolean;
    slug?: boolean;
    domain?: boolean;
    category?: boolean;
    language?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["concepts"]>;
export type conceptsSelectScalar = {
    id?: boolean;
    name?: boolean;
    canonical_name?: boolean;
    slug?: boolean;
    domain?: boolean;
    category?: boolean;
    language?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
};
export type conceptsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "canonical_name" | "slug" | "domain" | "category" | "language" | "created_at" | "updated_at", ExtArgs["result"]["concepts"]>;
export type conceptsInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunk_concepts?: boolean | Prisma.concepts$chunk_conceptsArgs<ExtArgs>;
    _count?: boolean | Prisma.ConceptsCountOutputTypeDefaultArgs<ExtArgs>;
};
export type conceptsIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type conceptsIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $conceptsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "concepts";
    objects: {
        chunk_concepts: Prisma.$chunk_conceptsPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        canonical_name: string;
        slug: string;
        domain: string | null;
        category: string;
        language: string | null;
        created_at: Date;
        updated_at: Date;
    }, ExtArgs["result"]["concepts"]>;
    composites: {};
};
export type conceptsGetPayload<S extends boolean | null | undefined | conceptsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$conceptsPayload, S>;
export type conceptsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<conceptsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ConceptsCountAggregateInputType | true;
};
export interface conceptsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['concepts'];
        meta: {
            name: 'concepts';
        };
    };
    findUnique<T extends conceptsFindUniqueArgs>(args: Prisma.SelectSubset<T, conceptsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__conceptsClient<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends conceptsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, conceptsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__conceptsClient<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends conceptsFindFirstArgs>(args?: Prisma.SelectSubset<T, conceptsFindFirstArgs<ExtArgs>>): Prisma.Prisma__conceptsClient<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends conceptsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, conceptsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__conceptsClient<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends conceptsFindManyArgs>(args?: Prisma.SelectSubset<T, conceptsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends conceptsCreateArgs>(args: Prisma.SelectSubset<T, conceptsCreateArgs<ExtArgs>>): Prisma.Prisma__conceptsClient<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends conceptsCreateManyArgs>(args?: Prisma.SelectSubset<T, conceptsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends conceptsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, conceptsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends conceptsDeleteArgs>(args: Prisma.SelectSubset<T, conceptsDeleteArgs<ExtArgs>>): Prisma.Prisma__conceptsClient<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends conceptsUpdateArgs>(args: Prisma.SelectSubset<T, conceptsUpdateArgs<ExtArgs>>): Prisma.Prisma__conceptsClient<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends conceptsDeleteManyArgs>(args?: Prisma.SelectSubset<T, conceptsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends conceptsUpdateManyArgs>(args: Prisma.SelectSubset<T, conceptsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends conceptsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, conceptsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends conceptsUpsertArgs>(args: Prisma.SelectSubset<T, conceptsUpsertArgs<ExtArgs>>): Prisma.Prisma__conceptsClient<runtime.Types.Result.GetResult<Prisma.$conceptsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends conceptsCountArgs>(args?: Prisma.Subset<T, conceptsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ConceptsCountAggregateOutputType> : number>;
    aggregate<T extends ConceptsAggregateArgs>(args: Prisma.Subset<T, ConceptsAggregateArgs>): Prisma.PrismaPromise<GetConceptsAggregateType<T>>;
    groupBy<T extends conceptsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: conceptsGroupByArgs['orderBy'];
    } : {
        orderBy?: conceptsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, conceptsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConceptsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: conceptsFieldRefs;
}
export interface Prisma__conceptsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    chunk_concepts<T extends Prisma.concepts$chunk_conceptsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.concepts$chunk_conceptsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_conceptsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface conceptsFieldRefs {
    readonly id: Prisma.FieldRef<"concepts", 'String'>;
    readonly name: Prisma.FieldRef<"concepts", 'String'>;
    readonly canonical_name: Prisma.FieldRef<"concepts", 'String'>;
    readonly slug: Prisma.FieldRef<"concepts", 'String'>;
    readonly domain: Prisma.FieldRef<"concepts", 'String'>;
    readonly category: Prisma.FieldRef<"concepts", 'String'>;
    readonly language: Prisma.FieldRef<"concepts", 'String'>;
    readonly created_at: Prisma.FieldRef<"concepts", 'DateTime'>;
    readonly updated_at: Prisma.FieldRef<"concepts", 'DateTime'>;
}
export type conceptsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelect<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    include?: Prisma.conceptsInclude<ExtArgs> | null;
    where: Prisma.conceptsWhereUniqueInput;
};
export type conceptsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelect<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    include?: Prisma.conceptsInclude<ExtArgs> | null;
    where: Prisma.conceptsWhereUniqueInput;
};
export type conceptsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelect<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    include?: Prisma.conceptsInclude<ExtArgs> | null;
    where?: Prisma.conceptsWhereInput;
    orderBy?: Prisma.conceptsOrderByWithRelationInput | Prisma.conceptsOrderByWithRelationInput[];
    cursor?: Prisma.conceptsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ConceptsScalarFieldEnum | Prisma.ConceptsScalarFieldEnum[];
};
export type conceptsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelect<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    include?: Prisma.conceptsInclude<ExtArgs> | null;
    where?: Prisma.conceptsWhereInput;
    orderBy?: Prisma.conceptsOrderByWithRelationInput | Prisma.conceptsOrderByWithRelationInput[];
    cursor?: Prisma.conceptsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ConceptsScalarFieldEnum | Prisma.ConceptsScalarFieldEnum[];
};
export type conceptsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelect<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    include?: Prisma.conceptsInclude<ExtArgs> | null;
    where?: Prisma.conceptsWhereInput;
    orderBy?: Prisma.conceptsOrderByWithRelationInput | Prisma.conceptsOrderByWithRelationInput[];
    cursor?: Prisma.conceptsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ConceptsScalarFieldEnum | Prisma.ConceptsScalarFieldEnum[];
};
export type conceptsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelect<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    include?: Prisma.conceptsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.conceptsCreateInput, Prisma.conceptsUncheckedCreateInput>;
};
export type conceptsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.conceptsCreateManyInput | Prisma.conceptsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type conceptsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    data: Prisma.conceptsCreateManyInput | Prisma.conceptsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type conceptsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelect<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    include?: Prisma.conceptsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.conceptsUpdateInput, Prisma.conceptsUncheckedUpdateInput>;
    where: Prisma.conceptsWhereUniqueInput;
};
export type conceptsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.conceptsUpdateManyMutationInput, Prisma.conceptsUncheckedUpdateManyInput>;
    where?: Prisma.conceptsWhereInput;
    limit?: number;
};
export type conceptsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.conceptsUpdateManyMutationInput, Prisma.conceptsUncheckedUpdateManyInput>;
    where?: Prisma.conceptsWhereInput;
    limit?: number;
};
export type conceptsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelect<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    include?: Prisma.conceptsInclude<ExtArgs> | null;
    where: Prisma.conceptsWhereUniqueInput;
    create: Prisma.XOR<Prisma.conceptsCreateInput, Prisma.conceptsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.conceptsUpdateInput, Prisma.conceptsUncheckedUpdateInput>;
};
export type conceptsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelect<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    include?: Prisma.conceptsInclude<ExtArgs> | null;
    where: Prisma.conceptsWhereUniqueInput;
};
export type conceptsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.conceptsWhereInput;
    limit?: number;
};
export type concepts$chunk_conceptsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type conceptsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.conceptsSelect<ExtArgs> | null;
    omit?: Prisma.conceptsOmit<ExtArgs> | null;
    include?: Prisma.conceptsInclude<ExtArgs> | null;
};
