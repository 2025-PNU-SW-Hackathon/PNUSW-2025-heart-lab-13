import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExceptionMessage } from 'src/constants/ExceptionMessage';
import { GithubAdapter } from 'src/tools/github/github.adapter';
import {
  GetOrganizationsQuery,
  GetOrganizationsQueryResult,
} from 'src/tools/github/query/getOrg.query';
import {
  GetOrganizationPullRequestsQuery,
  GetOrganizationPullRequestsQueryResult,
} from 'src/tools/github/query/getOrgPrs.query';
import {
  GetPullRequestDetailQuery,
  GetPullRequestDetailQueryResult,
} from 'src/tools/github/query/getPrDetail.query';
import { ToolCredential } from 'src/user/model/toolCredential.entity';
import { TOOL_TYPE } from 'src/user/model/toolType.const';
import { Repository } from 'typeorm';

@Injectable()
export class GithubService {
  constructor(
    private readonly githubAdapter: GithubAdapter,
    @InjectRepository(ToolCredential)
    private readonly toolCredentialRepository: Repository<ToolCredential>,
  ) {}

  async getOrganizations(
    query: GetOrganizationsQuery,
  ): Promise<GetOrganizationsQueryResult> {
    const { userId } = query;

    const toolCredential = await this.getGithubCredential(userId);

    const orgs = await this.githubAdapter.getOrganizations({
      accessToken: toolCredential.accessToken,
    });

    return {
      count: orgs.length,
      orgs: orgs.map((org) => ({
        id: org.id,
        login: org.login,
        avatarUrl: org.avatar_url,
      })),
    };
  }

  async getOrganizationPullRequests(
    query: GetOrganizationPullRequestsQuery,
  ): Promise<GetOrganizationPullRequestsQueryResult> {
    const { userId, orgName, startDate, endDate, page, limit } = query;

    const toolCredential = await this.getGithubCredential(userId);

    const { items: prs, total_count: count } =
      await this.githubAdapter.getOrganizationPrs({
        accessToken: toolCredential.accessToken,
        orgName,
        startDate,
        endDate,
        page,
        limit,
      });

    return {
      count,
      prs: prs.map((pr) => ({
        id: pr.id,
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
        createdAt: new Date(pr.created_at),
        updatedAt: new Date(pr.updated_at),
        state: pr.state,
        assignees: pr.assignees.map((assignee) => ({
          id: assignee.id,
          name: assignee.login,
          avatarUrl: assignee.avatar_url,
        })),
        description: pr.body || null,
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        sourceId: this.buildPrDetailSourceId({
          orgName,
          repoName: pr.repository_url.split('/').pop() || '',
          prNumber: pr.number,
        }),
      })),
    };
  }

  async getPrDetail(
    query: GetPullRequestDetailQuery,
  ): Promise<GetPullRequestDetailQueryResult> {
    const { userId, orgName, repoName, prNumber } = query;

    const toolCredential = await this.getGithubCredential(userId);

    const prDetail = await this.githubAdapter.getPrDetail({
      accessToken: toolCredential.accessToken,
      orgName,
      repoName,
      prNumber,
    });

    return {
      id: prDetail.id,
      number: prDetail.number,
      url: prDetail.html_url,
      title: prDetail.title,
      description: prDetail.body || null,
      base: {
        label: prDetail.base.label,
        ref: prDetail.base.ref,
      },
      head: {
        label: prDetail.head.label,
        ref: prDetail.head.ref,
      },
      createdAt: new Date(prDetail.created_at),
      updatedAt: new Date(prDetail.updated_at),
      mergedAt: prDetail.merged_at ? new Date(prDetail.merged_at) : null,
      closedAt: prDetail.closed_at ? new Date(prDetail.closed_at) : null,
      state: prDetail.state,
      assignees: prDetail.assignees.map((assignee) => ({
        id: assignee.id,
        name: assignee.login,
        avatarUrl: assignee.avatar_url,
      })),
      labels: prDetail.labels
        ? prDetail.labels.map((label) => ({
            id: label.id,
            name: label.name,
            description: label.description || null,
            color: label.color,
          }))
        : [],
      mergedBy: prDetail.merged_by
        ? {
            id: prDetail.merged_by.id,
            name: prDetail.merged_by.login,
            avatarUrl: prDetail.merged_by.avatar_url,
          }
        : null,

      sourceId: this.buildPrDetailSourceId({
        orgName,
        repoName,
        prNumber,
      }),
    };
  }

  private GITHUB_PR_DETAIL_PATH_REGEX =
    '/repos/(?<orgName>[^/]+)/(?<repoName>[^/]+)/pulls/(?<prNumber>\\d+)';

  githubPrDetailParamsParser(
    path: string,
  ): { orgName: string; repoName: string; prNumber: number } | null {
    const match = path.match(this.GITHUB_PR_DETAIL_PATH_REGEX);
    if (!match) return null;

    const [, orgName, repoName, prNumber] = match;
    return { orgName, repoName, prNumber: Number(prNumber) };
  }

  private async getGithubCredential(userId: string): Promise<ToolCredential> {
    const credential = await this.toolCredentialRepository.findOne({
      where: {
        user: { id: userId },
        toolType: TOOL_TYPE.GITHUB,
      },
    });

    if (!credential) {
      throw new UnprocessableEntityException(
        ExceptionMessage.GITHUB_IS_NOT_CONNECTED,
      );
    }

    return credential;
  }

  private buildPrDetailSourceId(params: {
    orgName: string;
    repoName: string;
    prNumber: number;
  }): string {
    const { orgName, repoName, prNumber } = params;
    return `/repos/${orgName}/${repoName}/pulls/${prNumber}`;
  }
}
