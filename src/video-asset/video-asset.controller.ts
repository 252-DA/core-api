import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VideoAssetService } from './video-asset.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';
import { parseOptionalInt } from '../common/query-params';
import {
  AttachVideoAssetDto,
  CheckVideoHashDto,
  ConfirmVideoAssetUploadDto,
  CreateVideoAssetUploadDto,
  ForkVideoAssetDto,
  UpdateVideoAssetDto,
} from './dto/video-asset.dto';

@Controller('api/video-assets')
@UseGuards(BffJwtGuard)
export class VideoAssetController {
  constructor(private readonly videoAsset: VideoAssetService) {}

  @Get()
  async listAssets(
    @CurrentBffClaims() claims: BffClaims,
    @Query('scope') scope?: 'mine' | 'course' | 'public',
    @Query('courseId') courseId?: string,
    @Query('sourceType') sourceType?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.videoAsset.listAssets(claims, {
      scope,
      courseId,
      sourceType,
      search,
      limit: parseOptionalInt(limit, 'limit'),
      offset: parseOptionalInt(offset, 'offset'),
    });
  }

  @Post('check-hash')
  async checkHash(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: CheckVideoHashDto,
  ) {
    return this.videoAsset.checkHash(claims, body);
  }

  @Post('upload')
  async createUpload(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: CreateVideoAssetUploadDto,
  ) {
    return this.videoAsset.createUpload(claims, body);
  }

  @Post('attach')
  async attachToMicroContent(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: AttachVideoAssetDto,
  ) {
    return this.videoAsset.attachToMicroContent(claims, body);
  }

  @Get(':id')
  async getAsset(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') assetId: string,
  ) {
    return this.videoAsset.getAsset(claims, { assetId });
  }

  @Post(':id/confirm-upload')
  async confirmUpload(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') assetId: string,
    @Body() body: ConfirmVideoAssetUploadDto = {},
  ) {
    return this.videoAsset.confirmUpload(claims, { assetId, ...body });
  }

  @Get(':id/stream-url')
  async getStreamUrl(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') assetId: string,
    @Query('microContentId') microContentId?: string,
  ) {
    return this.videoAsset.getStreamUrl(claims, { assetId, microContentId });
  }

  @Patch(':id')
  async updateAsset(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') assetId: string,
    @Body() body: UpdateVideoAssetDto,
  ) {
    return this.videoAsset.updateAsset(claims, { assetId, ...body });
  }

  @Delete(':id')
  async deleteAsset(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') assetId: string,
  ) {
    return this.videoAsset.deleteAsset(claims, { assetId });
  }

  @Post(':id/fork')
  async forkAsset(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') assetId: string,
    @Body() body: ForkVideoAssetDto = {},
  ) {
    return this.videoAsset.forkAsset(claims, { assetId, ...body });
  }
}
