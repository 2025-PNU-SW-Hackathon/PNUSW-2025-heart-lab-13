import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExceptionMessage } from 'src/constants/ExceptionMessage';
import { DeletePerformanceCommand } from 'src/performance/command/deletePerformance.command';
import {
  UpsertPerformanceCommand,
  UpsertPerformanceCommandResult,
} from 'src/performance/command/upsertPerformance.command';
import { PerformanceFactory } from 'src/performance/model/factory/performance.factory';
import { PerformanceReferenceFactory } from 'src/performance/model/factory/performanceReference.factory';
import { Performance } from 'src/performance/model/performance.entity';
import {
  GetPerformanceQuery,
  GetPerformanceQueryResult,
} from 'src/performance/query/getPerformance.query';
import {
  GetPerformancesQuery,
  GetPerformancesQueryResult,
} from 'src/performance/query/getPerformances.query';
import { ReferenceBuilder } from 'src/performance/reference.builder';
import { User } from 'src/user/model/user.entity';
import { IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly performanceFactory: PerformanceFactory,
    private readonly performanceReferenceFactory: PerformanceReferenceFactory,
    @InjectRepository(Performance)
    private performanceRepository: Repository<Performance>,
    private readonly referenceBuilder: ReferenceBuilder,
  ) {}

  async upsertPerformance(
    command: UpsertPerformanceCommand,
  ): Promise<UpsertPerformanceCommandResult> {
    const { userId, performance: performanceInput } = command;
    const {
      id,
      title,
      startDate,
      endDate,
      description,
      contribution,
      outcome,
      references: referencesInput,
    } = performanceInput;

    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException(ExceptionMessage.USER_NOT_FOUND);
    }

    let performance: Performance | null = null;

    if (id) {
      performance = await this.performanceRepository.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['user', 'references'],
      });

      if (performance && performance.user.id !== userId) {
        throw new NotFoundException(ExceptionMessage.PERFORMANCE_NOT_FOUND);
      }
    } else {
      performance = this.performanceFactory.create({
        user,
        title: null,
        startDate: null,
        endDate: null,
        description: null,
        contribution: null,
        outcome: null,
        references: [],
      });
    }

    if (!performance) {
      throw new NotFoundException(ExceptionMessage.PERFORMANCE_NOT_FOUND);
    }

    performance.title = title;
    performance.startDate = startDate;
    performance.endDate = endDate;
    performance.description = description;
    performance.contribution = contribution;
    performance.outcome = outcome;

    const references = referencesInput.map((ref) =>
      this.performanceReferenceFactory.create({
        sourceId: ref.sourceId,
        sourceType: ref.sourceType,
      }),
    );

    performance.references = references;

    await this.performanceRepository.save(performance);

    return {
      id: performance.id,
      title: performance.title,
      startDate: performance.startDate,
      endDate: performance.endDate,
      description: performance.description,
      contribution: performance.contribution,
      outcome: performance.outcome,
      references: performance.references.map((ref) => ({
        id: ref.id,
        sourceType: ref.sourceType,
        sourceId: ref.sourceId,
      })),
      createdAt: performance.createdAt,
      updatedAt: performance.updatedAt,
    };
  }

  async getPerformances(
    query: GetPerformancesQuery,
  ): Promise<GetPerformancesQueryResult> {
    const { userId, startDate, endDate, page, limit } = query;

    const [performances, count] = await this.performanceRepository.findAndCount(
      {
        where: {
          user: {
            id: userId,
          },
          ...(startDate ? { startDate: MoreThanOrEqual(startDate) } : {}),
          ...(endDate ? { endDate: LessThanOrEqual(endDate) } : {}),
          deletedAt: IsNull(),
        },
        skip: (page - 1) * limit,
        take: limit,
        order: {
          createdAt: 'DESC',
        },
        relations: ['references'],
      },
    );

    return {
      count,
      performances: performances.map((performance) => ({
        id: performance.id,
        title: performance.title,
        startDate: performance.startDate,
        endDate: performance.endDate,
        description: performance.description,
        contribution: performance.contribution,
        outcome: performance.outcome,
        references: performance.references.map((ref) => ({
          id: ref.id,
          sourceType: ref.sourceType,
          sourceId: ref.sourceId,
        })),
        createdAt: performance.createdAt,
        updatedAt: performance.updatedAt,
      })),
    };
  }

  async getPerformance(
    query: GetPerformanceQuery,
  ): Promise<GetPerformanceQueryResult> {
    const { userId, id } = query;

    const performance = await this.performanceRepository.findOne({
      where: { id, user: { id: userId }, deletedAt: IsNull() },
      relations: ['references'],
    });

    if (!performance) {
      throw new NotFoundException(ExceptionMessage.PERFORMANCE_NOT_FOUND);
    }

    const referenceDtos = await Promise.all(
      performance.references.map((ref) =>
        this.referenceBuilder.buildReference({
          userId,
          reference: ref,
        }),
      ),
    );

    return {
      id: performance.id,
      title: performance.title,
      startDate: performance.startDate,
      endDate: performance.endDate,
      description: performance.description,
      contribution: performance.contribution,
      outcome: performance.outcome,
      references: referenceDtos.map((dto) => ({
        id: dto.id,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        data: dto.data,
      })),
      createdAt: performance.createdAt,
      updatedAt: performance.updatedAt,
    };
  }

  async deletePerformance(command: DeletePerformanceCommand): Promise<void> {
    const { userId, id } = command;

    const performance = await this.performanceRepository.findOne({
      where: { id, user: { id: userId }, deletedAt: IsNull() },
    });

    if (!performance) {
      throw new NotFoundException(ExceptionMessage.PERFORMANCE_NOT_FOUND);
    }

    const now = new Date();

    performance.updatedAt = now;
    performance.deletedAt = now;

    await this.performanceRepository.save(performance);
  }
}
