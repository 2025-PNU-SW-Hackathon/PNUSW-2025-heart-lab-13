import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ExceptionMessage } from 'src/constants/ExceptionMessage';
import { GetGithubOrgsRes } from 'src/tools/github/dto/getGithubOrgs.dto';
import { GetGithubOrgPrsRes } from 'src/tools/github/dto/getGithubOrgPrs.dto';
import { GetGithubPrDetailRes } from 'src/tools/github/dto/getGithubPrDetail.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class GithubAdapter {
  constructor(private readonly httpService: HttpService) {}

  async getOrganizations(params: {
    accessToken: string;
  }): Promise<GetGithubOrgsRes> {
    const { accessToken } = params;

    const { data } = await firstValueFrom(
      this.httpService
        .get<GetGithubOrgsRes>('/user/orgs', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            console.log('Error fetching GitHub organizations:', error.message);
            throw new InternalServerErrorException(
              ExceptionMessage.CANNOT_GET_GITHUB_ORGANIZATIONS,
              error,
            );
          }),
        ),
    );

    return data;
  }

  async getOrganizationPrs(params: {
    accessToken: string;
    orgName: string;
    startDate: Date | null;
    endDate: Date | null;
    limit: number;
    page: number;
  }): Promise<GetGithubOrgPrsRes> {
    const { accessToken, orgName, startDate, endDate, limit, page } = params;

    const createdQuery =
      startDate || endDate
        ? `+created:${startDate ? dayjs(startDate).format('YYYY-MM-DD') : '*'}..${endDate ? dayjs(endDate).format('YYYY-MM-DD') : '*'}`
        : '';
    const queryString = `is:pr+assignee:@me+org:${orgName}${createdQuery}`;
    console.log(queryString);

    const { data } = await firstValueFrom(
      this.httpService
        .get<GetGithubOrgPrsRes>(
          `/search/issues?q=${queryString}`, // Using queryString to filter PRs
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              per_page: limit,
              page,
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            console.log(
              'Error fetching GitHub organization repositories:',
              error.message,
              error.response?.data,
            );
            throw new InternalServerErrorException(
              ExceptionMessage.CANNOT_GET_GITHUB_PRS,
              error,
            );
          }),
        ),
    );

    return data;
  }

  async getPrDetail(params: {
    accessToken: string;
    orgName: string;
    repoName: string;
    prNumber: number;
  }): Promise<GetGithubPrDetailRes> {
    const { accessToken, orgName, repoName, prNumber } = params;

    const { data } = await firstValueFrom(
      this.httpService
        .get<GetGithubPrDetailRes>(
          `/repos/${orgName}/${repoName}/pulls/${prNumber}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            console.log('Error fetching PR detail:', error.message);
            throw new InternalServerErrorException(
              ExceptionMessage.CANNOT_GET_GITHUB_PR_DETAIL,
              error,
            );
          }),
        ),
    );

    return data;
  }
}
