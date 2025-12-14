import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ProviderAService } from './provider-a.service';
import { ProviderBService } from './provider-b.service';
import { ProviderCService } from './provider-c.service';

@Module({
    imports: [HttpModule],
    providers: [ProviderAService, ProviderBService, ProviderCService],
    exports: [ProviderAService, ProviderBService, ProviderCService],
})
export class ProvidersModule {}
