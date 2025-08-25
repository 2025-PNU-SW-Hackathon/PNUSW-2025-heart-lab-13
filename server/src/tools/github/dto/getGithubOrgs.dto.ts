export interface GetGithubOrgsResItem {
  login: string;
  id: number;
  avatar_url: string;
  [key: string]: any; // To allow additional properties
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GetGithubOrgsRes extends Array<GetGithubOrgsResItem> {}
