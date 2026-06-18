import { Global, Module } from "@nestjs/common";
import { MediaService } from "./media.service";
import { MediaController } from "./media.controller";
import { LocalStorageAdapter } from "../storage/local-storage.adapter";
import { STORAGE_ADAPTER } from "../storage/storage.interface";

@Global()
@Module({
  providers: [
    MediaService,
    LocalStorageAdapter,
    // Driver selection point: swap for an S3 adapter via STORAGE_DRIVER later.
    { provide: STORAGE_ADAPTER, useExisting: LocalStorageAdapter },
  ],
  controllers: [MediaController],
  exports: [MediaService, STORAGE_ADAPTER],
})
export class MediaModule {}
