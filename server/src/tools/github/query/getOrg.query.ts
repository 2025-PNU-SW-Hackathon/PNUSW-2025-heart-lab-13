export interface GetOrganizationsQuery {
  userId: string;
}

export interface GetOrganizationsQueryResultOrg {
  id: number;
  login: string;
  avatarUrl: string;
}

export interface GetOrganizationsQueryResult {
  count: number;
  orgs: GetOrganizationsQueryResultOrg[];
}
