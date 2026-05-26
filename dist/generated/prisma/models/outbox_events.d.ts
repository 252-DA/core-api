import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type outbox_eventsModel = runtime.Types.Result.DefaultSelection<Prisma.$outbox_eventsPayload>;
export type AggregateOutbox_events = {
    _count: Outbox_eventsCountAggregateOutputType | null;
    _avg: Outbox_eventsAvgAggregateOutputType | null;
    _sum: Outbox_eventsSumAggregateOutputType | null;
    _min: Outbox_eventsMinAggregateOutputType | null;
    _max: Outbox_eventsMaxAggregateOutputType | null;
};
export type Outbox_eventsAvgAggregateOutputType = {
    attempts: number | null;
};
export type Outbox_eventsSumAggregateOutputType = {
    attempts: number | null;
};
export type Outbox_eventsMinAggregateOutputType = {
    id: string | null;
    event_type: string | null;
    aggregate_id: string | null;
    status: string | null;
    attempts: number | null;
    error_msg: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type Outbox_eventsMaxAggregateOutputType = {
    id: string | null;
    event_type: string | null;
    aggregate_id: string | null;
    status: string | null;
    attempts: number | null;
    error_msg: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type Outbox_eventsCountAggregateOutputType = {
    id: number;
    event_type: number;
    aggregate_id: number;
    payload_json: number;
    status: number;
    attempts: number;
    error_msg: number;
    created_at: number;
    updated_at: number;
    _all: number;
};
export type Outbox_eventsAvgAggregateInputType = {
    attempts?: true;
};
export type Outbox_eventsSumAggregateInputType = {
    attempts?: true;
};
export type Outbox_eventsMinAggregateInputType = {
    id?: true;
    event_type?: true;
    aggregate_id?: true;
    status?: true;
    attempts?: true;
    error_msg?: true;
    created_at?: true;
    updated_at?: true;
};
export type Outbox_eventsMaxAggregateInputType = {
    id?: true;
    event_type?: true;
    aggregate_id?: true;
    status?: true;
    attempts?: true;
    error_msg?: true;
    created_at?: true;
    updated_at?: true;
};
export type Outbox_eventsCountAggregateInputType = {
    id?: true;
    event_type?: true;
    aggregate_id?: true;
    payload_json?: true;
    status?: true;
    attempts?: true;
    error_msg?: true;
    created_at?: true;
    updated_at?: true;
    _all?: true;
};
export type Outbox_eventsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.outbox_eventsWhereInput;
    orderBy?: Prisma.outbox_eventsOrderByWithRelationInput | Prisma.outbox_eventsOrderByWithRelationInput[];
    cursor?: Prisma.outbox_eventsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Outbox_eventsCountAggregateInputType;
    _avg?: Outbox_eventsAvgAggregateInputType;
    _sum?: Outbox_eventsSumAggregateInputType;
    _min?: Outbox_eventsMinAggregateInputType;
    _max?: Outbox_eventsMaxAggregateInputType;
};
export type GetOutbox_eventsAggregateType<T extends Outbox_eventsAggregateArgs> = {
    [P in keyof T & keyof AggregateOutbox_events]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateOutbox_events[P]> : Prisma.GetScalarType<T[P], AggregateOutbox_events[P]>;
};
export type outbox_eventsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.outbox_eventsWhereInput;
    orderBy?: Prisma.outbox_eventsOrderByWithAggregationInput | Prisma.outbox_eventsOrderByWithAggregationInput[];
    by: Prisma.Outbox_eventsScalarFieldEnum[] | Prisma.Outbox_eventsScalarFieldEnum;
    having?: Prisma.outbox_eventsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Outbox_eventsCountAggregateInputType | true;
    _avg?: Outbox_eventsAvgAggregateInputType;
    _sum?: Outbox_eventsSumAggregateInputType;
    _min?: Outbox_eventsMinAggregateInputType;
    _max?: Outbox_eventsMaxAggregateInputType;
};
export type Outbox_eventsGroupByOutputType = {
    id: string;
    event_type: string;
    aggregate_id: string;
    payload_json: runtime.JsonValue;
    status: string;
    attempts: number;
    error_msg: string | null;
    created_at: Date;
    updated_at: Date;
    _count: Outbox_eventsCountAggregateOutputType | null;
    _avg: Outbox_eventsAvgAggregateOutputType | null;
    _sum: Outbox_eventsSumAggregateOutputType | null;
    _min: Outbox_eventsMinAggregateOutputType | null;
    _max: Outbox_eventsMaxAggregateOutputType | null;
};
export type GetOutbox_eventsGroupByPayload<T extends outbox_eventsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Outbox_eventsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Outbox_eventsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Outbox_eventsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Outbox_eventsGroupByOutputType[P]>;
}>>;
export type outbox_eventsWhereInput = {
    AND?: Prisma.outbox_eventsWhereInput | Prisma.outbox_eventsWhereInput[];
    OR?: Prisma.outbox_eventsWhereInput[];
    NOT?: Prisma.outbox_eventsWhereInput | Prisma.outbox_eventsWhereInput[];
    id?: Prisma.UuidFilter<"outbox_events"> | string;
    event_type?: Prisma.StringFilter<"outbox_events"> | string;
    aggregate_id?: Prisma.StringFilter<"outbox_events"> | string;
    payload_json?: Prisma.JsonFilter<"outbox_events">;
    status?: Prisma.StringFilter<"outbox_events"> | string;
    attempts?: Prisma.IntFilter<"outbox_events"> | number;
    error_msg?: Prisma.StringNullableFilter<"outbox_events"> | string | null;
    created_at?: Prisma.DateTimeFilter<"outbox_events"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"outbox_events"> | Date | string;
};
export type outbox_eventsOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    event_type?: Prisma.SortOrder;
    aggregate_id?: Prisma.SortOrder;
    payload_json?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    attempts?: Prisma.SortOrder;
    error_msg?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type outbox_eventsWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.outbox_eventsWhereInput | Prisma.outbox_eventsWhereInput[];
    OR?: Prisma.outbox_eventsWhereInput[];
    NOT?: Prisma.outbox_eventsWhereInput | Prisma.outbox_eventsWhereInput[];
    event_type?: Prisma.StringFilter<"outbox_events"> | string;
    aggregate_id?: Prisma.StringFilter<"outbox_events"> | string;
    payload_json?: Prisma.JsonFilter<"outbox_events">;
    status?: Prisma.StringFilter<"outbox_events"> | string;
    attempts?: Prisma.IntFilter<"outbox_events"> | number;
    error_msg?: Prisma.StringNullableFilter<"outbox_events"> | string | null;
    created_at?: Prisma.DateTimeFilter<"outbox_events"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"outbox_events"> | Date | string;
}, "id">;
export type outbox_eventsOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    event_type?: Prisma.SortOrder;
    aggregate_id?: Prisma.SortOrder;
    payload_json?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    attempts?: Prisma.SortOrder;
    error_msg?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    _count?: Prisma.outbox_eventsCountOrderByAggregateInput;
    _avg?: Prisma.outbox_eventsAvgOrderByAggregateInput;
    _max?: Prisma.outbox_eventsMaxOrderByAggregateInput;
    _min?: Prisma.outbox_eventsMinOrderByAggregateInput;
    _sum?: Prisma.outbox_eventsSumOrderByAggregateInput;
};
export type outbox_eventsScalarWhereWithAggregatesInput = {
    AND?: Prisma.outbox_eventsScalarWhereWithAggregatesInput | Prisma.outbox_eventsScalarWhereWithAggregatesInput[];
    OR?: Prisma.outbox_eventsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.outbox_eventsScalarWhereWithAggregatesInput | Prisma.outbox_eventsScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"outbox_events"> | string;
    event_type?: Prisma.StringWithAggregatesFilter<"outbox_events"> | string;
    aggregate_id?: Prisma.StringWithAggregatesFilter<"outbox_events"> | string;
    payload_json?: Prisma.JsonWithAggregatesFilter<"outbox_events">;
    status?: Prisma.StringWithAggregatesFilter<"outbox_events"> | string;
    attempts?: Prisma.IntWithAggregatesFilter<"outbox_events"> | number;
    error_msg?: Prisma.StringNullableWithAggregatesFilter<"outbox_events"> | string | null;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"outbox_events"> | Date | string;
    updated_at?: Prisma.DateTimeWithAggregatesFilter<"outbox_events"> | Date | string;
};
export type outbox_eventsCreateInput = {
    id: string;
    event_type: string;
    aggregate_id: string;
    payload_json: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: string;
    attempts?: number;
    error_msg?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type outbox_eventsUncheckedCreateInput = {
    id: string;
    event_type: string;
    aggregate_id: string;
    payload_json: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: string;
    attempts?: number;
    error_msg?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type outbox_eventsUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    event_type?: Prisma.StringFieldUpdateOperationsInput | string;
    aggregate_id?: Prisma.StringFieldUpdateOperationsInput | string;
    payload_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    attempts?: Prisma.IntFieldUpdateOperationsInput | number;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type outbox_eventsUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    event_type?: Prisma.StringFieldUpdateOperationsInput | string;
    aggregate_id?: Prisma.StringFieldUpdateOperationsInput | string;
    payload_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    attempts?: Prisma.IntFieldUpdateOperationsInput | number;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type outbox_eventsCreateManyInput = {
    id: string;
    event_type: string;
    aggregate_id: string;
    payload_json: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: string;
    attempts?: number;
    error_msg?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type outbox_eventsUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    event_type?: Prisma.StringFieldUpdateOperationsInput | string;
    aggregate_id?: Prisma.StringFieldUpdateOperationsInput | string;
    payload_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    attempts?: Prisma.IntFieldUpdateOperationsInput | number;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type outbox_eventsUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    event_type?: Prisma.StringFieldUpdateOperationsInput | string;
    aggregate_id?: Prisma.StringFieldUpdateOperationsInput | string;
    payload_json?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    attempts?: Prisma.IntFieldUpdateOperationsInput | number;
    error_msg?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type outbox_eventsCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    event_type?: Prisma.SortOrder;
    aggregate_id?: Prisma.SortOrder;
    payload_json?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    attempts?: Prisma.SortOrder;
    error_msg?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type outbox_eventsAvgOrderByAggregateInput = {
    attempts?: Prisma.SortOrder;
};
export type outbox_eventsMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    event_type?: Prisma.SortOrder;
    aggregate_id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    attempts?: Prisma.SortOrder;
    error_msg?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type outbox_eventsMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    event_type?: Prisma.SortOrder;
    aggregate_id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    attempts?: Prisma.SortOrder;
    error_msg?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type outbox_eventsSumOrderByAggregateInput = {
    attempts?: Prisma.SortOrder;
};
export type outbox_eventsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    event_type?: boolean;
    aggregate_id?: boolean;
    payload_json?: boolean;
    status?: boolean;
    attempts?: boolean;
    error_msg?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["outbox_events"]>;
export type outbox_eventsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    event_type?: boolean;
    aggregate_id?: boolean;
    payload_json?: boolean;
    status?: boolean;
    attempts?: boolean;
    error_msg?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["outbox_events"]>;
export type outbox_eventsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    event_type?: boolean;
    aggregate_id?: boolean;
    payload_json?: boolean;
    status?: boolean;
    attempts?: boolean;
    error_msg?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
}, ExtArgs["result"]["outbox_events"]>;
export type outbox_eventsSelectScalar = {
    id?: boolean;
    event_type?: boolean;
    aggregate_id?: boolean;
    payload_json?: boolean;
    status?: boolean;
    attempts?: boolean;
    error_msg?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
};
export type outbox_eventsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "event_type" | "aggregate_id" | "payload_json" | "status" | "attempts" | "error_msg" | "created_at" | "updated_at", ExtArgs["result"]["outbox_events"]>;
export type $outbox_eventsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "outbox_events";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        event_type: string;
        aggregate_id: string;
        payload_json: runtime.JsonValue;
        status: string;
        attempts: number;
        error_msg: string | null;
        created_at: Date;
        updated_at: Date;
    }, ExtArgs["result"]["outbox_events"]>;
    composites: {};
};
export type outbox_eventsGetPayload<S extends boolean | null | undefined | outbox_eventsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload, S>;
export type outbox_eventsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<outbox_eventsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Outbox_eventsCountAggregateInputType | true;
};
export interface outbox_eventsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['outbox_events'];
        meta: {
            name: 'outbox_events';
        };
    };
    findUnique<T extends outbox_eventsFindUniqueArgs>(args: Prisma.SelectSubset<T, outbox_eventsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__outbox_eventsClient<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends outbox_eventsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, outbox_eventsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__outbox_eventsClient<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends outbox_eventsFindFirstArgs>(args?: Prisma.SelectSubset<T, outbox_eventsFindFirstArgs<ExtArgs>>): Prisma.Prisma__outbox_eventsClient<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends outbox_eventsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, outbox_eventsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__outbox_eventsClient<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends outbox_eventsFindManyArgs>(args?: Prisma.SelectSubset<T, outbox_eventsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends outbox_eventsCreateArgs>(args: Prisma.SelectSubset<T, outbox_eventsCreateArgs<ExtArgs>>): Prisma.Prisma__outbox_eventsClient<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends outbox_eventsCreateManyArgs>(args?: Prisma.SelectSubset<T, outbox_eventsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends outbox_eventsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, outbox_eventsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends outbox_eventsDeleteArgs>(args: Prisma.SelectSubset<T, outbox_eventsDeleteArgs<ExtArgs>>): Prisma.Prisma__outbox_eventsClient<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends outbox_eventsUpdateArgs>(args: Prisma.SelectSubset<T, outbox_eventsUpdateArgs<ExtArgs>>): Prisma.Prisma__outbox_eventsClient<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends outbox_eventsDeleteManyArgs>(args?: Prisma.SelectSubset<T, outbox_eventsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends outbox_eventsUpdateManyArgs>(args: Prisma.SelectSubset<T, outbox_eventsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends outbox_eventsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, outbox_eventsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends outbox_eventsUpsertArgs>(args: Prisma.SelectSubset<T, outbox_eventsUpsertArgs<ExtArgs>>): Prisma.Prisma__outbox_eventsClient<runtime.Types.Result.GetResult<Prisma.$outbox_eventsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends outbox_eventsCountArgs>(args?: Prisma.Subset<T, outbox_eventsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Outbox_eventsCountAggregateOutputType> : number>;
    aggregate<T extends Outbox_eventsAggregateArgs>(args: Prisma.Subset<T, Outbox_eventsAggregateArgs>): Prisma.PrismaPromise<GetOutbox_eventsAggregateType<T>>;
    groupBy<T extends outbox_eventsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: outbox_eventsGroupByArgs['orderBy'];
    } : {
        orderBy?: outbox_eventsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, outbox_eventsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOutbox_eventsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: outbox_eventsFieldRefs;
}
export interface Prisma__outbox_eventsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface outbox_eventsFieldRefs {
    readonly id: Prisma.FieldRef<"outbox_events", 'String'>;
    readonly event_type: Prisma.FieldRef<"outbox_events", 'String'>;
    readonly aggregate_id: Prisma.FieldRef<"outbox_events", 'String'>;
    readonly payload_json: Prisma.FieldRef<"outbox_events", 'Json'>;
    readonly status: Prisma.FieldRef<"outbox_events", 'String'>;
    readonly attempts: Prisma.FieldRef<"outbox_events", 'Int'>;
    readonly error_msg: Prisma.FieldRef<"outbox_events", 'String'>;
    readonly created_at: Prisma.FieldRef<"outbox_events", 'DateTime'>;
    readonly updated_at: Prisma.FieldRef<"outbox_events", 'DateTime'>;
}
export type outbox_eventsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelect<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    where: Prisma.outbox_eventsWhereUniqueInput;
};
export type outbox_eventsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelect<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    where: Prisma.outbox_eventsWhereUniqueInput;
};
export type outbox_eventsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelect<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    where?: Prisma.outbox_eventsWhereInput;
    orderBy?: Prisma.outbox_eventsOrderByWithRelationInput | Prisma.outbox_eventsOrderByWithRelationInput[];
    cursor?: Prisma.outbox_eventsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Outbox_eventsScalarFieldEnum | Prisma.Outbox_eventsScalarFieldEnum[];
};
export type outbox_eventsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelect<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    where?: Prisma.outbox_eventsWhereInput;
    orderBy?: Prisma.outbox_eventsOrderByWithRelationInput | Prisma.outbox_eventsOrderByWithRelationInput[];
    cursor?: Prisma.outbox_eventsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Outbox_eventsScalarFieldEnum | Prisma.Outbox_eventsScalarFieldEnum[];
};
export type outbox_eventsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelect<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    where?: Prisma.outbox_eventsWhereInput;
    orderBy?: Prisma.outbox_eventsOrderByWithRelationInput | Prisma.outbox_eventsOrderByWithRelationInput[];
    cursor?: Prisma.outbox_eventsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Outbox_eventsScalarFieldEnum | Prisma.Outbox_eventsScalarFieldEnum[];
};
export type outbox_eventsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelect<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.outbox_eventsCreateInput, Prisma.outbox_eventsUncheckedCreateInput>;
};
export type outbox_eventsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.outbox_eventsCreateManyInput | Prisma.outbox_eventsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type outbox_eventsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    data: Prisma.outbox_eventsCreateManyInput | Prisma.outbox_eventsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type outbox_eventsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelect<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.outbox_eventsUpdateInput, Prisma.outbox_eventsUncheckedUpdateInput>;
    where: Prisma.outbox_eventsWhereUniqueInput;
};
export type outbox_eventsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.outbox_eventsUpdateManyMutationInput, Prisma.outbox_eventsUncheckedUpdateManyInput>;
    where?: Prisma.outbox_eventsWhereInput;
    limit?: number;
};
export type outbox_eventsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.outbox_eventsUpdateManyMutationInput, Prisma.outbox_eventsUncheckedUpdateManyInput>;
    where?: Prisma.outbox_eventsWhereInput;
    limit?: number;
};
export type outbox_eventsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelect<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    where: Prisma.outbox_eventsWhereUniqueInput;
    create: Prisma.XOR<Prisma.outbox_eventsCreateInput, Prisma.outbox_eventsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.outbox_eventsUpdateInput, Prisma.outbox_eventsUncheckedUpdateInput>;
};
export type outbox_eventsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelect<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
    where: Prisma.outbox_eventsWhereUniqueInput;
};
export type outbox_eventsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.outbox_eventsWhereInput;
    limit?: number;
};
export type outbox_eventsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.outbox_eventsSelect<ExtArgs> | null;
    omit?: Prisma.outbox_eventsOmit<ExtArgs> | null;
};
