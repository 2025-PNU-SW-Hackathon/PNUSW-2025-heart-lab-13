import { ApiProperty } from '@nestjs/swagger';
import { TOOL_TYPE, ToolType } from 'src/user/model/toolType.const';
import { GetUserInfoQueryResult } from 'src/user/query/getUesrInfo.query';

export class GetUserInfoResponseTool {
  @ApiProperty({
    description: '툴 종류',
    enum: TOOL_TYPE,
    example: TOOL_TYPE.GITHUB,
  })
  type: ToolType;

  @ApiProperty({
    description: '연동 만료일',
    example: '2023-12-31T23:59:59.999Z',
    nullable: true,
  })
  expiresAt: Date | null;
}

export class GetUserInfoResponseDto {
  @ApiProperty({
    description: '유저 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: '유저 이메일',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '유저 이름',
    example: '홍길동',
  })
  username: string;

  @ApiProperty({
    description: '유저 협업툴 연동 목록',
    type: [GetUserInfoResponseTool],
  })
  tools: GetUserInfoResponseTool[];

  static buildFromQueryResult(
    result: GetUserInfoQueryResult,
  ): GetUserInfoResponseDto {
    const res = new GetUserInfoResponseDto();

    res.userId = result.userId;
    res.email = result.email;
    res.username = result.username;
    res.tools = result.tools.map((tool) => {
      const res = new GetUserInfoResponseTool();

      res.type = tool.type;
      res.expiresAt = tool.expiresAt;

      return res;
    });

    return res;
  }
}
