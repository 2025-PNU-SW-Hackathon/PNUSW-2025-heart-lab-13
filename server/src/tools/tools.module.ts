import { Module } from '@nestjs/common';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { GithubModule } from 'src/tools/github/github.module';

@Module({
  controllers: [ToolsController],
  providers: [ToolsService],
  imports: [GithubModule],
})
export class ToolsModule {}
