import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type lms_user_mappingsModel = runtime.Types.Result.DefaultSelection<Prisma.$lms_user_mappingsPayload>;
export type AggregateLms_user_mappings = {
    _count: Lms_user_mappingsCountAggregateOutputType | null;
    _min: Lms_user_mappingsMinAggregateOutputType | null;
    _max: Lms_user_mappingsMaxAggregateOutputType | null;
};
export type Lms_user_mappingsMinAggregateOutputType = {
    id: string | null;
    lms_type: $Enums.lms_type_enum | null;
    lms_user_id: string | null;
    internal_user_id: string | null;
    email: string | null;
    display_name: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type Lms_user_mappingsMaxAggregateOutputType = {
    id: string | null;
    lms_type: $Enums.lms_type_enum | null;
    lms_user_id: string | null;
    internal_user_id: string | null;
    email: string | null;
    display_name: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type Lms_user_mappingsCountAggregateOutputType = {
    id: number;
    lms_type: number;
    lms_user_id: number;
    internal_user_id: number;
    email: number;
    display_name: number;
    created_at: number;
    updated_at: number;
    _all: number;
};
export type Lms_user_mappingsMinAggregateInputType = {
    id?: true;
    lms_type?: true;
    lms_user_id?: true;
    internal_user_id?: true;
    email?: true;
    display_name?: true;
    created_at?: true;
    updated_at?: true;
};
export type Lms_user_mappingsMaxAggregateInputType = {
    id?: true;
    lms_type?: true;
    lms_user_id?: true;
    internal_user_id?: true;
    email?: true;
    display_name?: true;
    created_at?: true;
    updated_at?: true;
};
export type Lms_user_mappingsCountAggregateInputType = {
    id?: true;
    lms_type?: true;
    lms_user_id?: true;
    internal_user_id?: true;
    email?: true;
    display_name?: true;
    created_at?: true;
    updated_at?: true;
    _all?: true;
};
export type Lms_user_mappingsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lms_user_mappingsWhereInput;
    orderBy?: Prisma.lms_user_mappingsOrderByWithRelationInput | Prisma.lms_user_mappingsOrderByWithRelationInput[];
    cursor?: Prisma.lms_user_mappingsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Lms_user_mappingsCountAggregateInputType;
    _min?: Lms_user_mappingsMinAggregateInputType;
    _max?: Lms_user_mappingsMaxAggregateInputType;
};
export type GetLms_user_mappingsAggregateType<T extends Lms_user_mappingsAggregateArgs> = {
    [P in keyof T & keyof AggregateLms_user_mappings]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateLms_user_mappings[P]> : Prisma.GetScalarType<T[P], AggregateLms_user_mappings[P]>;
};
export type lms_user_mappingsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lms_user_mappingsWhereInput;
    orderBy?: Prisma.lms_user_mappingsOrderByWithAggregationInput | Prisma.lms_user_mappingsOrderByWithAggregationInput[];
    by: Prisma.Lms_user_mappingsScalarFieldEnum[] | Prisma.Lms_user_mappingsScalarFieldEnum;
    having?: Prisma.lms_user_mappingsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Lms_user_mappingsCountAggregateInputType | true;
    _min?: Lms_user_mappingsMinAggregateInputType;
    _max?: Lms_user_mappingsMaxAggregateInputType;
};
export type Lms_user_mappingsGroupByOutputType = {
    id: string;
    lms_type: $Enums.lms_type_enum;
    lms_user_id: string;
    internal_user_id: string;
    email: string | null;
    display_name: string | null;
    created_at: Date;
    updated_at: Date;
    _count: Lms_user_mappingsCountAggregateOutputType | null;
    _min: Lms_user_mappingsMinAggregateOutputType | null;
    _max: Lms_user_mappingsMaxAggregateOutputType | null;
};
export type GetLms_user_mappingsGroupByPayload<T extends lms_user_mappingsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Lms_user_mappingsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Lms_user_mappingsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Lms_user_mappingsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Lms_user_mappingsGroupByOutputType[P]>;
}>>;
export type lms_user_mappingsWhereInput = {
    AND?: Prisma.lms_user_mappingsWhereInput | Prisma.lms_user_mappingsWhereInput[];
    OR?: Prisma.lms_user_mappingsWhereInput[];
    NOT?: Prisma.lms_user_mappingsWhereInput | Prisma.lms_user_mappingsWhereInput[];
    id?: Prisma.UuidFilter<"lms_user_mappings"> | string;
    lms_type?: Prisma.Enumlms_type_enumFilter<"lms_user_mappings"> | $Enums.lms_type_enum;
    lms_user_id?: Prisma.StringFilter<"lms_user_mappings"> | string;
    internal_user_id?: Prisma.UuidFilter<"lms_user_mappings"> | string;
    email?: Prisma.StringNullableFilter<"lms_user_mappings"> | string | null;
    display_name?: Prisma.StringNullableFilter<"lms_user_mappings"> | string | null;
    created_at?: Prisma.DateTimeFilter<"lms_user_mappings"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"lms_user_mappings"> | Date | string;
};
export type lms_user_mappingsOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    lms_type?: Prisma.SortOrder;
    lms_user_id?: Prisma.SortOrder;
    internal_user_id?: Prisma.SortOrder;
    email?: Prisma.SortOrderInput | Prisma.SortOrder;
    display_name?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type lms_user_mappingsWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    lms_type_lms_user_id?: Prisma.lms_user_mappingsLms_typeLms_user_idCompoundUniqueInput;
    AND?: Prisma.lms_user_mappingsWhereInput | Prisma.lms_user_mappingsWhereInput[];
    OR?: Prisma.lms_user_mappingsWhereInput[];
    NOT?: Prisma.lms_user_mappingsWhereInput | Prisma.lms_user_mappingsWhereInput[];
    lms_type?: Prisma.Enumlms_type_enumFilter<"lms_user_mappings"> | $Enums.lms_type_enum;
    lms_user_id?: Prisma.StringFilter<"lms_user_mappings"> | string;
    internal_user_id?: Prisma.UuidFilter<"lms_user_mappings"> | string;
    email?: Prisma.StringNullableFilter<"lms_user_mappings"> | string | null;
    display_name?: Prisma.StringNullableFilter<"lms_user_mappings"> | string | null;
    created_at?: Prisma.DateTimeFilter<"lms_user_mappings"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"lms_user_mappings"> | Date | string;
}, "id" | "lms_type_lms_user_id">;
export type lms_user_mappingsOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    lms_type?: Prisma.SortOrder;
    lms_user_id?: Prisma.SortOrder;
    internal_user_id?: Prisma.SortOrder;
    email?: Prisma.SortOrderInput | Prisma.SortOrder;
    display_name?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    _count?: Prisma.lms_user_mappingsCountOrderByAggregateInput;
    _max?: Prisma.lms_user_mappingsMaxOrderByAggregateInput;
    _min?: Prisma.lms_user_mappingsMinOrderByAggregateInput;
};
export type lms_user_mappingsScalarWhereWithAggregatesInput = {
    AND?: Prisma.lms_user_mappingsScalarWhereWithAggregatesInput | Prisma.lms_user_mappingsScalarWhereWithAggregatesInput[];
    OR?: Prisma.lms_user_mappingsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.lms_user_mappingsScalarWhereWithAggregatesInput | Prisma.lms_user_mappingsScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"lms_user_mappings"> | string;
    lms_type?: Prisma.Enumlms_type_enumWithAggregatesFilter<"lms_user_mappings"> | $Enums.lms_type_enum;
    lms_user_id?: Prisma.StringWithAggregatesFilter<"lms_user_mappings"> | string;
    internal_user_id?: Prisma.UuidWithAggregatesFilter<"lms_user_mappings"> | string;
    email?: Prisma.StringNullableWithAggregatesFilter<"lms_user_mappings"> | string | null;
    display_name?: Prisma.StringNullableWithAggregatesFilter<"lms_user_mappings"> | string | null;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"lms_user_mappings"> | Date | string;
    updated_at?: Prisma.DateTimeWithAggregatesFilter<"lms_user_mappings"> | Date | string;
};
export type lms_user_mappingsCreateInput = {
    id?: string;
    lms_type: $Enums.lms_type_enum;
    lms_user_id: string;
    internal_user_id?: string;
    email?: string | null;
    display_name?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type lms_user_mappingsUncheckedCreateInput = {
    id?: string;
    lms_type: $Enums.lms_type_enum;
    lms_user_id: string;
    internal_user_id?: string;
    email?: string | null;
    display_name?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type lms_user_mappingsUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_user_id?: Prisma.StringFieldUpdateOperationsInput | string;
    internal_user_id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    display_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lms_user_mappingsUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_user_id?: Prisma.StringFieldUpdateOperationsInput | string;
    internal_user_id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    display_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lms_user_mappingsCreateManyInput = {
    id?: string;
    lms_type: $Enums.lms_type_enum;
    lms_user_id: string;
    internal_user_id?: string;
    email?: string | null;
    display_name?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type lms_user_mappingsUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_user_id?: Prisma.StringFieldUpdateOperationsInput | string;
    internal_user_id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    display_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lms_user_mappingsUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    lms_type?: Prisma.Enumlms_type_enumFieldUpdateOperationsInput | $Enums.lms_type_enum;
    lms_user_id?: Prisma.StringFieldUpdateOperationsInput | string;
    internal_user_id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    display_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type lms_user_mappingsLms_typeLms_user_idCompoundUniqueInput = {
    lms_type: $Enums.lms_type_enum;
    lms_user_id: string;
};
export type lms_user_mappingsCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    lms_type?: Prisma.SortOrder;
    lms_user_id?: Prisma.SortOrder;
    internal_user_id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    display_name?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type lms_user_mappingsMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    lms_type?: Prisma.SortOrder;
    lms_user_id?: Prisma.SortOrder;
    internal_user_id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    display_name?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type lms_user_mappingsMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    lms_type?: Prisma.SortOrder;
    lms_user_id?: Prisma.SortOrder;
    internal_user_id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    display_name?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type lms_user_mappingsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    lms_type?: boolean;
    lms_user_id?: boolean;
    internal_user_id?: boolean;
    email?: boolean;
    display_name?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["lms_user_mappings"]>;
export type lms_user_mappingsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    lms_type?: boolean;
    lms_user_id?: boolean;
    internal_user_id?: boolean;
    email?: boolean;
    display_name?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["lms_user_mappings"]>;
export type lms_user_mappingsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    lms_type?: boolean;
    lms_user_id?: boolean;
    internal_user_id?: boolean;
    email?: boolean;
    display_name?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["lms_user_mappings"]>;
export type lms_user_mappingsSelectScalar = {
    id?: boolean;
    lms_type?: boolean;
    lms_user_id?: boolean;
    internal_user_id?: boolean;
    email?: boolean;
    display_name?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
};
export type lms_user_mappingsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "lms_type" | "lms_user_id" | "internal_user_id" | "email" | "display_name" | "created_at" | "updated_at", ExtArgs["result"]["lms_user_mappings"]>;
export type $lms_user_mappingsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "lms_user_mappings";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        lms_type: $Enums.lms_type_enum;
        lms_user_id: string;
        internal_user_id: string;
        email: string | null;
        display_name: string | null;
        created_at: Date;
        updated_at: Date;
    }, ExtArgs["result"]["lms_user_mappings"]>;
    composites: {};
};
export type lms_user_mappingsGetPayload<S extends boolean | null | undefined | lms_user_mappingsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload, S>;
export type lms_user_mappingsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<lms_user_mappingsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Lms_user_mappingsCountAggregateInputType | true;
};
export interface lms_user_mappingsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['lms_user_mappings'];
        meta: {
            name: 'lms_user_mappings';
        };
    };
    findUnique<T extends lms_user_mappingsFindUniqueArgs>(args: Prisma.SelectSubset<T, lms_user_mappingsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__lms_user_mappingsClient<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends lms_user_mappingsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, lms_user_mappingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__lms_user_mappingsClient<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends lms_user_mappingsFindFirstArgs>(args?: Prisma.SelectSubset<T, lms_user_mappingsFindFirstArgs<ExtArgs>>): Prisma.Prisma__lms_user_mappingsClient<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends lms_user_mappingsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, lms_user_mappingsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__lms_user_mappingsClient<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends lms_user_mappingsFindManyArgs>(args?: Prisma.SelectSubset<T, lms_user_mappingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends lms_user_mappingsCreateArgs>(args: Prisma.SelectSubset<T, lms_user_mappingsCreateArgs<ExtArgs>>): Prisma.Prisma__lms_user_mappingsClient<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends lms_user_mappingsCreateManyArgs>(args?: Prisma.SelectSubset<T, lms_user_mappingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends lms_user_mappingsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, lms_user_mappingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends lms_user_mappingsDeleteArgs>(args: Prisma.SelectSubset<T, lms_user_mappingsDeleteArgs<ExtArgs>>): Prisma.Prisma__lms_user_mappingsClient<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends lms_user_mappingsUpdateArgs>(args: Prisma.SelectSubset<T, lms_user_mappingsUpdateArgs<ExtArgs>>): Prisma.Prisma__lms_user_mappingsClient<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends lms_user_mappingsDeleteManyArgs>(args?: Prisma.SelectSubset<T, lms_user_mappingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends lms_user_mappingsUpdateManyArgs>(args: Prisma.SelectSubset<T, lms_user_mappingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends lms_user_mappingsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, lms_user_mappingsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends lms_user_mappingsUpsertArgs>(args: Prisma.SelectSubset<T, lms_user_mappingsUpsertArgs<ExtArgs>>): Prisma.Prisma__lms_user_mappingsClient<runtime.Types.Result.GetResult<Prisma.$lms_user_mappingsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends lms_user_mappingsCountArgs>(args?: Prisma.Subset<T, lms_user_mappingsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Lms_user_mappingsCountAggregateOutputType> : number>;
    aggregate<T extends Lms_user_mappingsAggregateArgs>(args: Prisma.Subset<T, Lms_user_mappingsAggregateArgs>): Prisma.PrismaPromise<GetLms_user_mappingsAggregateType<T>>;
    groupBy<T extends lms_user_mappingsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: lms_user_mappingsGroupByArgs['orderBy'];
    } : {
        orderBy?: lms_user_mappingsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, lms_user_mappingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLms_user_mappingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: lms_user_mappingsFieldRefs;
}
export interface Prisma__lms_user_mappingsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface lms_user_mappingsFieldRefs {
    readonly id: Prisma.FieldRef<"lms_user_mappings", 'String'>;
    readonly lms_type: Prisma.FieldRef<"lms_user_mappings", 'lms_type_enum'>;
    readonly lms_user_id: Prisma.FieldRef<"lms_user_mappings", 'String'>;
    readonly internal_user_id: Prisma.FieldRef<"lms_user_mappings", 'String'>;
    readonly email: Prisma.FieldRef<"lms_user_mappings", 'String'>;
    readonly display_name: Prisma.FieldRef<"lms_user_mappings", 'String'>;
    readonly created_at: Prisma.FieldRef<"lms_user_mappings", 'DateTime'>;
    readonly updated_at: Prisma.FieldRef<"lms_user_mappings", 'DateTime'>;
}
export type lms_user_mappingsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    where: Prisma.lms_user_mappingsWhereUniqueInput;
};
export type lms_user_mappingsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    where: Prisma.lms_user_mappingsWhereUniqueInput;
};
export type lms_user_mappingsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    where?: Prisma.lms_user_mappingsWhereInput;
    orderBy?: Prisma.lms_user_mappingsOrderByWithRelationInput | Prisma.lms_user_mappingsOrderByWithRelationInput[];
    cursor?: Prisma.lms_user_mappingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Lms_user_mappingsScalarFieldEnum | Prisma.Lms_user_mappingsScalarFieldEnum[];
};
export type lms_user_mappingsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    where?: Prisma.lms_user_mappingsWhereInput;
    orderBy?: Prisma.lms_user_mappingsOrderByWithRelationInput | Prisma.lms_user_mappingsOrderByWithRelationInput[];
    cursor?: Prisma.lms_user_mappingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Lms_user_mappingsScalarFieldEnum | Prisma.Lms_user_mappingsScalarFieldEnum[];
};
export type lms_user_mappingsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    where?: Prisma.lms_user_mappingsWhereInput;
    orderBy?: Prisma.lms_user_mappingsOrderByWithRelationInput | Prisma.lms_user_mappingsOrderByWithRelationInput[];
    cursor?: Prisma.lms_user_mappingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Lms_user_mappingsScalarFieldEnum | Prisma.Lms_user_mappingsScalarFieldEnum[];
};
export type lms_user_mappingsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lms_user_mappingsCreateInput, Prisma.lms_user_mappingsUncheckedCreateInput>;
};
export type lms_user_mappingsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.lms_user_mappingsCreateManyInput | Prisma.lms_user_mappingsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type lms_user_mappingsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    data: Prisma.lms_user_mappingsCreateManyInput | Prisma.lms_user_mappingsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type lms_user_mappingsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lms_user_mappingsUpdateInput, Prisma.lms_user_mappingsUncheckedUpdateInput>;
    where: Prisma.lms_user_mappingsWhereUniqueInput;
};
export type lms_user_mappingsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.lms_user_mappingsUpdateManyMutationInput, Prisma.lms_user_mappingsUncheckedUpdateManyInput>;
    where?: Prisma.lms_user_mappingsWhereInput;
    limit?: number;
};
export type lms_user_mappingsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.lms_user_mappingsUpdateManyMutationInput, Prisma.lms_user_mappingsUncheckedUpdateManyInput>;
    where?: Prisma.lms_user_mappingsWhereInput;
    limit?: number;
};
export type lms_user_mappingsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    where: Prisma.lms_user_mappingsWhereUniqueInput;
    create: Prisma.XOR<Prisma.lms_user_mappingsCreateInput, Prisma.lms_user_mappingsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.lms_user_mappingsUpdateInput, Prisma.lms_user_mappingsUncheckedUpdateInput>;
};
export type lms_user_mappingsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
    where: Prisma.lms_user_mappingsWhereUniqueInput;
};
export type lms_user_mappingsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.lms_user_mappingsWhereInput;
    limit?: number;
};
export type lms_user_mappingsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.lms_user_mappingsSelect<ExtArgs> | null;
    omit?: Prisma.lms_user_mappingsOmit<ExtArgs> | null;
};
