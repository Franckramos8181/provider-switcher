import { Module } from '@nestjs/common';
import { ProviderAService } from './provider-a.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    providers: [ProviderAService],
    exports: [ProviderAService],
})
export class ProvidersModule {}
