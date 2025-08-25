import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ExceptionMessage } from 'src/constants/ExceptionMessage';
import { PerformanceReference } from 'src/performance/model/performanceReference.entity';
import {
  REFERENCE_SOURCE_TYPE,
  ReferenceData,
  ReferenceSourceType,
} from 'src/performance/model/reference.const';
import { GithubService } from 'src/tools/github/github.service';

export interface ReferenceDto {
  id: string;
  sourceType: ReferenceSourceType;
  sourceId: string;
  data: ReferenceData;
}

@Injectable()
export class ReferenceBuilder {
  private readonly toolMap = new Map<
    ReferenceSourceType,
    (params: {
      userId: string;
      reference: PerformanceReference;
    }) => Promise<ReferenceData>
  >();

  constructor(private readonly githubService: GithubService) {
    this.toolMap = new Map([
      [
        REFERENCE_SOURCE_TYPE.GITHUB_PULL_REQUEST,
        (params: { userId: string; reference: PerformanceReference }) => {
          const { userId, reference } = params;

          const { orgName, repoName, prNumber } =
            githubService.githubPrDetailParamsParser(reference.sourceId) || {};

          if (!orgName || !repoName || !prNumber) {
            throw new UnprocessableEntityException(
              ExceptionMessage.INVALID_SOURCE_ID,
            );
          }

          return githubService.getPrDetail({
            userId,
            orgName,
            repoName,
            prNumber,
          });
        },
      ],
    ]);
  }

  async buildReference(params: {
    userId: string;
    reference: PerformanceReference;
  }): Promise<ReferenceDto> {
    const { userId, reference } = params;

    const toolFunc = this.toolMap
      .get(reference.sourceType)
      ?.bind(this) as (params: {
      userId: string;
      reference: PerformanceReference;
    }) => Promise<ReferenceData>;

    if (!toolFunc) {
      throw new UnprocessableEntityException(
        ExceptionMessage.INVALID_SOURCE_TYPE,
      );
    }

    const data = await toolFunc({ userId, reference });

    return {
      id: reference.id,
      sourceType: reference.sourceType,
      sourceId: reference.sourceId,
      data,
    };
  }
}
