import { Test, TestingModule } from '@nestjs/testing';
import { PlanetController } from './planet.controller';
import { PlanetService } from './planet.service';

describe('PostController', () => {
  let controller: PlanetController;
  let mockPostService: Partial<PlanetService>;

  beforeEach(async () => {
    mockPostService = {
      createPlanet: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanetController],
      providers: [
        {
          provide: PlanetService,
          useValue: mockPostService,
        },
      ],
    }).compile();

    controller = module.get<PlanetController>(PlanetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
