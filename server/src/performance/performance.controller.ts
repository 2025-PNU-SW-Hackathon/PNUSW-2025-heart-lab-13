import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUserDto } from 'src/auth/dto/authUser.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetPerformanceResponseDto } from 'src/performance/interface/getPerformance.dto';
import {
  GetPerformancesRequestDto,
  GetPerformancesResponseDto,
} from 'src/performance/interface/getPerformances.dto';
import {
  UpsertPerformanceRequestDto,
  UpsertPerformanceResponseDto,
} from 'src/performance/interface/upsertPerformance.dto';
import { EvaluatePerformanceResponseDto } from 'src/performance/interface/evaluatePerformance.dto';
import { PerformanceService } from 'src/performance/performance.service';
import { PerformanceEvaluationService } from 'src/performance/ai/performance-evaluation.service';

@ApiTags('/performances')
@Controller('performances')
export class PerformanceController {
  constructor(
    private readonly performanceService: PerformanceService,
    private readonly performanceEvaluationService: PerformanceEvaluationService,
  ) {}

  // upsert
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Upsert performance',
    description: 'Create or update a performance record',
  })
  @ApiOkResponse({
    description: 'Performance record created or updated successfully',
    type: UpsertPerformanceResponseDto,
  })
  @ApiCookieAuth('w_auth')
  @ApiBearerAuth()
  @Put('')
  async upsertPerformance(
    @Req() req: Request,
    @Body() body: UpsertPerformanceRequestDto,
  ): Promise<UpsertPerformanceResponseDto> {
    const authUser = req.user as AuthUserDto;
    const { userId } = authUser;
    const {
      id,
      title,
      startDate,
      endDate,
      description,
      contribution,
      outcome,
      references,
    } = body;

    const result = await this.performanceService.upsertPerformance({
      userId,
      performance: {
        id,
        title,
        startDate,
        endDate,
        description,
        contribution,
        outcome,
        references,
      },
    });

    return UpsertPerformanceResponseDto.buildFromCommandResult(result);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '성과 리스트 조회',
    description: '사용자의 성과 리스트를 조회합니다.',
  })
  @ApiOkResponse({
    description: '성과 리스트 조회 성공',
    type: GetPerformancesResponseDto,
  })
  @ApiCookieAuth('w_auth')
  @ApiBearerAuth()
  @Get('')
  async getPerformances(
    @Req() req: Request,
    @Query() dto: GetPerformancesRequestDto,
  ): Promise<GetPerformancesResponseDto> {
    const authUser = req.user as AuthUserDto;
    const { userId } = authUser;
    const { startDate, endDate, page, limit } = dto;

    const result = await this.performanceService.getPerformances({
      userId,
      startDate,
      endDate,
      page,
      limit,
    });

    return GetPerformancesResponseDto.buildFromQueryResult(result);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '성과 리스트 조회',
    description: '사용자의 성과 리스트를 조회합니다.',
  })
  @ApiOkResponse({
    description: '성과 상세 조회 성공',
    type: GetPerformanceResponseDto,
  })
  @ApiCookieAuth('w_auth')
  @ApiBearerAuth()
  @Get('/:id')
  async getPerformance(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<GetPerformanceResponseDto> {
    const authUser = req.user as AuthUserDto;
    const { userId } = authUser;

    const result = await this.performanceService.getPerformance({
      userId,
      id,
    });

    return GetPerformanceResponseDto.buildFromQueryResult(result);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '성과 삭제',
    description: '사용자의 성과를 삭제합니다.',
  })
  @ApiOkResponse({
    description: '성과 삭제 성공',
  })
  @ApiCookieAuth('w_auth')
  @ApiBearerAuth()
  @Delete('/:id')
  async deletePerformance(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const authUser = req.user as AuthUserDto;
    const { userId } = authUser;

    await this.performanceService.deletePerformance({
      userId,
      id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'AI 성과 평가',
    description: '선택된 성과에 대해 AI가 종합적으로 평가합니다.',
  })
  @ApiOkResponse({
    description: 'AI 성과 평가 성공',
    type: EvaluatePerformanceResponseDto,
  })
  @ApiCookieAuth('w_auth')
  @ApiBearerAuth()
  @Post('/:id/evaluate')
  async evaluatePerformance(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<EvaluatePerformanceResponseDto> {
    const authUser = req.user as AuthUserDto;
    const { userId } = authUser;

    const evaluation =
      await this.performanceEvaluationService.evaluatePerformance({
        userId,
        performanceId: id,
      });

    return new EvaluatePerformanceResponseDto({
      performanceId: id,
      evaluation,
    });
  }
}
