import { Global, Module } from '@nestjs/common';
import { LoginCodeGeneratorHelper } from 'src/helper/loginCodeGenerator.helper';
import { TokenGeneratorHelper } from 'src/helper/tokenGenerator.helper';
import { UrlBuilderHelper } from 'src/helper/urlBuilder.helper';

const providers = [
  TokenGeneratorHelper,
  UrlBuilderHelper,
  LoginCodeGeneratorHelper,
];

@Global()
@Module({
  providers,
  exports: providers,
})
export class HelperModule {}
