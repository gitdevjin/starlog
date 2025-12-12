import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;

  // Mock the AppService
  const mockAppService = {
    getHello: jest.fn().mockResolvedValue('Hello World!'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: mockAppService }, // Inject mock instead of real service
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', async () => {
      const result = await appController.getHello();
      expect(result).toBe('Hello World!');
    });
  });
});
