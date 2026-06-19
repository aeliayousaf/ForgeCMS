import { Module } from "@nestjs/common";
import { ReactBitsController } from "./react-bits.controller";
import { ReactBitsService } from "./react-bits.service";

@Module({
  controllers: [ReactBitsController],
  providers: [ReactBitsService],
  exports: [ReactBitsService],
})
export class ReactBitsModule {}
