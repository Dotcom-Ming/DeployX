import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ApiTokensService } from './api-tokens.service';
import { createTokenSchema } from './dto/create-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users/me/tokens')
@UseGuards(JwtAuthGuard)
export class ApiTokensController {
  constructor(private readonly apiTokensService: ApiTokensService) {}

  @Get()
  async list(@Request() req: ExpressRequest & { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.apiTokensService.list(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req: ExpressRequest & { user: { sub: string } }, @Body() body: unknown) {
    const data = createTokenSchema.parse(body);
    const userId = req.user.sub;
    return this.apiTokensService.create(userId, data.name, data.scopes, data.expiresAt);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async revoke(@Request() req: ExpressRequest & { user: { sub: string } }, @Param('id') tokenId: string) {
    const userId = req.user.sub;
    return this.apiTokensService.revoke(tokenId, userId);
  }
}
