import { Test, TestingModule } from '@nestjs/testing';
import { MoonController } from './moon.controller';
import { MoonService } from './moon.service';

describe('MoonController', () => {
  let controller: MoonController;
  let mockMoonService: Partial<MoonService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoonController],
      providers: [{ provide: MoonService, useValue: mockMoonService }],
    }).compile();

    controller = module.get<MoonController>(MoonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
