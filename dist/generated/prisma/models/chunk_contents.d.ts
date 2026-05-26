import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type chunk_contentsModel = runtime.Types.Result.DefaultSelection<Prisma.$chunk_contentsPayload>;
export type AggregateChunk_contents = {
    _count: Chunk_contentsCountAggregateOutputType | null;
    _min: Chunk_contentsMinAggregateOutputType | null;
    _max: Chunk_contentsMaxAggregateOutputType | null;
};
export type Chunk_contentsMinAggregateOutputType = {
    chunk_id: string | null;
    document_id: string | null;
    content_text: string | null;
    embedding_input: string | null;
    updated_at: Date | null;
};
export type Chunk_contentsMaxAggregateOutputType = {
    chunk_id: string | null;
    document_id: string | null;
    content_text: string | null;
    embedding_input: string | null;
    updated_at: Date | null;
};
export type Chunk_contentsCountAggregateOutputType = {
    chunk_id: number;
    document_id: number;
    content_text: number;
    embedding_input: number;
    updated_at: number;
    _all: number;
};
export type Chunk_contentsMinAggregateInputType = {
    chunk_id?: true;
    document_id?: true;
    content_text?: true;
    embedding_input?: true;
    updated_at?: true;
};
export type Chunk_contentsMaxAggregateInputType = {
    chunk_id?: true;
    document_id?: true;
    content_text?: true;
    embedding_input?: true;
    updated_at?: true;
};
export type Chunk_contentsCountAggregateInputType = {
    chunk_id?: true;
    document_id?: true;
    content_text?: true;
    embedding_input?: true;
    updated_at?: true;
    _all?: true;
};
export type Chunk_contentsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_contentsWhereInput;
    orderBy?: Prisma.chunk_contentsOrderByWithRelationInput | Prisma.chunk_contentsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_contentsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Chunk_contentsCountAggregateInputType;
    _min?: Chunk_contentsMinAggregateInputType;
    _max?: Chunk_contentsMaxAggregateInputType;
};
export type GetChunk_contentsAggregateType<T extends Chunk_contentsAggregateArgs> = {
    [P in keyof T & keyof AggregateChunk_contents]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateChunk_contents[P]> : Prisma.GetScalarType<T[P], AggregateChunk_contents[P]>;
};
export type chunk_contentsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_contentsWhereInput;
    orderBy?: Prisma.chunk_contentsOrderByWithAggregationInput | Prisma.chunk_contentsOrderByWithAggregationInput[];
    by: Prisma.Chunk_contentsScalarFieldEnum[] | Prisma.Chunk_contentsScalarFieldEnum;
    having?: Prisma.chunk_contentsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Chunk_contentsCountAggregateInputType | true;
    _min?: Chunk_contentsMinAggregateInputType;
    _max?: Chunk_contentsMaxAggregateInputType;
};
export type Chunk_contentsGroupByOutputType = {
    chunk_id: string;
    document_id: string;
    content_text: string;
    embedding_input: string | null;
    updated_at: Date;
    _count: Chunk_contentsCountAggregateOutputType | null;
    _min: Chunk_contentsMinAggregateOutputType | null;
    _max: Chunk_contentsMaxAggregateOutputType | null;
};
export type GetChunk_contentsGroupByPayload<T extends chunk_contentsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Chunk_contentsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Chunk_contentsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Chunk_contentsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Chunk_contentsGroupByOutputType[P]>;
}>>;
export type chunk_contentsWhereInput = {
    AND?: Prisma.chunk_contentsWhereInput | Prisma.chunk_contentsWhereInput[];
    OR?: Prisma.chunk_contentsWhereInput[];
    NOT?: Prisma.chunk_contentsWhereInput | Prisma.chunk_contentsWhereInput[];
    chunk_id?: Prisma.StringFilter<"chunk_contents"> | string;
    document_id?: Prisma.StringFilter<"chunk_contents"> | string;
    content_text?: Prisma.StringFilter<"chunk_contents"> | string;
    embedding_input?: Prisma.StringNullableFilter<"chunk_contents"> | string | null;
    updated_at?: Prisma.DateTimeFilter<"chunk_contents"> | Date | string;
    chunks_metadata?: Prisma.XOR<Prisma.Chunks_metadataScalarRelationFilter, Prisma.chunks_metadataWhereInput>;
};
export type chunk_contentsOrderByWithRelationInput = {
    chunk_id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    content_text?: Prisma.SortOrder;
    embedding_input?: Prisma.SortOrderInput | Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    chunks_metadata?: Prisma.chunks_metadataOrderByWithRelationInput;
};
export type chunk_contentsWhereUniqueInput = Prisma.AtLeast<{
    chunk_id?: string;
    AND?: Prisma.chunk_contentsWhereInput | Prisma.chunk_contentsWhereInput[];
    OR?: Prisma.chunk_contentsWhereInput[];
    NOT?: Prisma.chunk_contentsWhereInput | Prisma.chunk_contentsWhereInput[];
    document_id?: Prisma.StringFilter<"chunk_contents"> | string;
    content_text?: Prisma.StringFilter<"chunk_contents"> | string;
    embedding_input?: Prisma.StringNullableFilter<"chunk_contents"> | string | null;
    updated_at?: Prisma.DateTimeFilter<"chunk_contents"> | Date | string;
    chunks_metadata?: Prisma.XOR<Prisma.Chunks_metadataScalarRelationFilter, Prisma.chunks_metadataWhereInput>;
}, "chunk_id">;
export type chunk_contentsOrderByWithAggregationInput = {
    chunk_id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    content_text?: Prisma.SortOrder;
    embedding_input?: Prisma.SortOrderInput | Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    _count?: Prisma.chunk_contentsCountOrderByAggregateInput;
    _max?: Prisma.chunk_contentsMaxOrderByAggregateInput;
    _min?: Prisma.chunk_contentsMinOrderByAggregateInput;
};
export type chunk_contentsScalarWhereWithAggregatesInput = {
    AND?: Prisma.chunk_contentsScalarWhereWithAggregatesInput | Prisma.chunk_contentsScalarWhereWithAggregatesInput[];
    OR?: Prisma.chunk_contentsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.chunk_contentsScalarWhereWithAggregatesInput | Prisma.chunk_contentsScalarWhereWithAggregatesInput[];
    chunk_id?: Prisma.StringWithAggregatesFilter<"chunk_contents"> | string;
    document_id?: Prisma.StringWithAggregatesFilter<"chunk_contents"> | string;
    content_text?: Prisma.StringWithAggregatesFilter<"chunk_contents"> | string;
    embedding_input?: Prisma.StringNullableWithAggregatesFilter<"chunk_contents"> | string | null;
    updated_at?: Prisma.DateTimeWithAggregatesFilter<"chunk_contents"> | Date | string;
};
export type chunk_contentsCreateInput = {
    document_id: string;
    content_text?: string;
    embedding_input?: string | null;
    updated_at?: Date | string;
    chunks_metadata: Prisma.chunks_metadataCreateNestedOneWithoutChunk_contentsInput;
};
export type chunk_contentsUncheckedCreateInput = {
    chunk_id: string;
    document_id: string;
    content_text?: string;
    embedding_input?: string | null;
    updated_at?: Date | string;
};
export type chunk_contentsUpdateInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    content_text?: Prisma.StringFieldUpdateOperationsInput | string;
    embedding_input?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chunks_metadata?: Prisma.chunks_metadataUpdateOneRequiredWithoutChunk_contentsNestedInput;
};
export type chunk_contentsUncheckedUpdateInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    content_text?: Prisma.StringFieldUpdateOperationsInput | string;
    embedding_input?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_contentsCreateManyInput = {
    chunk_id: string;
    document_id: string;
    content_text?: string;
    embedding_input?: string | null;
    updated_at?: Date | string;
};
export type chunk_contentsUpdateManyMutationInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    content_text?: Prisma.StringFieldUpdateOperationsInput | string;
    embedding_input?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_contentsUncheckedUpdateManyInput = {
    chunk_id?: Prisma.StringFieldUpdateOperationsInput | string;
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    content_text?: Prisma.StringFieldUpdateOperationsInput | string;
    embedding_input?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_contentsCountOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    content_text?: Prisma.SortOrder;
    embedding_input?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type chunk_contentsMaxOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    content_text?: Prisma.SortOrder;
    embedding_input?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type chunk_contentsMinOrderByAggregateInput = {
    chunk_id?: Prisma.SortOrder;
    document_id?: Prisma.SortOrder;
    content_text?: Prisma.SortOrder;
    embedding_input?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type Chunk_contentsNullableScalarRelationFilter = {
    is?: Prisma.chunk_contentsWhereInput | null;
    isNot?: Prisma.chunk_contentsWhereInput | null;
};
export type chunk_contentsCreateNestedOneWithoutChunks_metadataInput = {
    create?: Prisma.XOR<Prisma.chunk_contentsCreateWithoutChunks_metadataInput, Prisma.chunk_contentsUncheckedCreateWithoutChunks_metadataInput>;
    connectOrCreate?: Prisma.chunk_contentsCreateOrConnectWithoutChunks_metadataInput;
    connect?: Prisma.chunk_contentsWhereUniqueInput;
};
export type chunk_contentsUncheckedCreateNestedOneWithoutChunks_metadataInput = {
    create?: Prisma.XOR<Prisma.chunk_contentsCreateWithoutChunks_metadataInput, Prisma.chunk_contentsUncheckedCreateWithoutChunks_metadataInput>;
    connectOrCreate?: Prisma.chunk_contentsCreateOrConnectWithoutChunks_metadataInput;
    connect?: Prisma.chunk_contentsWhereUniqueInput;
};
export type chunk_contentsUpdateOneWithoutChunks_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.chunk_contentsCreateWithoutChunks_metadataInput, Prisma.chunk_contentsUncheckedCreateWithoutChunks_metadataInput>;
    connectOrCreate?: Prisma.chunk_contentsCreateOrConnectWithoutChunks_metadataInput;
    upsert?: Prisma.chunk_contentsUpsertWithoutChunks_metadataInput;
    disconnect?: Prisma.chunk_contentsWhereInput | boolean;
    delete?: Prisma.chunk_contentsWhereInput | boolean;
    connect?: Prisma.chunk_contentsWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.chunk_contentsUpdateToOneWithWhereWithoutChunks_metadataInput, Prisma.chunk_contentsUpdateWithoutChunks_metadataInput>, Prisma.chunk_contentsUncheckedUpdateWithoutChunks_metadataInput>;
};
export type chunk_contentsUncheckedUpdateOneWithoutChunks_metadataNestedInput = {
    create?: Prisma.XOR<Prisma.chunk_contentsCreateWithoutChunks_metadataInput, Prisma.chunk_contentsUncheckedCreateWithoutChunks_metadataInput>;
    connectOrCreate?: Prisma.chunk_contentsCreateOrConnectWithoutChunks_metadataInput;
    upsert?: Prisma.chunk_contentsUpsertWithoutChunks_metadataInput;
    disconnect?: Prisma.chunk_contentsWhereInput | boolean;
    delete?: Prisma.chunk_contentsWhereInput | boolean;
    connect?: Prisma.chunk_contentsWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.chunk_contentsUpdateToOneWithWhereWithoutChunks_metadataInput, Prisma.chunk_contentsUpdateWithoutChunks_metadataInput>, Prisma.chunk_contentsUncheckedUpdateWithoutChunks_metadataInput>;
};
export type chunk_contentsCreateWithoutChunks_metadataInput = {
    document_id: string;
    content_text?: string;
    embedding_input?: string | null;
    updated_at?: Date | string;
};
export type chunk_contentsUncheckedCreateWithoutChunks_metadataInput = {
    document_id: string;
    content_text?: string;
    embedding_input?: string | null;
    updated_at?: Date | string;
};
export type chunk_contentsCreateOrConnectWithoutChunks_metadataInput = {
    where: Prisma.chunk_contentsWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunk_contentsCreateWithoutChunks_metadataInput, Prisma.chunk_contentsUncheckedCreateWithoutChunks_metadataInput>;
};
export type chunk_contentsUpsertWithoutChunks_metadataInput = {
    update: Prisma.XOR<Prisma.chunk_contentsUpdateWithoutChunks_metadataInput, Prisma.chunk_contentsUncheckedUpdateWithoutChunks_metadataInput>;
    create: Prisma.XOR<Prisma.chunk_contentsCreateWithoutChunks_metadataInput, Prisma.chunk_contentsUncheckedCreateWithoutChunks_metadataInput>;
    where?: Prisma.chunk_contentsWhereInput;
};
export type chunk_contentsUpdateToOneWithWhereWithoutChunks_metadataInput = {
    where?: Prisma.chunk_contentsWhereInput;
    data: Prisma.XOR<Prisma.chunk_contentsUpdateWithoutChunks_metadataInput, Prisma.chunk_contentsUncheckedUpdateWithoutChunks_metadataInput>;
};
export type chunk_contentsUpdateWithoutChunks_metadataInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    content_text?: Prisma.StringFieldUpdateOperationsInput | string;
    embedding_input?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_contentsUncheckedUpdateWithoutChunks_metadataInput = {
    document_id?: Prisma.StringFieldUpdateOperationsInput | string;
    content_text?: Prisma.StringFieldUpdateOperationsInput | string;
    embedding_input?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type chunk_contentsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    document_id?: boolean;
    content_text?: boolean;
    embedding_input?: boolean;
    updated_at?: boolean;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chunk_contents"]>;
export type chunk_contentsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    document_id?: boolean;
    content_text?: boolean;
    embedding_input?: boolean;
    updated_at?: boolean;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chunk_contents"]>;
export type chunk_contentsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    chunk_id?: boolean;
    document_id?: boolean;
    content_text?: boolean;
    embedding_input?: boolean;
    updated_at?: boolean;
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["chunk_contents"]>;
export type chunk_contentsSelectScalar = {
    chunk_id?: boolean;
    document_id?: boolean;
    content_text?: boolean;
    embedding_input?: boolean;
    updated_at?: boolean;
};
export type chunk_contentsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"chunk_id" | "document_id" | "content_text" | "embedding_input" | "updated_at", ExtArgs["result"]["chunk_contents"]>;
export type chunk_contentsInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
};
export type chunk_contentsIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
};
export type chunk_contentsIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chunks_metadata?: boolean | Prisma.chunks_metadataDefaultArgs<ExtArgs>;
};
export type $chunk_contentsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "chunk_contents";
    objects: {
        chunks_metadata: Prisma.$chunks_metadataPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        chunk_id: string;
        document_id: string;
        content_text: string;
        embedding_input: string | null;
        updated_at: Date;
    }, ExtArgs["result"]["chunk_contents"]>;
    composites: {};
};
export type chunk_contentsGetPayload<S extends boolean | null | undefined | chunk_contentsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload, S>;
export type chunk_contentsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<chunk_contentsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Chunk_contentsCountAggregateInputType | true;
};
export interface chunk_contentsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['chunk_contents'];
        meta: {
            name: 'chunk_contents';
        };
    };
    findUnique<T extends chunk_contentsFindUniqueArgs>(args: Prisma.SelectSubset<T, chunk_contentsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__chunk_contentsClient<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends chunk_contentsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, chunk_contentsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__chunk_contentsClient<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends chunk_contentsFindFirstArgs>(args?: Prisma.SelectSubset<T, chunk_contentsFindFirstArgs<ExtArgs>>): Prisma.Prisma__chunk_contentsClient<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends chunk_contentsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, chunk_contentsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__chunk_contentsClient<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends chunk_contentsFindManyArgs>(args?: Prisma.SelectSubset<T, chunk_contentsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends chunk_contentsCreateArgs>(args: Prisma.SelectSubset<T, chunk_contentsCreateArgs<ExtArgs>>): Prisma.Prisma__chunk_contentsClient<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends chunk_contentsCreateManyArgs>(args?: Prisma.SelectSubset<T, chunk_contentsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends chunk_contentsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, chunk_contentsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends chunk_contentsDeleteArgs>(args: Prisma.SelectSubset<T, chunk_contentsDeleteArgs<ExtArgs>>): Prisma.Prisma__chunk_contentsClient<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends chunk_contentsUpdateArgs>(args: Prisma.SelectSubset<T, chunk_contentsUpdateArgs<ExtArgs>>): Prisma.Prisma__chunk_contentsClient<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends chunk_contentsDeleteManyArgs>(args?: Prisma.SelectSubset<T, chunk_contentsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends chunk_contentsUpdateManyArgs>(args: Prisma.SelectSubset<T, chunk_contentsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends chunk_contentsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, chunk_contentsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends chunk_contentsUpsertArgs>(args: Prisma.SelectSubset<T, chunk_contentsUpsertArgs<ExtArgs>>): Prisma.Prisma__chunk_contentsClient<runtime.Types.Result.GetResult<Prisma.$chunk_contentsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends chunk_contentsCountArgs>(args?: Prisma.Subset<T, chunk_contentsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Chunk_contentsCountAggregateOutputType> : number>;
    aggregate<T extends Chunk_contentsAggregateArgs>(args: Prisma.Subset<T, Chunk_contentsAggregateArgs>): Prisma.PrismaPromise<GetChunk_contentsAggregateType<T>>;
    groupBy<T extends chunk_contentsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: chunk_contentsGroupByArgs['orderBy'];
    } : {
        orderBy?: chunk_contentsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, chunk_contentsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChunk_contentsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: chunk_contentsFieldRefs;
}
export interface Prisma__chunk_contentsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    chunks_metadata<T extends Prisma.chunks_metadataDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.chunks_metadataDefaultArgs<ExtArgs>>): Prisma.Prisma__chunks_metadataClient<runtime.Types.Result.GetResult<Prisma.$chunks_metadataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface chunk_contentsFieldRefs {
    readonly chunk_id: Prisma.FieldRef<"chunk_contents", 'String'>;
    readonly document_id: Prisma.FieldRef<"chunk_contents", 'String'>;
    readonly content_text: Prisma.FieldRef<"chunk_contents", 'String'>;
    readonly embedding_input: Prisma.FieldRef<"chunk_contents", 'String'>;
    readonly updated_at: Prisma.FieldRef<"chunk_contents", 'DateTime'>;
}
export type chunk_contentsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
    where: Prisma.chunk_contentsWhereUniqueInput;
};
export type chunk_contentsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
    where: Prisma.chunk_contentsWhereUniqueInput;
};
export type chunk_contentsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
    where?: Prisma.chunk_contentsWhereInput;
    orderBy?: Prisma.chunk_contentsOrderByWithRelationInput | Prisma.chunk_contentsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_contentsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunk_contentsScalarFieldEnum | Prisma.Chunk_contentsScalarFieldEnum[];
};
export type chunk_contentsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
    where?: Prisma.chunk_contentsWhereInput;
    orderBy?: Prisma.chunk_contentsOrderByWithRelationInput | Prisma.chunk_contentsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_contentsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunk_contentsScalarFieldEnum | Prisma.Chunk_contentsScalarFieldEnum[];
};
export type chunk_contentsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
    where?: Prisma.chunk_contentsWhereInput;
    orderBy?: Prisma.chunk_contentsOrderByWithRelationInput | Prisma.chunk_contentsOrderByWithRelationInput[];
    cursor?: Prisma.chunk_contentsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Chunk_contentsScalarFieldEnum | Prisma.Chunk_contentsScalarFieldEnum[];
};
export type chunk_contentsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunk_contentsCreateInput, Prisma.chunk_contentsUncheckedCreateInput>;
};
export type chunk_contentsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.chunk_contentsCreateManyInput | Prisma.chunk_contentsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type chunk_contentsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    data: Prisma.chunk_contentsCreateManyInput | Prisma.chunk_contentsCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.chunk_contentsIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type chunk_contentsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunk_contentsUpdateInput, Prisma.chunk_contentsUncheckedUpdateInput>;
    where: Prisma.chunk_contentsWhereUniqueInput;
};
export type chunk_contentsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.chunk_contentsUpdateManyMutationInput, Prisma.chunk_contentsUncheckedUpdateManyInput>;
    where?: Prisma.chunk_contentsWhereInput;
    limit?: number;
};
export type chunk_contentsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.chunk_contentsUpdateManyMutationInput, Prisma.chunk_contentsUncheckedUpdateManyInput>;
    where?: Prisma.chunk_contentsWhereInput;
    limit?: number;
    include?: Prisma.chunk_contentsIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type chunk_contentsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
    where: Prisma.chunk_contentsWhereUniqueInput;
    create: Prisma.XOR<Prisma.chunk_contentsCreateInput, Prisma.chunk_contentsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.chunk_contentsUpdateInput, Prisma.chunk_contentsUncheckedUpdateInput>;
};
export type chunk_contentsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
    where: Prisma.chunk_contentsWhereUniqueInput;
};
export type chunk_contentsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.chunk_contentsWhereInput;
    limit?: number;
};
export type chunk_contentsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.chunk_contentsSelect<ExtArgs> | null;
    omit?: Prisma.chunk_contentsOmit<ExtArgs> | null;
    include?: Prisma.chunk_contentsInclude<ExtArgs> | null;
};
