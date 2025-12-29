import { Test, TestingModule } from '@nestjs/testing';
import { StargateController } from './stargate.controller';
import { StargateService } from './stargate.service';

describe('StargateController', () => {
  let controller: StargateController;
  let mockStargateService: Partial<StargateService>;

  beforeEach(async () => {
    const mockStargateService = {
      createStargate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StargateController],
      providers: [
        {
          provide: StargateService,
          useValue: mockStargateService,
        },
      ],
    }).compile();

    controller = module.get<StargateController>(StargateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
